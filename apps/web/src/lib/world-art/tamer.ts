import type { IsoDir } from "../iso/projection";
import { bakeTamer } from "./tamer-model";
import { parseCharacterAppearance, type CharacterAppearance } from "@nexora/config";

export type WorldTamerAtlas = Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[] }>;

const atlases = new Map<string, WorldTamerAtlas>();
const npcs = new Map<string, HTMLCanvasElement[]>();

const NPC_LOOK: Record<string, Partial<CharacterAppearance>> = {
  GUARD: {
    hairId: "hair_01_short",
    hairColor: "black",
    beardId: "beard_none",
    chestId: "chest_01",
    capeId: "cape_none",
    backId: "back_none",
  },
  MERCHANT: {
    hairId: "hair_03_medium",
    hairColor: "brown",
    beardId: "beard_short",
    chestId: "chest_novice_tamer",
    capeId: "cape_none",
    backId: "back_explorer_pack",
  },
  RESEARCHER: {
    hairId: "hair_01",
    hairColor: "white",
    beardId: "beard_none",
    chestId: "chest_genesis_researcher",
    capeId: "cape_genesis_mantle",
    backId: "back_genesis_satchel",
  },
  BREEDER: {
    hairId: "hair_04_tied",
    hairColor: "brown",
    beardId: "beard_none",
    chestId: "chest_breeder",
    capeId: "cape_none",
    backId: "back_none",
  },
  ADVENTURER: {
    hairId: "hair_02_messy",
    hairColor: "dark_brown",
    beardId: "beard_short",
    chestId: "chest_adventurer",
    capeId: "cape_short_explorer",
    backId: "back_explorer_pack",
  },
  CIVILIAN: {
    hairId: "hair_01",
    hairColor: "brown",
    beardId: "beard_none",
    chestId: "chest_field_explorer",
  },
};

export function buildWorldTamerAtlas(appearance?: unknown): WorldTamerAtlas {
  const parsed = parseCharacterAppearance(appearance);
  const key = JSON.stringify(parsed);
  let atlas = atlases.get(key);
  if (!atlas) {
    atlas = bakeTamer(undefined, true, parsed);
    atlases.set(key, atlas);
    if (atlases.size > 6) atlases.delete(atlases.keys().next().value!);
  }
  return atlas;
}

export function paintWorldNpc(
  palette: "gold" | "violet" | "steel" | "green",
  role = "CIVILIAN",
  phase = 0,
) {
  const key = `${palette}:${role}`;
  let frames = npcs.get(key);
  if (!frames) {
    const coat = { gold: "#94713e", violet: "#714b86", steel: "#536778", green: "#3d6c51" }[palette];
    frames = bakeTamer(coat, false, NPC_LOOK[role] ?? NPC_LOOK.CIVILIAN, role).S.idle;
    npcs.set(key, frames);
  }
  return frames[Math.floor(phase) % frames.length];
}
