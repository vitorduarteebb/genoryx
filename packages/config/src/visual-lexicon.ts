import type {
  AuraType,
  BackTrait,
  BodyPlan,
  EyeType,
  FrontLimbType,
  HeadType,
  HornType,
  LifeStage,
  MaterialType,
  MutationIntensity,
  MutationType,
  PatternType,
  RearLimbType,
  SkinType,
  TailType,
  Temperament,
} from "@nexora/types";

export const bodyPlanLexicon: Record<BodyPlan, string> = {
  QUADRUPED: "compact fantasy quadruped creature anatomy, four sturdy legs, readable silhouette",
  BIPED: "compact fantasy biped creature anatomy, two legs, upright but creature-like, not a human",
  SERPENT_WYRM: "long stylized serpent-wyrm body, no separate walking legs, coiled readable form",
  FLOATING: "levitating compact fantasy creature, no grounded walking stance, buoyant silhouette",
  HUMANOID_BEAST: "beast-humanoid fantasy anatomy, bipedal but clearly an animalistic creature, not a person",
  AVIAN: "stylized avian fantasy creature, birdlike stance, wings as the back trait if present",
  ARACHNID: "stylized fantasy arachnid body plan with a readable multi-limb silhouette, not realistic insect horror",
  GOLEM: "colossal golem-like fantasy creature, heavy mineral mass, compact readable proportions, not a statue pile",
  AMPHIBIAN: "compact amphibian fantasy creature, smooth aquatic-terrestrial anatomy",
  ABYSSAL: "abyssal fantasy creature body plan, unusual but coherent deep-sea/alien silhouette, still one organism",
  CENTAUROID: "centauroid fantasy anatomy: beast lower body plus upright torso, compact and collectible",
  INSECTOID_BIPED: "insectoid biped fantasy anatomy, chitinous upright creature, simple readable limbs",
};

export const headLexicon: Record<HeadType, string> = {
  DRACONIC: "stylized draconic head, collectible dragon-like face, strong brow, not a franchise dragon",
  BEAST: "stylized beast-predator head, animalistic muzzle, clear predator read, not a real-world species",
  SERPENT: "stylized aerodynamic serpent head, sleek and tapered, fantasy not a real snake",
  EXOTIC: "stylized exotic-abyssal head, unusual but premium collectible face, not ugly or broken",
};

export const eyeLexicon: Record<EyeType, string> = {
  PREDATOR: "predator eyes: sharp focused animal irises, hunting gaze",
  ARCANE: "arcane eyes: glowing sigil-like pupils, magical but clean",
  VOID: "void eyes: deep dark wells with a faint inner spark, strange not damaged",
  CRYSTAL: "crystal eyes: faceted gem-like irises catching light",
  GENESIS: "luminous genesis-core irises, bright inner nucleus, unique GENORYX glow",
};

export const hornLexicon: Record<HornType, string> = {
  NONE: "no horns, no antlers, no horn stubs",
  DRACONIC: "stylized draconic horns matching the head language",
  PREDATOR: "predator horns: forward aggressive points, still stylized",
  CURVED_RAM: "curved ram-like horns, spiral elegance, collectible",
  CROWN: "crown horns: regal upward cluster, not a metal crown accessory",
  CRYSTAL_GENESIS: "crystal genesis horns: mineral-crystal horn structures, not jewelry",
};

export const frontLimbLexicon: Record<FrontLimbType, string> = {
  CLAWED: "clawed front limbs, simple readable claws",
  HEAVY_GUARDIAN: "heavy guardian front limbs, thicker protective forms",
  RAPTOR_AGILE: "agile raptor-like front limbs, still simple collectible shapes",
  MANTIS_BLADE: "mantis-blade front limbs, bladed forelimbs as anatomy, not held weapons",
};

export const rearLimbLexicon: Record<RearLimbType, string> = {
  BALANCED: "balanced rear limbs, stable collectible stance",
  RAPTOR_SPRINTER: "raptor-sprinter rear limbs, digitigrade but simplified",
  HEAVY_COLOSSAL: "heavy colossal rear limbs, thick supportive columns",
  LEAPER_EXOTIC: "exotic leaper rear limbs, springy unusual joints, still readable",
};

export const tailLexicon: Record<TailType, string> = {
  NONE: "no tail",
  PREDATOR: "predator tail, tapering and expressive",
  HEAVY_CLUB: "heavy club tail, weighted tip, still stylized",
  BLADE: "blade tail, flattened cutting silhouette as anatomy",
  SERPENT_TENTACLE: "serpent-tentacle tail, fluid but one coherent appendage",
  GENESIS_SPLIT: "genesis-split tail, forked official GENORYX tail structure",
};

export const backLexicon: Record<BackTrait, string> = {
  NONE: "no wings, no dorsal spines, no shell, a clean back",
  DORSAL_SPINES: "dorsal spines along the back, large readable plates",
  DRACONIC_WINGS: "stylized draconic wings, collectible membrane wings",
  FEATHERED_WINGS: "stylized feathered wings, fantasy feathers, readable as a pair",
  SHELL_CARAPACE: "shell carapace on the back, one large protective form",
};

