/**
 * One-off: 10 creature-specific card arts for ONE Terranox.
 * Does not write Alpha DB. Does not process Florune/Nympha/other Terranox.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { basename } from "node:path";

const CREATURE_ID = "d9d89416-50c2-4a45-8224-2bcfd1132178";
const MODEL = process.env.OPENAI_CARD_ART_MODEL?.trim() || "gpt-image-2-2026-04-21";
const SIZE = "1024x1024";
const OUT = process.env.CARD_ART_OUT_DIR || "/tmp/terranox-card-art";
const REF = process.env.CANONICAL_REF_PNG || "/tmp/terranox-canonical.png";

const CARDS = [
  { locus: "G1", key: "quake_stomp", name: "Pisada Sísmica", type: "ATTACK", mechanics: "seismic stomp, ground rupture", art: "The exact reference creature stomps the ground with force. Soil ruptures. Seismic waves radiate from the paws. Stones lift. Dynamic EARTH composition. Stone Core language — mineral plates and weight — even in this offensive beat." },
  { locus: "G2", key: "boulder_toss", name: "Lançamento de Rocha", type: "ATTACK", mechanics: "hurled rock fragment", art: "The exact reference creature hurls a large rock fragment using terrestrial force or earth energy. The creature remains fully recognizable. Stone Core mineral identity." },
  { locus: "G3", key: "tremor_pulse", name: "Pulso Sísmico", type: "SKILL", mechanics: "concentric seismic pressure", art: "The exact reference creature at the center. Concentric seismic waves cross the soil. Mineral energy, dust, small fragments. Pressure and territorial control. Stone Core." },
  { locus: "G4", key: "stone_guard", name: "Guarda de Pedra", type: "SKILL", mechanics: "mineral barrier, tank defense", art: "The exact reference creature in a defensive stance. Mineral plates rise around it as a barrier. Do not fully hide the creature. Tank identity of Stone Core is obvious." },
  { locus: "G5", key: "stone_brace", name: "Trava de Pedra", type: "SKILL", mechanics: "body reinforcement, shield readiness", art: "The exact reference creature reinforcing its own body. Mineral structures lock onto it as genetic protection. Shield and readiness. Do not draw a playing card or a draw symbol." },
  { locus: "G6", key: "dust_cloud", name: "Nuvem de Poeira", type: "SKILL", mechanics: "controlled dust burst, obscured sight", art: "The exact reference creature produces a controlled dust burst spreading toward an unseen foe. Eyes or opponent partly obscured. Blind as visual dust, never the word Blind." },
  { locus: "G7", key: "rumble_guard", name: "Guarda do Tremor", type: "REACTION", mechanics: "instant mineral barrier", art: "Reaction. The exact reference creature anticipates an impact. The soil answers instantly. A mineral barrier erupts. Immediate response. Strong Tank / Stone Core." },
  { locus: "G8", key: "bedrock_pact", name: "Pacto do Leito", type: "SKILL", mechanics: "earth resonance, synergy", art: "The exact reference creature connected to deep bedrock. Energy lines travel through stones, soil, and the creature's core. Synergy, momentum, earth resonance. No diagrams." },
  { locus: "G9", key: "titan_growl", name: "Rosnado Titânico", type: "SIGNATURE", mechanics: "titanic Stone Core presence", art: "SIGNATURE. Strongest Stone Core presence. The exact Baby Terranox assumes titanic presence. Terrestrial energy radiates from the body. A pressure roar, not literal sound waves. Lineage manifestation." },
  { locus: "G10", key: "mountain_crash", name: "Queda da Montanha", type: "ULTIMATE", mechanics: "epic mineral collapse", art: "ULTIMATE. The exact reference creature is the focus. Greater terrestrial manifestation. Rocks and mineral mass collapse toward a target. Epic but still readable as a card. Do not bury the creature in effects." },
];

function promptFor(card) {
  return `Create the official GENORYX genetic ability card illustration
for the exact creature shown in the reference image.

The reference creature is the canonical visual identity.
Preserve the same individual creature.

CARD:
${card.name}

TYPE:
${card.type}

ELEMENT:
EARTH

GENETIC POWER:
Núcleo Pétreo

LIFE STAGE:
BABY

MECHANICS:
${card.mechanics}

VISUAL DIRECTION:
${card.art}

ELEMENT LANGUAGE:
Stone plates, soil burst, mineral weight. Large readable forms. Discreet gold. Stratified angular mineral language. Not generic brown.

IMPORTANT:
The creature depicted must clearly be the same individual
as the provided canonical creature reference.

Preserve:
body shape
face
colors
horns
tail
wings/back structures
pattern
material
distinctive features.

Show the creature performing the ability.

Do not redesign the creature.
Do not age the creature. Keep the same BABY life stage in every card.
Do not invent a different Terranox.

NO text.
NO letters.
NO numbers.
NO card frame.
NO UI.
NO logo.
NO watermark.

The illustration must communicate the card effect visually without relying on written language.
Do not write the card name.
Do not depict damage numbers, costs, gene loci or stats.`;
}

function requireKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY ausente.");
  }
  return key;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function generateOne(card, referenceBytes) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", promptFor(card));
  form.append("size", SIZE);
  form.append("n", "1");
  form.append("image[]", new Blob([referenceBytes], { type: "image/png" }), "canonical.png");
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireKey()}` },
    body: form,
    signal: AbortSignal.timeout(180_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message ?? `OpenAI HTTP ${response.status}`;
    throw new Error(String(message).replace(/sk-[a-zA-Z0-9_\-]+/g, "sk-***"));
  }
  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI não devolveu b64_json.");
  }
  return {
    bytes: Buffer.from(b64, "base64"),
    usage: payload.usage
      ? {
          inputTokens: payload.usage.input_tokens,
          outputTokens: payload.usage.output_tokens,
          totalTokens: payload.usage.total_tokens,
          images: payload.usage.image_count,
        }
      : null,
  };
}

async function main() {
  if (process.argv.includes("--other")) {
    throw new Error("Recusado: este script só gera o Terranox autorizado.");
  }
  await mkdir(OUT, { recursive: true });
  const referenceBytes = await readFile(REF);
  const canonicalHash = createHash("sha256").update(referenceBytes).digest("hex");
  const report = {
    creatureId: CREATURE_ID,
    species: "terranox",
    lifeStage: "BABY",
    geneticPower: "Núcleo Pétreo",
    scope: "CREATURE",
    model: MODEL,
    canonicalVisualImageHash: canonicalHash,
    otherCreaturesProcessed: 0,
    cards: [],
  };
  for (const card of CARDS) {
    const dest = `${OUT}/${card.locus}.png`;
    if (await exists(dest)) {
      const bytes = await readFile(dest);
      report.cards.push({
        ...card,
        skipped: true,
        imageHash: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
        file: dest,
      });
      console.log(JSON.stringify({ locus: card.locus, skipped: true }));
      continue;
    }
    await new Promise((resolve) => setTimeout(resolve, 14000));
    const started = Date.now();
    const generated = await generateOne(card, referenceBytes);
    await writeFile(dest, generated.bytes);
    const row = {
      ...card,
      skipped: false,
      imageHash: createHash("sha256").update(generated.bytes).digest("hex"),
      bytes: generated.bytes.length,
      usage: generated.usage,
      ms: Date.now() - started,
      file: dest,
    };
    report.cards.push(row);
    console.log(JSON.stringify({ locus: card.locus, ready: true, imageHash: row.imageHash, ms: row.ms }));
  }
  await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ phase: "done", creatureId: CREATURE_ID, ready: report.cards.length, stopped: true, otherCreaturesProcessed: 0 }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
