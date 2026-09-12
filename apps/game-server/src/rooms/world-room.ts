import { Client, Room, ServerError } from "@colyseus/core";
import {
  alphaConfig,
  getWorldMap,
  verdantisMobSpawns,
  worldConfig,
  worldRespawnConfig,
  type WorldMapDefinition,
  type WorldMobSpawnDef,
} from "@nexora/config";
import { prisma } from "@nexora/database";
import { applyMoveIntent, createSeededRandom, distance, findPortal, rollWildEncounter, seedFromParts } from "@nexora/game-engine";
import type { EnterMapMessage, InteractMessage, MapTransferMessage, MoveInputMessage, WildEncounterMessage } from "@nexora/types";
import { WORLD_MESSAGES } from "@nexora/types";
import { verifyAccessToken } from "../auth/verify-access";
import { InputGuard } from "../net/input-guard";
import { PositionStore } from "../persist/position-store";
import { MobState, NpcState, PlayerState, WorldState } from "./schemas";

export type RoomAuth = {
  userId: string;
  characterId: string;
  name: string;
};

export class WorldRoom extends Room<WorldState> {
  maxClients = 32;
  patchRate = worldConfig.tickMs;

  private map!: WorldMapDefinition;
  private readonly guard = new InputGuard();
  private readonly positions = new PositionStore();
  private persistTimer?: ReturnType<typeof setInterval>;
  private readonly steps = new Map<string, number>();

