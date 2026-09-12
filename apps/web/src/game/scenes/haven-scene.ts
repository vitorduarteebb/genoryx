import { getWorldMap, verdantisMobSpawns, worldConfig, worldMaps, type WorldMapDefinition } from "@nexora/config";
import { applyMoveIntent } from "@nexora/game-engine";
import type { WildEncounterMessage, WorldMapKey } from "@nexora/types";
import { WORLD_MESSAGES } from "@nexora/types";
import type { Room } from "colyseus.js";
import * as Phaser from "phaser";
import {
  createNpcActor,
  createPlayerActor,
  setActorFacing,
  setActorFocus,
  setActorWalking,
  sortActorDepth,
} from "../art/actors";
import { createWildActor, flashCaptureBurst, pulseWild, setWildFocus, tickWild } from "../art/creatures";
import { speciesTitle } from "../art/palette";
import { ensureWorldSprites, preloadWorldSprites } from "../art/sprite-kit";
import { paintWorldMap } from "../art/map-painter";
import { speciesColor } from "../art/palette";
import { ensurePaintKit } from "../art/paint-kit";
import { ensureWorldTextures } from "../art/textures";
import { createWorldHud, spawnAmbient, type WorldHud } from "../art/world-hud";
import {
  createGameClient,
  joinWorld,
  sendEnterMap,
  sendInteract,
  sendMove,
  type MapTransferMessage,
  type NpcDialogueMessage,
} from "../net/game-client";

type RemoteSample = { x: number; y: number; facing: string };

export class HavenScene extends Phaser.Scene {
  private room?: Room;
  private map = worldMaps.haven;
  private localId = "";
  private sequence = 0;
  private pending: { sequence: number; directionX: number; directionY: number }[] = [];
  private predicted = { x: 0, y: 0 };
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private players = new Map<string, Phaser.GameObjects.Container>();
  private remotes = new Map<string, RemoteSample>();
  private npcActors = new Map<string, Phaser.GameObjects.Container>();
  private wilds: Phaser.GameObjects.Container[] = [];
  private companion?: Phaser.GameObjects.Container;
  private worldHud?: WorldHud;
  private status = "Conectando…";
  private sendAcc = 0;
  private walking = false;
  private pendingEncounter?: WildEncounterMessage;

  constructor() {
    super("haven");
  }

  preload() {
    preloadWorldSprites(this);
  }

  create() {
    const accessToken = this.registry.get("accessToken") as string;
    const mapKey = (this.registry.get("mapKey") as WorldMapKey) ?? "haven";
    this.mountWorld(this.requireMap(mapKey));

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys("W,A,S,D") as typeof this.wasd;
    this.input.keyboard?.on("keydown-E", () => this.tryInteract());
    this.input.keyboard?.on("keydown-F", () => this.tryPortal());
    this.input.keyboard?.on("keydown-G", () => this.acceptEncounter());
    this.input.keyboard?.on("keydown-C", () => this.searchWild());

    void this.connectRoom(accessToken, mapKey);
  }

  update(time: number, delta: number) {
    const coords = `${Math.round(this.predicted.x)},${Math.round(this.predicted.y)}`;
    this.worldHud?.setStatus(this.map.name, this.players.size, this.status === "Conectando…" ? this.status : coords);
    if (!this.room) {
      return;
    }

    const input = this.readInput();
    this.walking = input.directionX !== 0 || input.directionY !== 0;
    this.sendAcc += delta;
    if (this.sendAcc >= worldConfig.tickMs) {
      this.sendAcc = 0;
      if (this.walking) {
        this.sequence += 1;
        const payload = { sequence: this.sequence, directionX: input.directionX, directionY: input.directionY };
        this.pending.push(payload);
        const step = applyMoveIntent(this.predicted, payload.directionX, payload.directionY, this.map);
        this.predicted = step.position;
        this.placeLocal(step.position.x, step.position.y, step.facing, time);
        sendMove(this.room, payload);
      }
    }

    const local = this.players.get(this.localId);
    if (local) {
      local.x = Phaser.Math.Linear(local.x, this.predicted.x, 0.42);
      local.y = Phaser.Math.Linear(local.y, this.predicted.y, 0.42);
      setActorWalking(local, this.walking, time, this);
      sortActorDepth(local);
      this.followCompanion(local, time);
    }
    this.interpolateRemotes(delta, time);
    for (const wild of this.wilds) {
      tickWild(wild, delta, time);
    }
    this.updatePrompt();
  }

  private async connectRoom(accessToken: string, mapKey: WorldMapKey) {
    try {
      if (!accessToken) {
        this.status = "Sem token de acesso";
        return;
      }
      const client = createGameClient();
      this.room = await joinWorld(client, mapKey, accessToken);
      this.localId = this.room.sessionId;
      this.bindRoom(this.room);
      this.status = this.map.name;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.status = `Falha na sala: ${message}`;
      console.error("haven join", error);
    }
  }

