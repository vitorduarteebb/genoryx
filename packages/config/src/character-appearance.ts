export const characterSlots = [
  "BODY",
  "FACE",
  "HAIR",
  "EYEBROWS",
  "BEARD",
  "CHEST",
  "LEGS",
  "GLOVES",
  "BOOTS",
  "SHOULDER",
  "CAPE",
  "BACK",
  "ACCESSORY",
  "WEAPON_RIGHT",
  "WEAPON_LEFT",
] as const;

export type CharacterSlot = (typeof characterSlots)[number];

export const characterBodyTypes = ["canonical_body", "body_a", "body_b"] as const;
export const characterFaceIds = ["face_01", "face_02", "face_03", "face_04", "face_05"] as const;
export const characterHairIds = [
  "hair_01",
  "hair_02",
  "hair_01_short",
  "hair_02_messy",
  "hair_03_medium",
  "hair_04_tied",
  "hair_05_long",
  "hair_06_curly",
] as const;
export const characterHairColors = [
  "black",
  "dark_brown",
  "brown",
  "blonde",
  "red",
  "white",
  "blue_black",
] as const;
export const characterSkinTones = [
  "ivory",
  "sand",
  "tan",
  "amber",
  "bronze",
  "umber",
  "ebony",
] as const;
export const characterEyeColors = ["teal", "brown", "blue", "green", "gray", "amber", "violet"] as const;
export const characterChestIds = [
  "chest_01",
  "chest_02",
  "chest_novice_tamer",
  "chest_field_explorer",
  "chest_genesis_researcher",
  "chest_breeder",
  "chest_adventurer",
] as const;
export const characterLegsIds = [
  "pants_01",
  "pants_02",
  "legs_explorer",
  "legs_reinforced",
  "legs_breeder",
  "legs_genesis",
] as const;
export const characterGlovesIds = ["gloves_none", "gloves_field", "gloves_fingerless", "gloves_genesis"] as const;
export const characterBootsIds = ["boots_01", "boots_02", "boots_explorer", "boots_leather", "boots_reinforced"] as const;
export const characterCapeIds = ["cape_none", "cape_short_explorer", "cape_genesis_mantle"] as const;
export const characterBackIds = ["back_none", "back_explorer_pack", "back_genesis_satchel"] as const;
export const characterBeardIds = ["beard_none", "beard_short"] as const;
export const characterEyebrowIds = ["brow_01", "brow_02"] as const;

export type CharacterAppearance = {
  bodyType: (typeof characterBodyTypes)[number];
  faceId: (typeof characterFaceIds)[number];
  skinTone: (typeof characterSkinTones)[number];
  eyeColor: (typeof characterEyeColors)[number];
  eyebrowId: (typeof characterEyebrowIds)[number];
  hairId: (typeof characterHairIds)[number];
  hairColor: (typeof characterHairColors)[number];
  beardId: (typeof characterBeardIds)[number];
  chestId: (typeof characterChestIds)[number];
  legsId: (typeof characterLegsIds)[number];
  glovesId: (typeof characterGlovesIds)[number];
  bootsId: (typeof characterBootsIds)[number];
  capeId: (typeof characterCapeIds)[number];
  backId: (typeof characterBackIds)[number];
};

export const defaultCharacterAppearance: CharacterAppearance = {
  bodyType: "canonical_body",
  faceId: "face_01",
  skinTone: "sand",
  eyeColor: "teal",
  eyebrowId: "brow_01",
  hairId: "hair_01",
  hairColor: "black",
  beardId: "beard_none",
  chestId: "chest_01",
  legsId: "pants_01",
  glovesId: "gloves_none",
  bootsId: "boots_01",
  capeId: "cape_none",
  backId: "back_none",
};

