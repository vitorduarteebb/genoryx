import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCreatureBlueprint } from "../genes/generate";
import { assembleCreatureCardKit } from "./kit";
import { refineSealedKit, summarizeContentPass, type SealedCardInput } from "./content-pass";
import { buildShowcaseTrio, compositionChecklist } from "./content-pass-showcase";

const SPECIES = ["pyron", "sparkyn", "terranox", "florune", "voltaris", "nympha"] as const;
let audited = 0;
let changed = 0;
let kept = 0;
const problems = new Map<string, number>();
const changeKinds = new Map<string, number>();
const beforeAfter: unknown[] = [];

for (let i = 0; i < 120; i += 1) {
  const species = SPECIES[i % SPECIES.length]!;
  const blueprint = generateCreatureBlueprint({
    seed: 31_000 + i * 13,
    speciesKey: species,
    origin: i % 4 === 0 ? "STARTER" : "WILD",
  });
  const kit = assembleCreatureCardKit({ creatureId: `a${i}`, blueprint });
  const inputs: SealedCardInput[] = kit.cards.map((card) => ({
    key: card.cardFamily,
    name: card.namePt,
    locus: card.locus,
    cost: card.cost,
    element: card.element,
    function: card.function,
    tier: card.tier,
    targetType: card.targetType,
    effects: card.effects,
    genes: blueprint.genes,
    anatomy: card.modifierGenes,
    quirks: kit.combat?.identity.quirks.map((row) => row.key) ?? [],
    verbs: kit.combat?.identity.verbs ?? [],
  }));
  const summary = summarizeContentPass(inputs);
  const refined = refineSealedKit(inputs);
  audited += summary.audited;
  changed += summary.changed;
  kept += summary.kept;
  for (const problem of summary.problemsBefore) {
    const key = problem.split(": ").slice(1).join(": ") || problem;
    problems.set(key, (problems.get(key) ?? 0) + 1);
  }
  refined.forEach((row, idx) => {
    for (const change of row.changes) {
      const kind = change.split(":")[0] ?? change;
      changeKinds.set(kind, (changeKinds.get(kind) ?? 0) + 1);
    }
    if (beforeAfter.length < 14 && row.changes.length > 0) {
      const input = inputs[idx]!;
      beforeAfter.push({
        name: input.name,
        locus: input.locus,
        before: input.effects
          .map((effect) => `${effect.op}${effect.status ? `:${effect.status}` : ""}${effect.condition ? JSON.stringify(effect.condition) : ""}`)
          .join(" > "),
        after: row.effects
          .map((effect) => `${effect.op}${effect.status ? `:${effect.status}` : ""}${effect.condition ? JSON.stringify(effect.condition) : ""}`)
          .join(" > "),
        domain: row.domain,
        speed: row.speed,
        roles: row.roles,
        changes: row.changes,
      });
    }
  });
}

const trio = buildShowcaseTrio();
const checklist = compositionChecklist(trio);
const kits = Object.fromEntries(
  Object.entries(trio).map(([key, value]) => [
    key,
    {
      archetype: value.archetype,
      species: value.blueprint.speciesKey,
      genes: value.blueprint.genes,
      identity: value.kit.combat?.identity?.namePt,
      resource: value.kit.combat?.identity?.resource?.id,
      coverage: value.coverage,
      cards: value.refined.map((row, index) => ({
        locus: value.kit.cards[index]!.locus,
        name: row.name,
        cost: row.cost,
        domain: row.contentPass.domain,
        speed: row.contentPass.speed,
        roles: row.contentPass.roles,
        ops: row.effects
          .map(
            (effect) =>
              `${effect.op}${effect.status ? `:${effect.status}` : ""}${
                effect.condition?.targetHas ? `@${effect.condition.targetHas}` : ""
              }${effect.condition?.selfPosition ? `@${effect.condition.selfPosition}` : ""}`,
          )
          .join(" > "),
        changes: row.contentPass.changes,
      })),
    },
  ]),
);

const report = {
  version: "gxr-content-v2",
  audited,
  changed,
  kept,
  problemTop: [...problems.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
  changeKinds: [...changeKinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25),
  beforeAfter,
  compositions: checklist,
  kits,
};

writeFileSync(resolve(process.cwd(), "../../docs/grimoire-content-pass-report.json"), JSON.stringify(report, null, 2));
process.stdout.write(`${JSON.stringify({ audited, changed, kept, compositions: checklist }, null, 2)}\n`);
