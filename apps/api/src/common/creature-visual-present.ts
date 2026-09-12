import { isRevealHidden, resolveCreatureVisual, visualProviderOf } from "@nexora/config";
import type { CreatureRevealStatus, VisualImageProvider } from "@nexora/types";
import type { CreatureRecord } from "./creature-io";
import { currentVisualProvider, isImageProviderOutage } from "../modules/creature-visuals/generation-key";
import { parseChassisDna } from "@nexora/game-engine";

export function officialVisualPending(row: CreatureRecord): boolean {
  const preferred = currentVisualProvider();
  const assets = row.visualAssets ?? [];
  if (
    assets.some(
      (asset) => asset.lifeStage === row.lifeStage && visualProviderOf(asset) === preferred && asset.status === "READY",
    )
  ) {
    return false;
  }
  return assets.some(
    (asset) =>
      asset.lifeStage === row.lifeStage &&
      visualProviderOf(asset) === preferred &&
      (asset.status === "PENDING" || asset.status === "GENERATING" || asset.status === "VALIDATING"),
  );
}

export type PresentedVisual = {
  status: "READY" | "PENDING" | "FAILED" | "FORMING";
  lifeStage: string;
  url: string | null;
  imageHash: string | null;
  source: "canonical" | "fallback" | "legacy" | "forming";
  provider: VisualImageProvider | null;
};

export function revealStatusOf(row: { revealStatus?: CreatureRevealStatus | string | null }): CreatureRevealStatus {
  const value = row.revealStatus;
  if (value === "NOT_REQUIRED" || value === "PENDING_VISUAL" || value === "READY_TO_REVEAL" || value === "REVEALED") {
    return value;
  }
  return "REVEALED";
}

export function canUseRevealedCreature(status: CreatureRevealStatus | string | null | undefined): boolean {
  return status === "REVEALED" || status === "NOT_REQUIRED";
}

export function resolveRowVisual(row: CreatureRecord, options?: { strictPreferred?: boolean }): PresentedVisual {
  return resolveCreatureVisual({
    lifeStage: row.lifeStage,
    assets: row.visualAssets ?? [],
    revealStatus: revealStatusOf(row),
    preferredProvider: currentVisualProvider(),
    strictPreferred: options?.strictPreferred,
  });
}

export function presentCollectionVisual(row: CreatureRecord): PresentedVisual {
  const resolved = resolveRowVisual(row);
  if (isRevealHidden(revealStatusOf(row))) {
    return {
      status: resolved.status === "FAILED" ? "FAILED" : resolved.status === "READY" ? "READY" : "FORMING",
      lifeStage: row.lifeStage,
      url: null,
      imageHash: null,
      source: "forming",
      provider: resolved.provider,
    };
  }
  return resolved;
}

export function isRareGeneticExpression(row: CreatureRecord): boolean {
  if (row.mutation?.key) {
    return true;
  }
  if (row.generation >= 4) {
    return true;
  }
  return Number(row.geneticPurity) >= 0.92;
}

export function officialVisualBlocked(row: CreatureRecord): boolean {
  const preferred = currentVisualProvider();
  return (row.visualAssets ?? []).some(
    (asset) =>
      asset.lifeStage === row.lifeStage &&
      visualProviderOf(asset) === preferred &&
      (asset.status === "FAILED_REVIEW" ||
        (asset.status === "FAILED" && isImageProviderOutage(asset.failureReason))),
  );
}

export function genesisCanConfirm(row: CreatureRecord): boolean {
  const visual = resolveRowVisual(row, { strictPreferred: currentVisualProvider() === "OPENAI" });
  if (revealStatusOf(row) === "READY_TO_REVEAL" && visual.status === "READY" && visual.url) {
    return true;
  }
  return officialVisualBlocked(row);
}

export function presentGenesisReveal(row: CreatureRecord) {
  const genome = (row.visualGenomeJson ?? {}) as { auraType?: { expressed?: string }; chassis?: unknown };
  const visual = resolveRowVisual(row, { strictPreferred: currentVisualProvider() === "OPENAI" });
  const revealStatus = revealStatusOf(row);
  const blocked = officialVisualBlocked(row);
  return {
    creatureId: row.id,
    revealStatus,
    hatchStatus: revealStatus === "REVEALED" ? "REVEALED" : "AWAITING_GENESIS_REVEAL",
    speciesName: row.species.name,
    speciesKey: row.species.key,
    generation: row.generation,
    bodyPlan: row.bodyPlanExpressed,
    temperament: row.temperament,
    mutation: row.mutation?.key ?? null,
    rareExpression: isRareGeneticExpression(row),
    aura: genome.auraType?.expressed ?? "NONE",
    chassis: parseChassisDna(genome.chassis),
    visual: {
      status: blocked ? "FAILED" : visual.status,
      lifeStage: visual.lifeStage,
      url: visual.status === "READY" ? visual.url : null,
      imageHash: visual.status === "READY" ? visual.imageHash : null,
      canConfirm: genesisCanConfirm(row),
    },
    element: row.elementPrimary,
  };
}

export function genesisPayloadHasNoSecrets(payload: ReturnType<typeof presentGenesisReveal>): boolean {
  const blob = JSON.stringify(payload);
  return !blob.includes("recessive") && !blob.includes("bodyPlanRecessive") && !blob.includes("headRecessive");
}
