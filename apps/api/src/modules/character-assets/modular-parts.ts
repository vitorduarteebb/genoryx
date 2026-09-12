import { MESHY_CHARACTER_PROMPT_BASE } from "./prompts";

export type ModularPartSpec = {
  assetId: string;
  slot: "HAIR" | "CHEST" | "LEGS" | "BOOTS";
  file: string;
  prompt: string;
  texturePrompt: string;
  polycount: number;
};

const style =
  `${MESHY_CHARACTER_PROMPT_BASE} Isolated game-ready clothing or hair asset only. No full character, no mannequin, no stand, no floor. Sized for a 1.8m stylized humanoid. GENORYX original.`;

export const modularPartSpecs: ModularPartSpec[] = [
  {
    assetId: "hair_01_short",
    slot: "HAIR",
    file: "Hair/hair_01.glb",
    polycount: 10_000,
    prompt: `${style} Isolated short neat stylized hair wig only. Volume on top, clean silhouette from elevated camera. No head, no face, no body, no scalp sphere.`,
    texturePrompt: "Stylized dark hair fibers, soft volume, readable clumps, no skin, no skull.",
  },
  {
    assetId: "hair_02_messy",
    slot: "HAIR",
    file: "Hair/hair_02.glb",
    polycount: 12_000,
    prompt: `${style} Isolated messy medium-long stylized hair wig only. Asymmetric volume, loose strands, clearly longer than a short cut. No head, no face, no body.`,
    texturePrompt: "Stylized messy hair fibers with lighter tips, high volume, no skin, no skull.",
  },
  {
    assetId: "chest_novice_tamer",
    slot: "CHEST",
    file: "Chest/chest_01.glb",
    polycount: 14_000,
    prompt: `${style} Isolated short graphite vest and sand shirt for a creature-tamer. Hollow interior. One cyan crystal badge. No legs, no head, no mannequin.`,
    texturePrompt: "Graphite vest, sand cloth, leather edges, one cyan crystal badge. PBR, not photoreal.",
  },
  {
    assetId: "chest_field_explorer",
    slot: "CHEST",
    file: "Chest/chest_02.glb",
    polycount: 14_000,
    prompt: `${style} Isolated longer field explorer jacket, sand and moss-green cloth, leather straps, open collar. Hollow interior. Clearly bulkier than a short vest. No legs, no head, no mannequin.`,
    texturePrompt: "Sand and moss explorer jacket, leather straps, worn cloth PBR. No crystal armor.",
  },
  {
    assetId: "legs_explorer",
    slot: "LEGS",
    file: "Legs/legs_01.glb",
    polycount: 10_000,
    prompt: `${style} Isolated fitted explorer pants, graphite, hollow, two separate legs. No torso, no boots, no mannequin.`,
    texturePrompt: "Graphite fitted pants, cloth PBR, readable folds.",
  },
  {
    assetId: "legs_reinforced",
    slot: "LEGS",
    file: "Legs/legs_02.glb",
    polycount: 10_000,
    prompt: `${style} Isolated reinforced explorer pants with leather knee pads and slightly looser cut. Hollow, two legs. Clearly different from slim pants. No torso, no boots, no mannequin.`,
    texturePrompt: "Dark reinforced pants, leather knee pads, cloth and leather PBR.",
  },
  {
    assetId: "boots_explorer",
    slot: "BOOTS",
    file: "Boots/boots_01.glb",
    polycount: 8_000,
    prompt: `${style} Isolated pair of tall brown explorer boots, left and right, mid-calf, laces. No legs, no mannequin, no stand.`,
    texturePrompt: "Warm brown leather explorer boots, laces, worn PBR.",
  },
  {
    assetId: "boots_leather",
    slot: "BOOTS",
    file: "Boots/boots_02.glb",
    polycount: 8_000,
    prompt: `${style} Isolated pair of short darker leather boots, low ankle, clearly shorter than mid-calf explorer boots. Left and right. No legs, no mannequin.`,
    texturePrompt: "Dark short leather boots, matte, simple PBR.",
  },
];