export const patternLexicon: Record<PatternType, string> = {
  NONE: "no extra pattern markings beyond material and color blocks",
  STRIPES: "bold stripe pattern, large readable bands",
  SPOTS: "bold spot pattern, large collectible marks",
  RUNES: "rune pattern: large carved/glowing sigils following the body, not text or letters",
  CRACKS: "crack pattern: large mineral fissure markings",
  ENERGY_VEINS: "energy-vein pattern: glowing channels following anatomy",
  GENESIS: "genesis pattern: official unique GENORYX mark layout, large and rare-looking",
};

export const auraLexicon: Record<AuraType, string> = {
  NONE: "no visible aura, no energy halo",
  EMBER_FIRE: "subtle ember-fire aura close to the body, not a fireball",
  ELECTRIC_PLASMA: "subtle electric-plasma aura, thin arcs, not a lightning storm",
  VOID_ARCANE: "subtle void-arcane aura, dark shimmer, contained",
  GENESIS: "subtle genesis aura, warm-cool official glow, never a logo",
};

export const materialLexicon: Record<MaterialType, string> = {
  SOFT_SKIN: "soft living skin material over the same anatomy",
  FUR: "stylized fur material over the same anatomy, large clumps not hyper-real hair",
  SCALES: "stylized scale material over the same anatomy, large readable scales",
  CHITIN: "chitin plates over the same anatomy",
  STONE: "living stone material over the same anatomy, not a broken statue",
  CRYSTAL: "living crystal material over the same anatomy, not a new body plan",
  PLANT: "living plant-fiber material over the same anatomy",
  ETHEREAL: "ethereal semi-solid material over the same anatomy, still a readable creature",
};

export const skinLexicon: Record<SkinType, string> = {
  SMOOTH: "smooth surface finish",
  PLATED: "plated surface finish",
  RIDGED: "ridged surface finish",
  TRANSLUCENT: "slightly translucent surface finish in thin areas",
};

export const temperamentLexicon: Record<Temperament, string> = {
  FRIENDLY:
    "FRIENDLY temperament: rounded lines, softer gaze, curious posture, relaxed mouth. Still a battle creature, not a baby unless the life stage is BABY.",
  NOBLE: "NOBLE temperament: confident posture, elegant forms, slightly greater symmetry, calm majestic gaze.",
  WILD: "WILD temperament: energetic posture, intense expression, dynamic silhouette, slight controlled asymmetry.",
  FERAL:
    "FERAL temperament: predatory gaze, more evident teeth and dangerous claws, ready-to-strike posture. If BABY, keep juvenile proportions but an intense hunting expression — collectible, never horror.",
  MENACING: "MENACING temperament: heavier visual weight, intimidating expression, stronger facial shadows, aggressive structures.",
  ABYSSAL:
    "ABYSSAL temperament: purposely strange and monstrous, controlled asymmetry, uncommon alien forms. Never low-quality art.",
};

export const mutationLexicon: Record<MutationType, string> = {
  NONE: "no mutation overlay",
  PLASMA:
    "PLASMA mutation: energy lines, electric details, slightly energized parts, more intense eyes, matching aura. Do not recolor the entire creature blue. Genetic colors remain.",
  MAGMA: "MAGMA mutation: fissures, mineral plates, localized inner glow, volcanic feeling without replacing the palette.",
  VOID: "VOID mutation: slightly uncommon forms, darkened recesses, stranger eyes, deep energy, controlled asymmetry.",
  ANCIENT: "ANCIENT mutation: more majestic structures, ancestral patterns, more elaborate horns/plates, primordial presence.",
};

export const mutationIntensityLexicon: Record<MutationIntensity, string> = {
  LOW: "LOW mutation intensity: hint only, small localized signs",
  MEDIUM: "MEDIUM mutation intensity: clearly visible but not dominating the creature",
  HIGH: "HIGH mutation intensity: strong visual mutation while keeping identity and colors",
};

export const lifeStageLexicon: Record<LifeStage, string> = {
  EGG: "This is an EGG. Suggest genetics with shell colors, a simplified pattern, a very subtle aura and a mutation hint. Do not show a complete head, complete eyes, complete horns, cards or stats.",
  BABY: "This creature is a BABY version of its final genetic form. Use a larger head (about 35-45% more visually dominant than the adult), smaller compact torso, shorter limbs, slightly larger paws, more expressive eyes, smaller developing horns, smaller developing wings, less intense aura, subtle mutation expression. Do NOT remove or replace inherited traits. All major genetic traits must already be recognizable.",
  YOUNG:
    "This is the YOUNG life stage of the SAME individual creature shown in the provided reference image. Preserve exact identity. Develop body proportions, limbs, horns, wings, tail, patterns and mutation manifestations. Do not redesign the creature. It is aging naturally.",
  ADULT:
    "This is the ADULT life stage of the SAME individual creature. Preserve identity, facial structure, colors, pattern layout, mutation, horn type, eye type, tail and body plan. Show full mature genetic expression. Do not make it generically aggressive. Temperament must remain as specified.",
};
