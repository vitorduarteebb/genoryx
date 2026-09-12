/**
 * Prova de continuidade visual (spec §58).
 * Não altera breeding. Gera 3 babies (Friendly / Feral / Abyssal) e evolui Young/Adult.
 *
 *   npx tsx apps/api/scripts/proof-creature-visuals.ts
 *
 * CI / sem chave: mock. Com OPENAI_API_KEY e CREATURE_IMAGE_PROVIDER=openai: GPT Image.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assembleVisualGenome, buildCreatureImagePrompt, visualSpecFromGenome } from "@nexora/game-engine";
import type { Temperament } from "@nexora/types";
import { MockCreatureImageProvider } from "../src/modules/creature-visuals/providers/mock.provider";
import { OpenAICreatureImageProvider } from "../src/modules/creature-visuals/providers/openai.provider";

const proofs: Array<{ id: string; speciesKey: string; temperament: Temperament; seed: number }> = [
  { id: "proof-friendly", speciesKey: "pyron", temperament: "FRIENDLY", seed: 1101 },
  { id: "proof-feral", speciesKey: "nympha", temperament: "FERAL", seed: 2202 },
  { id: "proof-abyssal", speciesKey: "florune", temperament: "ABYSSAL", seed: 3303 },
];

async function main() {
  const useOpenAi = process.env.CREATURE_IMAGE_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY);
  const provider = useOpenAi ? new OpenAICreatureImageProvider() : new MockCreatureImageProvider();
  const out = join(process.cwd(), "var", "creature-visual-proof");
  await mkdir(out, { recursive: true });

  for (const row of proofs) {
    const babyGenome = assembleVisualGenome({
      creatureId: row.id,
      speciesKey: row.speciesKey,
      bodyPlanExpressed: row.speciesKey === "nympha" ? "AMPHIBIAN" : row.speciesKey === "florune" ? "BIPED" : "QUADRUPED",
      bodyPlanRecessive: "BIPED",
      headExpressed: row.speciesKey === "nympha" ? "SERPENT" : row.speciesKey === "florune" ? "EXOTIC" : "DRACONIC",
      headRecessive: "BEAST",
      geneticHash: `${row.id}-hash`,
      genesisSeed: row.seed,
      lifeStage: "BABY",
      temperament: row.temperament,
      expressedCardKeys: row.speciesKey === "pyron" ? ["inferno_burst"] : [],
    });
    const geneticHashBefore = `${row.id}-hash`;
    let previous: Buffer | null = null;
    for (const stage of ["BABY", "YOUNG", "ADULT"] as const) {
      const genome = { ...babyGenome, lifeStage: stage };
      const spec = visualSpecFromGenome(row.id, genome, { hasPriorStageReference: Boolean(previous) });
      const prompt = buildCreatureImagePrompt(spec);
      if (prompt.includes("ADMIN RECESSIVE") || prompt.includes(babyGenome.eyeType.recessive) && babyGenome.eyeType.recessive !== babyGenome.eyeType.expressed && prompt.includes(`eyes recessive`)) {
        throw new Error("prompt vazou recessivo");
      }
      const image = previous
        ? await provider.evolveCreatureVisual(spec, prompt, [previous])
        : await provider.generateInitialCreature(spec, prompt);
      previous = image.bytes;
      const file = join(out, `${row.id}-${stage.toLowerCase()}.png`);
      await writeFile(file, image.bytes);
      await writeFile(join(out, `${row.id}-${stage.toLowerCase()}.prompt.txt`), prompt);
      console.log(`wrote ${file} model=${image.model}`);
    }
    if (geneticHashBefore !== `${row.id}-hash`) {
      throw new Error("geneticHash mudou — proibido");
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