  static async onAuth(_token: string, options: { accessToken?: string; characterId?: string }): Promise<RoomAuth> {
    if (options?.characterId) {
      throw new ServerError(401, "UNAUTHORIZED");
    }

    const claims = verifyAccessToken(options?.accessToken ?? "");
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: { character: true },
    });

    if (!user || user.deletedAt || !user.character) {
      throw new ServerError(401, "NO_CHARACTER");
    }

    return {
      userId: user.id,
      characterId: user.character.id,
      name: user.character.name,
    };
  }

  async onCreate() {
    this.setState(new WorldState());
    const map = getWorldMap(this.roomName);
    if (!map) {
      throw new Error(`Unknown map: ${this.roomName}`);
    }
    this.map = map;
    this.state.mapKey = map.key;
    await this.hydrateNpcs();
    this.hydrateMobs();

    this.onMessage(WORLD_MESSAGES.MOVE_INPUT, (client, message: MoveInputMessage) => {
      this.handleMove(client, message);
    });
    this.onMessage(WORLD_MESSAGES.INTERACT, (client, message: InteractMessage) => {
      this.handleInteract(client, message);
    });
    this.onMessage(WORLD_MESSAGES.ENTER_MAP, (client, message: EnterMapMessage) => {
      void this.handleEnterMap(client, message);
    });

    this.persistTimer = setInterval(() => {
      void this.positions.flushDue();
    }, worldConfig.persistThrottleMs);
  }

  async onJoin(client: Client, _options: unknown, auth: RoomAuth) {
    const character = await prisma.character.findUnique({ where: { id: auth.characterId } });
    if (!character) {
      throw new Error("NO_CHARACTER");
    }

    const player = new PlayerState();
    player.characterId = character.id;
    player.name = character.name;
    player.mapKey = this.map.key;
    player.facing = "down";

    const unplaced = character.posX === 0 && character.posY === 0;
    const wrongMap = character.mapKey !== this.map.key;
    if (unplaced || wrongMap) {
      player.x = this.map.spawn.x;
      player.y = this.map.spawn.y;
    } else {
      player.x = character.posX;
      player.y = character.posY;
    }

    const companion = await prisma.partySlot.findFirst({
      where: { characterId: character.id },
      orderBy: { slot: "asc" },
      include: { creature: { include: { species: true } } },
    });
    if (companion?.creature) {
      player.companionCreatureId = companion.creature.id;
      player.companionSpeciesKey = companion.creature.species.key;
      player.companionTemperament = companion.creature.temperament;
    }

    this.state.players.set(client.sessionId, player);
    this.positions.mark(character.id, this.map.key, player.x, player.y);
    await this.positions.flushOne(character.id);
  }

  async onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    this.guard.forget(client.sessionId);
    if (player) {
      this.positions.mark(player.characterId, this.map.key, player.x, player.y);
      await this.positions.flushOne(player.characterId);
      this.state.players.delete(client.sessionId);
    }
  }

  async onDispose() {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
    }
    await this.positions.flushDue(Date.now() + worldConfig.persistThrottleMs);
  }

  private handleMove(client: Client, message: MoveInputMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !isMoveInput(message)) {
      return;
    }

    const verdict = this.guard.accept(client.sessionId, message.sequence);
    if (verdict !== "ok") {
      return;
    }

    const result = applyMoveIntent(
      { x: player.x, y: player.y },
      message.directionX,
      message.directionY,
      this.map,
    );
    player.x = result.position.x;
    player.y = result.position.y;
    player.facing = result.facing || player.facing;
    player.lastProcessedSequence = message.sequence;
    this.positions.mark(player.characterId, this.map.key, player.x, player.y);
    if (this.map.key === "verdantis" && (message.directionX !== 0 || message.directionY !== 0)) {
      this.maybeAggro(client, player);
      void this.maybeEncounter(client, player.characterId);
    }
  }

  private handleInteract(client: Client, message: InteractMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    if (message?.spawnKey) {
      void this.offerFromSpawn(client, player.characterId, message.spawnKey);
      return;
    }

    if (!message?.npcKey) {
      return;
    }

    const npc = this.map.npcs.find((row) => row.key === message.npcKey);
    if (!npc) {
      return;
    }

    if (distance({ x: player.x, y: player.y }, { x: npc.x, y: npc.y }) > worldConfig.interactRadius) {
      return;
    }

    client.send(WORLD_MESSAGES.NPC_DIALOGUE, {
      npcKey: npc.key,
      name: npc.name,
      text: npc.dialogue,
    });
  }

  private async handleEnterMap(client: Client, message: EnterMapMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !message?.targetMap) {
      return;
    }

    const portal = findPortal(this.map, { x: player.x, y: player.y });
    if (!portal || portal.targetMap !== message.targetMap) {
      return;
    }

    const destination = getWorldMap(portal.targetMap);
    if (!destination) {
      return;
    }

    this.positions.mark(player.characterId, destination.key, destination.spawn.x, destination.spawn.y);
    await this.positions.flushOne(player.characterId);

    const payload: MapTransferMessage = {
      mapKey: destination.key,
      x: destination.spawn.x,
      y: destination.spawn.y,
    };
    client.send(WORLD_MESSAGES.MAP_TRANSFER, payload);
    client.leave(4000);
  }

  private async hydrateNpcs() {
    const stored = await prisma.npc.findMany({
      where: { map: { key: this.map.key } },
    });

    const source =
      stored.length > 0
        ? stored.map((npc) => {
            const dialogue = this.map.npcs.find((row) => row.key === npc.key)?.dialogue ?? "…";
            return { key: npc.key, name: npc.name, role: npc.role, x: npc.posX, y: npc.posY, dialogue };
          })
        : this.map.npcs;

    for (const npc of source) {
      const row = new NpcState();
      row.key = npc.key;
      row.name = npc.name;
      row.role = npc.role;
      row.x = npc.x;
      row.y = npc.y;
      this.state.npcs.push(row);
    }
  }

  private async maybeEncounter(client: Client, characterId: string) {
    const steps = (this.steps.get(characterId) ?? 0) + 1;
    this.steps.set(characterId, steps);
    if (steps < alphaConfig.encounterStepCooldown) {
      return;
    }
    const rng = createSeededRandom(seedFromParts([characterId, steps, Date.now()]));
    if (!rng.chance(alphaConfig.encounterChancePerStep)) {
      return;
    }
    this.steps.set(characterId, 0);
    const verdantis = await prisma.gameMap.findUnique({
      where: { key: "verdantis" },
      include: { spawns: { include: { species: true } } },
    });
    const rolled = rollWildEncounter(
      (verdantis?.spawns ?? []).map((row) => ({
        speciesKey: row.species.key,
        weight: Math.round(row.weight * alphaConfig.spawnWeightMultiplier),
        minLevel: row.minLevel,
        maxLevel: row.maxLevel,
      })),
      rng,
    );
    const offer = await prisma.encounterOffer.create({
      data: {
        characterId,
        mapKey: "verdantis",
        speciesKey: rolled.speciesKey,
        family: "COMMON",
        level: rolled.level,
        seed: seedFromParts([characterId, rolled.speciesKey, Date.now()]),
        expiresAt: new Date(Date.now() + alphaConfig.encounterOfferTtlMs),
      },
    });
    const payload: WildEncounterMessage = {
      offerId: offer.id,
      speciesKey: rolled.speciesKey,
      speciesName: rolled.speciesKey,
      level: rolled.level,
      family: "COMMON",
      expiresAt: offer.expiresAt.toISOString(),
    };
    client.send(WORLD_MESSAGES.WILD_ENCOUNTER, payload);
  }

  private hydrateMobs() {
    if (this.map.key !== "verdantis") {
      return;
    }
    for (const spawn of verdantisMobSpawns) {
      const row = new MobState();
      row.spawnKey = spawn.spawnKey;
      row.speciesKey = spawn.speciesKey;
      row.family = spawn.family;
      row.aggro = spawn.aggro;
      row.level = spawn.level;
      row.x = spawn.x;
      row.y = spawn.y;
      row.state = "IDLE";
      this.state.mobs.push(row);
    }
  }

  private maybeAggro(client: Client, player: PlayerState) {
    for (const mob of this.state.mobs) {
      if (mob.state !== "IDLE" || mob.aggro !== "AGGRESSIVE") {
        continue;
      }
      if (distance({ x: player.x, y: player.y }, { x: mob.x, y: mob.y }) <= worldConfig.interactRadius) {
        void this.offerFromSpawn(client, player.characterId, mob.spawnKey);
        return;
      }
    }
  }

  private async offerFromSpawn(client: Client, characterId: string, spawnKey: string) {
    const mob = this.state.mobs.find((row) => row.spawnKey === spawnKey);
    const def: WorldMobSpawnDef | undefined = verdantisMobSpawns.find((row) => row.spawnKey === spawnKey);
    if (!mob || mob.state === "DEAD" || !def) {
      return;
    }
    const player = [...this.state.players.values()].find((row) => row.characterId === characterId);
    if (!player || distance({ x: player.x, y: player.y }, { x: mob.x, y: mob.y }) > worldConfig.interactRadius + 20) {
      return;
    }
    mob.state = "DEAD";
    const delay =
      def.family === "BOSS"
        ? worldRespawnConfig.bossMs
        : def.family === "ELITE"
          ? worldRespawnConfig.eliteMs
          : def.family === "UNCOMMON"
            ? worldRespawnConfig.uncommonMs
            : worldRespawnConfig.commonMs;
    this.clock.setTimeout(() => {
      mob.state = "IDLE";
    }, delay);
    const offer = await prisma.encounterOffer.create({
      data: {
        characterId,
        mapKey: def.mapKey,
        speciesKey: def.speciesKey,
        family: def.family,
        spawnKey: def.spawnKey,
        level: def.level,
        seed: seedFromParts([characterId, def.spawnKey, Date.now()]),
        expiresAt: new Date(Date.now() + alphaConfig.encounterOfferTtlMs),
      },
    });
    const payload: WildEncounterMessage = {
      offerId: offer.id,
      speciesKey: def.speciesKey,
      speciesName: def.speciesKey,
      level: def.level,
      family: def.family,
      spawnKey: def.spawnKey,
      cinematic: true,
      expiresAt: offer.expiresAt.toISOString(),
    };
    client.send(WORLD_MESSAGES.WILD_ENCOUNTER, payload);
  }
}

function isMoveInput(message: MoveInputMessage | undefined): message is MoveInputMessage {
  return Boolean(
    message &&
      Number.isFinite(message.sequence) &&
      Number.isFinite(message.directionX) &&
      Number.isFinite(message.directionY),
  );
}