export const characterHairColorRgb: Record<(typeof characterHairColors)[number], [number, number, number]> = {
  black: [0.08, 0.07, 0.07],
  dark_brown: [0.18, 0.11, 0.07],
  brown: [0.36, 0.22, 0.12],
  blonde: [0.78, 0.64, 0.36],
  red: [0.62, 0.22, 0.14],
  white: [0.86, 0.84, 0.8],
  blue_black: [0.08, 0.1, 0.16],
};

export const characterSkinToneRgb: Record<(typeof characterSkinTones)[number], [number, number, number]> = {
  ivory: [0.93, 0.82, 0.74],
  sand: [0.8, 0.64, 0.5],
  tan: [0.72, 0.52, 0.38],
  amber: [0.62, 0.42, 0.28],
  bronze: [0.48, 0.32, 0.22],
  umber: [0.34, 0.22, 0.16],
  ebony: [0.2, 0.14, 0.12],
};

export const characterCreatorCategories = [
  { id: "BODY", label: "Corpo" },
  { id: "FACE", label: "Rosto" },
  { id: "SKIN", label: "Pele" },
  { id: "HAIR", label: "Cabelo" },
  { id: "HAIR_COLOR", label: "Cor do cabelo" },
  { id: "EYES", label: "Olhos" },
  { id: "CHEST", label: "Peito" },
  { id: "LEGS", label: "Pernas" },
  { id: "GLOVES", label: "Luvas" },
  { id: "BOOTS", label: "Botas" },
] as const;

export const phase1UnlockedIds = {
  bodyType: ["canonical_body", "body_a"] as const,
  faceId: ["face_01"] as const,
  hairId: ["hair_01", "hair_02"] as const,
  chestId: ["chest_01", "chest_02"] as const,
  legsId: ["pants_01", "pants_02"] as const,
  glovesId: ["gloves_none"] as const,
  bootsId: ["boots_01", "boots_02"] as const,
};

const catalogs = {
  bodyType: characterBodyTypes,
  faceId: characterFaceIds,
  skinTone: characterSkinTones,
  eyeColor: characterEyeColors,
  eyebrowId: characterEyebrowIds,
  hairId: characterHairIds,
  hairColor: characterHairColors,
  beardId: characterBeardIds,
  chestId: characterChestIds,
  legsId: characterLegsIds,
  glovesId: characterGlovesIds,
  bootsId: characterBootsIds,
  capeId: characterCapeIds,
  backId: characterBackIds,
} as const;

function pick<T extends readonly string[]>(list: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

export function parseCharacterAppearance(raw: unknown): CharacterAppearance {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = { ...defaultCharacterAppearance };
  (Object.keys(catalogs) as Array<keyof CharacterAppearance>).forEach((key) => {
    next[key] = pick(catalogs[key], src[key], defaultCharacterAppearance[key]) as never;
  });
  return next;
}

export function randomCharacterAppearance(): CharacterAppearance {
  const pickOne = <T extends readonly string[]>(list: T): T[number] =>
    list[Math.floor(Math.random() * list.length)] ?? list[0];
  return {
    bodyType: pickOne(phase1UnlockedIds.bodyType),
    faceId: pickOne(phase1UnlockedIds.faceId),
    skinTone: pickOne(characterSkinTones),
    eyeColor: pickOne(characterEyeColors),
    eyebrowId: pickOne(characterEyebrowIds),
    hairId: pickOne(phase1UnlockedIds.hairId),
    hairColor: pickOne(characterHairColors),
    beardId: "beard_none",
    chestId: pickOne(phase1UnlockedIds.chestId),
    legsId: pickOne(phase1UnlockedIds.legsId),
    glovesId: pickOne(phase1UnlockedIds.glovesId),
    bootsId: pickOne(phase1UnlockedIds.bootsId),
    capeId: "cape_none",
    backId: "back_none",
  };
}

export const meshyCharacterConfig = {
  previewPolycount: 30_000,
  remeshIfFacesAbove: 300_000,
  heightMeters: 1.8,
  textureResolution: "2k" as const,
  idleActionId: 0,
  walkActionId: -2,
  runActionId: -1,
};
