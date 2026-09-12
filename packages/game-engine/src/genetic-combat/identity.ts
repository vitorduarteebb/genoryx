import { anatomyVocabulary, identityLexicon, quirkCatalog } from "@nexora/config";
import type { CreatureBlueprint } from "../genes/generate";
import { createSeededRandom } from "../random/random-service";
import { buildPersonalResource } from "./resource";
import { subSeed } from "./seeds";
import type { BirthRolls, CombatIdentity, CombatQuirk, GeneticExpression } from "./types";

function pickVerbs(blueprint: CreatureBlueprint, expression: GeneticExpression, rng: ReturnType<typeof createSeededRandom>): string[] {
  const scored: Array<{ verb: string; weight: number }> = [];
  const chassis = blueprint.chassis;
  const push = (slot: keyof typeof anatomyVocabulary, key: string, expressed: string | undefined) => {
    if (!expressed || expressed === "HORNS_NONE") {
      return;
    }
    const pool = anatomyVocabulary[slot] ?? [];
    const verb = pool[Math.floor(rng.next() * pool.length)];
    if (verb) {
      scored.push({ verb, weight: expression[key] ?? 40 });
    }
  };
  push("head", "head", chassis?.head.d ?? blueprint.headExpressed);
  push("body", "body", chassis?.body.d ?? blueprint.bodyPlanExpressed);
  push("horns", "horns", chassis?.horns.d);
  push("wings", "back", chassis?.back.d);
  push("tail", "tail", chassis?.tail.d);
  push("eyes", "eyes", chassis?.eyes.d);
  push("limbs", "limbs", chassis?.limbs.d);
  push("aura", "aura", chassis?.aura.d);
  scored.sort((a, b) => b.weight - a.weight);
  const unique = [...new Set(scored.map((row) => row.verb))];
  return unique.slice(0, 4);
}

function pickQuirks(input: {
  blueprint: CreatureBlueprint;
  rolls: BirthRolls;
  rng: ReturnType<typeof createSeededRandom>;
}): CombatQuirk[] {
  const quirks: CombatQuirk[] = [];
  if (input.rolls.quirk >= 72 || input.rolls.quirk <= 18) {
    const row = input.rng.pick(quirkCatalog);
    quirks.push({ key: row.key, namePt: row.namePt, textPt: row.textPt });
  }
  if (input.blueprint.mutationKey || (input.rolls.mutation >= 85 && input.blueprint.origin !== "STARTER")) {
    quirks.push({
      key: "RARE_MUTATION",
      namePt: input.blueprint.mutationKey ? `Mutação ${input.blueprint.mutationKey}` : "Mutação rara",
      textPt: "Altera o ciclo de recurso. Raro não significa poderoso.",
    });
  }
  if (input.rolls.mutation <= 18 && input.blueprint.origin !== "STARTER") {
    quirks.push({
      key: "NEGATIVE_MUTATION",
      namePt: "Mutação danosa",
      textPt: "A genética desvia o kit: mais condição, menos eficiência.",
    });
  }
  return quirks;
}

export function buildCombatIdentity(input: {
  blueprint: CreatureBlueprint;
  expression: GeneticExpression;
  rolls: BirthRolls;
  birthSeed: number;
  retryIndex?: number;
}): CombatIdentity {
  const rng = createSeededRandom(subSeed(input.birthSeed, `identity:${input.retryIndex ?? 0}`));
  const verbs = pickVerbs(input.blueprint, input.expression, rng);
  const quirks = pickQuirks({ blueprint: input.blueprint, rolls: input.rolls, rng });
  const predator = (input.expression.predator ?? 0) >= 60;
  const tank = (input.expression.tank ?? 0) >= 60;
  const archetype = predator && tank ? "HYBRID" : predator ? "PREDATOR" : tank ? "TANK" : verbs.includes("CONTROL") ? "CONTROL" : "SKIRMISHER";
  const resource = buildPersonalResource({
    blueprint: input.blueprint,
    expression: input.expression,
    rolls: input.rolls,
    birthSeed: input.birthSeed,
    verbs,
    archetype,
    quirks: quirks.map((row) => row.key),
    retryIndex: input.retryIndex,
  });
  const lexicon = identityLexicon[resource.resourceType] ?? identityLexicon.ECHO!;
  const namePt = rng.pick(lexicon.names);
  const stylePt = rng.pick(lexicon.styles);
  const anomaly =
    input.rolls.novelty >= 96
      ? { key: "STACK_CAP", textPt: `${resource.displayName} máximo 4, mas perde 1 ao receber controle.` }
      : null;
  if (anomaly) {
    resource.maxStacks = 4;
  }
  const strengths = [
    ...(tank ? ["Frontline", "Escudo"] : []),
    ...(predator ? ["Execute", "Crit"] : []),
    resource.displayName,
    ...verbs.slice(0, 2),
  ].slice(0, 4);
  const weaknesses: string[] = [];
  if (input.rolls.coherence < 40) weaknesses.push("Kit incoerente");
  if (input.rolls.efficiency < 40) weaknesses.push("Custos altos");
  if (input.rolls.stability < 35) weaknesses.push("Instável");
  if (input.rolls.potency < 40) weaknesses.push("Pico baixo");
  if (quirks.some((row) => row.key === "SLOW_STARTER")) weaknesses.push("Setup lento");
  if (weaknesses.length === 0) weaknesses.push(tank ? "Vulnerável a dispel" : "Precisa de setup");
  return {
    key: `${resource.id}_${archetype}_${namePt.replace(/\s+/g, "_").toUpperCase()}`,
    namePt,
    stylePt,
    archetype,
    resource,
    verbs,
    strengths,
    weaknesses,
    synergyTags: [input.blueprint.elementPrimary, resource.id, archetype, ...verbs.slice(0, 2)],
    quirks,
    anomaly,
  };
}