  private bindRoom(room: Room) {
    const bound = new Set<string>();
    const track = (player: WorldPlayer, sessionId: string) => {
      this.ensureSprite(sessionId, player.name, sessionId === this.localId);
      if (sessionId === this.localId) {
        if (!bound.has(sessionId)) {
          this.predicted = { x: player.x, y: player.y };
          this.placeLocal(player.x, player.y, player.facing, 0);
          const sprite = this.players.get(sessionId);
          if (sprite) {
            this.cameras.main.startFollow(sprite, true, 0.08, 0.08);
            this.cameras.main.setFollowOffset(0, 48);
            this.cameras.main.setDeadzone(16, 12);
            this.attachCompanion(player, sprite);
          }
        } else {
          this.reconcile(player);
        }
      } else {
        this.remotes.set(sessionId, { x: player.x, y: player.y, facing: player.facing });
        if (!bound.has(sessionId)) {
          this.players.get(sessionId)?.setPosition(player.x, player.y);
        }
      }
      if (bound.has(sessionId)) {
        return;
      }
      bound.add(sessionId);
      player.onChange?.(() => {
        if (sessionId === this.localId) {
          this.reconcile(player);
        } else {
          this.remotes.set(sessionId, { x: player.x, y: player.y, facing: player.facing });
        }
      });
    };

    const syncPlayers = () => {
      const players = room.state?.players as
        | {
            forEach?: (cb: (player: WorldPlayer, sessionId: string) => void) => void;
            onAdd?: (cb: (player: WorldPlayer, sessionId: string) => void, triggerAll?: boolean) => void;
            onRemove?: (cb: (player: WorldPlayer, sessionId: string) => void) => void;
          }
        | undefined;
      if (!players?.forEach) {
        return false;
      }
      players.forEach(track);
      return true;
    };

    let listening = false;
    const listen = () => {
      const players = room.state?.players as
        | {
            onAdd?: (cb: (player: WorldPlayer, sessionId: string) => void) => void;
            onRemove?: (cb: (player: WorldPlayer, sessionId: string) => void) => void;
          }
        | undefined;
      if (listening || !players) {
        return;
      }
      listening = true;
      players.onAdd?.(track);
      players.onRemove?.((_player: WorldPlayer, sessionId: string) => {
        bound.delete(sessionId);
        this.players.get(sessionId)?.destroy(true);
        this.players.delete(sessionId);
        this.remotes.delete(sessionId);
      });
    };

    if (syncPlayers()) {
      listen();
    }
    room.onStateChange(() => {
      syncPlayers();
      listen();
    });

    room.onMessage(WORLD_MESSAGES.NPC_DIALOGUE, (message: NpcDialogueMessage) => {
      const named = this.map.npcs.find((row) => row.key === message.npcKey)?.name ?? message.name;
      this.worldHud?.setDialogue(named, message.text);
      if (message.npcKey === "genesis_chamber") {
        this.worldHud?.setPrompt("Câmara aberta — /game/chamber");
      }
    });

    room.onMessage(WORLD_MESSAGES.MAP_TRANSFER, (message: MapTransferMessage) => {
      this.registry.set("mapKey", message.mapKey);
      void this.switchMap(message.mapKey);
    });
    room.onMessage(WORLD_MESSAGES.WILD_ENCOUNTER, (message: WildEncounterMessage) => {
      this.pendingEncounter = message;
      this.worldHud?.setEncounter({ speciesKey: message.speciesKey, level: message.level });
      this.worldHud?.setDialogue(
        speciesTitle(message.speciesKey),
        `${speciesTitle(message.speciesKey)} Nv ${message.level} surgiu no mato. G para enfrentar.`,
      );
      this.flashEncounter(message.speciesKey);
    });
  }

  private reconcile(player: WorldPlayer) {
    this.pending = this.pending.filter((input) => input.sequence > player.lastProcessedSequence);
    let pos = { x: player.x, y: player.y };
    for (const input of this.pending) {
      pos = applyMoveIntent(pos, input.directionX, input.directionY, this.map).position;
    }
    this.predicted = pos;
    this.placeLocal(pos.x, pos.y, player.facing, this.time.now);
  }

  private readInput() {
    const left = Boolean(this.cursors?.left.isDown || this.wasd?.A.isDown);
    const right = Boolean(this.cursors?.right.isDown || this.wasd?.D.isDown);
    const up = Boolean(this.cursors?.up.isDown || this.wasd?.W.isDown);
    const down = Boolean(this.cursors?.down.isDown || this.wasd?.S.isDown);
    return {
      directionX: (right ? 1 : 0) - (left ? 1 : 0),
      directionY: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }

  private tryInteract() {
    if (!this.room) {
      return;
    }
    const npc = this.map.npcs.find(
      (row) => Math.hypot(row.x - this.predicted.x, row.y - this.predicted.y) <= worldConfig.interactRadius,
    );
    if (npc) {
      sendInteract(this.room, { npcKey: npc.key });
      return;
    }
    const mob = this.nearestWild();
    const spawnKey = mob?.getData("spawnKey") as string | undefined;
    if (spawnKey) {
      sendInteract(this.room, { spawnKey });
    }
  }

  private tryPortal() {
    if (!this.room) {
      return;
    }
    const portal = this.map.portals.find((row) => {
      const z = row.zone;
      return (
        this.predicted.x >= z.x &&
        this.predicted.x <= z.x + z.width &&
        this.predicted.y >= z.y &&
        this.predicted.y <= z.y + z.height
      );
    });
    if (portal) {
      sendEnterMap(this.room, { targetMap: portal.targetMap });
    }
  }

  private async switchMap(mapKey: WorldMapKey) {
    const token = this.registry.get("accessToken") as string;
    await this.room?.leave(false);
    this.room = undefined;
    this.pendingEncounter = undefined;
    this.players.forEach((sprite) => sprite.destroy(true));
    this.players.clear();
    this.remotes.clear();
    this.npcActors.clear();
    this.wilds = [];
    this.companion?.destroy(true);
    this.companion = undefined;
    this.pending = [];
    this.tweens.killAll();
    this.children.removeAll(true);
    this.mountWorld(this.requireMap(mapKey));
    await this.connectRoom(token, mapKey);
  }

  private interpolateRemotes(delta: number, time: number) {
    const alpha = Math.min(1, delta / 80);
    for (const [id, sample] of this.remotes) {
      const sprite = this.players.get(id);
      if (!sprite) {
        continue;
      }
      const moved = Math.hypot(sprite.x - sample.x, sprite.y - sample.y) > 0.5;
      sprite.x = Phaser.Math.Linear(sprite.x, sample.x, alpha);
      sprite.y = Phaser.Math.Linear(sprite.y, sample.y, alpha);
      setActorFacing(sprite, sample.facing);
      setActorWalking(sprite, moved, time, this);
      sortActorDepth(sprite);
    }
  }

  private updatePrompt() {
    const npc = this.map.npcs.find(
      (row) => Math.hypot(row.x - this.predicted.x, row.y - this.predicted.y) <= worldConfig.interactRadius,
    );
    const portal = this.map.portals.find((row) => {
      const z = row.zone;
      return (
        this.predicted.x >= z.x &&
        this.predicted.x <= z.x + z.width &&
        this.predicted.y >= z.y &&
        this.predicted.y <= z.y + z.height
      );
    });
    const wild = this.nearestWild();
    for (const actor of this.npcActors.values()) {
      setActorFocus(actor, actor.getData("npcKey") === npc?.key);
    }
    for (const actor of this.wilds) {
      setWildFocus(actor, actor === wild);
    }
    if (this.pendingEncounter) {
      this.worldHud?.setPrompt(`G · enfrentar ${speciesTitle(this.pendingEncounter.speciesKey)}`);
    } else if (npc?.role === "chamber") {
      this.worldHud?.setPrompt("E · Câmara Genesis · evoluir criatura pronta");
    } else if (npc) {
      this.worldHud?.setPrompt(`E · falar com ${npc.name}`);
    } else if (wild) {
      this.worldHud?.setPrompt(`E · enfrentar ${String(wild.getData("speciesName") ?? speciesTitle(String(wild.getData("speciesKey"))))}`);
    } else if (portal) {
      this.worldHud?.setPrompt(`F · atravessar para ${portal.targetMap === "verdantis" ? "Verdantis" : "Haven"}`);
    } else if (this.map.key === "verdantis") {
      this.worldHud?.setPrompt("WASD mover · aproxime um bicho · E enfrentar");
    } else {
      this.worldHud?.setPrompt("WASD mover · E falar · F portal");
    }
  }

  private nearestWild() {
    let best: Phaser.GameObjects.Container | undefined;
    let bestDist: number = worldConfig.interactRadius;
    for (const row of this.wilds) {
      const dist = Math.hypot(row.x - this.predicted.x, row.y - this.predicted.y);
      if (dist <= bestDist) {
        best = row;
        bestDist = dist;
      }
    }
    return best;
  }

  private acceptEncounter() {
    if (!this.pendingEncounter) {
      return;
    }
    void this.leaveForBattle(`/game/battle?offerId=${this.pendingEncounter.offerId}`);
  }

  private searchWild() {
    if (this.map.key !== "verdantis") {
      return;
    }
    void this.leaveForBattle("/game/battle");
  }

  private async leaveForBattle(url: string) {
    try {
      sessionStorage.setItem("genoryx-world-return", this.map.key);
    } catch {
      /* ignore */
    }
    try {
      await this.room?.leave();
    } catch {
      /* ignore */
    }
    window.location.assign(url);
  }

  private flashEncounter(speciesKey: string) {
    const bySpawn = this.pendingEncounter?.spawnKey
      ? this.wilds.find((row) => row.getData("spawnKey") === this.pendingEncounter?.spawnKey)
      : undefined;
    const match = bySpawn ?? this.wilds.find((row) => row.getData("speciesKey") === speciesKey);
    if (match) {
      pulseWild(this, match);
      return;
    }
    const local = this.players.get(this.localId);
    flashCaptureBurst(this, local?.x ?? this.predicted.x, local?.y ?? this.predicted.y, speciesColor(speciesKey));
  }

  private placeLocal(x: number, y: number, facing: string, time: number) {
    const sprite = this.players.get(this.localId);
    if (!sprite) {
      return;
    }
    sprite.x = x;
    sprite.y = y;
    setActorFacing(sprite, facing);
    setActorWalking(sprite, this.walking, time);
    sortActorDepth(sprite);
  }

  private ensureSprite(sessionId: string, name: string, local: boolean) {
    if (this.players.has(sessionId)) {
      return;
    }
    const actor = createPlayerActor(this, name, local);
    this.players.set(sessionId, actor);
  }

  private mountWorld(map: WorldMapDefinition) {
    this.map = map;
    ensureWorldTextures(this);
    ensurePaintKit(this);
    ensureWorldSprites(this);
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setZoom(map.key === "verdantis" ? 1.28 : 1.42);
    this.cameras.main.setRoundPixels(true);
    paintWorldMap(this, map);
    const grade = this.add.image(640, 360, "gx-grade").setScrollFactor(0).setDepth(8480);
    grade.setAlpha(map.key === "verdantis" ? 0.92 : 0.62);
    const fog = this.add.rectangle(640, 70, 1280, 220, 0x060a08, map.key === "verdantis" ? 0.28 : 0.16);
    fog.setScrollFactor(0).setDepth(8500);
    const groundFog = this.add.rectangle(640, 680, 1280, 140, 0x040604, 0.22);
    groundFog.setScrollFactor(0).setDepth(8500);
    this.npcActors.clear();
    for (const npc of map.npcs) {
      this.npcActors.set(npc.key, createNpcActor(this, npc));
    }
    this.wilds = [];
    if (map.key === "verdantis") {
      for (const spawn of verdantisMobSpawns) {
        const actor = createWildActor(this, spawn.speciesKey, spawn.x, spawn.y, { family: spawn.family });
        actor.setData("spawnKey", spawn.spawnKey);
        actor.setData("family", spawn.family);
        this.wilds.push(actor);
      }
    }
    spawnAmbient(this, map.key);
    this.worldHud = createWorldHud(this, map.key);
    this.cameras.main.fadeIn(380, 8, 6, 14);
  }

  private requireMap(key: string): WorldMapDefinition {
    return getWorldMap(key) ?? worldMaps.haven;
  }

  private attachCompanion(player: WorldPlayer, owner: Phaser.GameObjects.Container) {
    if (this.companion) {
      return;
    }
    const species = player.companionSpeciesKey || "florune";
    this.companion = createWildActor(this, species, owner.x - 28, owner.y + 22, {
      companion: true,
      temperament: player.companionTemperament,
    });
  }

  private followCompanion(owner: Phaser.GameObjects.Container, time: number) {
    if (!this.companion) {
      return;
    }
    const temperament = String(this.companion.getData("temperament") ?? "WILD");
    const radius = temperament === "FRIENDLY" ? 26 : temperament === "NOBLE" ? 34 : temperament === "FERAL" ? 48 : 38;
    const destX = owner.x - radius;
    const destY = owner.y + 18 + Math.sin(time / 420) * 4;
    const beforeX = this.companion.x;
    this.companion.x = Phaser.Math.Linear(this.companion.x, destX, 0.16);
    this.companion.y = Phaser.Math.Linear(this.companion.y, destY, 0.16);
    const figure = this.companion.getData("figure") as Phaser.GameObjects.Container | undefined;
    figure?.setScale(this.companion.x < owner.x ? -1 : 1, 1);
    figure?.setY(Math.abs(this.companion.x - beforeX) > 0.4 ? Math.sin(time / 90) * 5 : Math.sin(time / 280) * 2);
    sortActorDepth(this.companion);
  }
}

type WorldPlayer = {
  name: string;
  x: number;
  y: number;
  facing: string;
  lastProcessedSequence: number;
  companionSpeciesKey?: string;
  companionTemperament?: string;
  onChange?: (cb: () => void) => void;
};
