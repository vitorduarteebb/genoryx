"use client";

import { type ChassisView, type CreaturePhenotype } from "@nexora/config";
import type { Element } from "@nexora/types";
import type { PresentedVisual } from "../lib/creature-art";
import { CreatureCollectCard } from "./creature-collect-card";
import { CreaturePortrait } from "./creature-portrait";

export type CreaturePick = {
  id: string;
  name: string;
  speciesKey?: string;
  speciesName: string;
  gender: "MALE" | "FEMALE";
  fertility: number;
  generation: number;
  bodyPlan: string;
  head: string;
  elementPrimary: Element | string;
  genesisSeed?: number;
  phenotype?: CreaturePhenotype;
  lock?: string;
  portraitUrl?: string | null;
  visualStatus?: string | null;
  visualJob?: boolean;
  visual?: PresentedVisual | null;
  revealStatus?: string | null;
  lifeStage?: string;
  temperament?: string;
  imageHash?: string | null;
  visualSeed?: string | null;
  model?: { status: string; url: string | null; version: number } | null;
  mutation?: string | null;
  typology?: string | null;
  combatIdentity?: {
    namePt?: string;
    archetype?: string;
    synergyTags?: string[];
    resource?: { displayName: string } | null;
  } | null;
  geneticPower?: { name: string; typology: string; lineageId?: string | null; element?: string } | null;
  chassis?: ChassisView | null;
};

const ELEMENT_TONE: Record<string, string> = {
  FIRE: "from-ember/35 via-[#2a140c] to-void text-ember",
  WATER: "from-crystal/30 via-[#0c2224] to-void text-crystal",
  NATURE: "from-emerald-500/25 via-[#102018] to-void text-emerald-300",
  EARTH: "from-amber-700/30 via-[#1c140c] to-void text-amber-200",
  ELECTRIC: "from-gold/30 via-[#241c0c] to-void text-gold",
  ICE: "from-sky-300/25 via-[#0c1a24] to-void text-sky-200",
  LIGHT: "from-yellow-100/20 via-[#242018] to-void text-yellow-100",
  DARK: "from-violet-700/30 via-[#140c1c] to-void text-violet-200",
  ARCANE: "from-crystal/20 via-[#161024] to-void text-crystal",
};

export function genderLabel(gender: CreaturePick["gender"]) {
  return gender === "MALE" ? "Macho" : "Fêmea";
}

export function genderMark(gender: CreaturePick["gender"]) {
  return gender === "MALE" ? "♂" : "♀";
}

export function elementTone(element: string) {
  return ELEMENT_TONE[element] ?? ELEMENT_TONE.ARCANE;
}

export function FertilityPips({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Fertilidade ${value} de ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-1.5 rotate-45 ${index < value ? "bg-gold" : "bg-[#2a2438]"}`}
        />
      ))}
    </span>
  );
}

export function CreatureSilhouette({
  name,
  element,
  gender,
  speciesKey,
  bodyPlan,
  head,
  genesisSeed,
  phenotype,
  portraitUrl,
  visualStatus,
  visualJob,
  visual,
  revealStatus,
  chassis,
  size = 72,
}: {
  name: string;
  element: string;
  gender: CreaturePick["gender"];
  speciesKey?: string;
  bodyPlan?: string;
  head?: string;
  genesisSeed?: number;
  phenotype?: CreaturePhenotype;
  portraitUrl?: string | null;
  visualStatus?: string | null;
  visualJob?: boolean;
  visual?: PresentedVisual | null;
  revealStatus?: string | null;
  chassis?: ChassisView | null;
  size?: number;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b shadow-[0_0_24px_rgba(228,195,106,0.12)] ${elementTone(element)}`}
      style={{ width: size, height: size }}
    >
      {speciesKey || revealStatus ? (
        <CreaturePortrait
          speciesKey={speciesKey}
          bodyPlan={bodyPlan}
          head={head}
          element={element}
          genesisSeed={genesisSeed}
          phenotype={phenotype}
          portraitUrl={portraitUrl}
          visualStatus={visualStatus}
          visualJob={visualJob}
          visual={visual}
          revealStatus={revealStatus}
          chassis={chassis}
          size={size}
        />
      ) : (
        <span className="font-display text-2xl leading-none">{name.slice(0, 1).toUpperCase()}</span>
      )}
      <span
        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border bg-void text-sm ${
          gender === "MALE" ? "border-gold/50 text-gold" : "border-crystal/50 text-crystal"
        }`}
      >
        {genderMark(gender)}
      </span>
    </div>
  );
}

const PICK_LOCK_LABEL: Record<string, string> = {
  MARKET: "À venda no mercado",
  BATTLE: "Em combate",
  BREEDING: "Cruzando agora",
};

export function creaturePickBlockReason(creature: CreaturePick): string | null {
  if (creature.lock && creature.lock !== "NONE") {
    return PICK_LOCK_LABEL[creature.lock] ?? "Ocupada";
  }
  if (creature.fertility <= 0) {
    return "Fertilidade esgotada";
  }
  return null;
}

export function CreaturePickCard({
  creature,
  selected,
  disabled,
  onSelect,
}: {
  creature: CreaturePick;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const reason = creaturePickBlockReason(creature);
  const locked = Boolean(disabled || reason);
  return (
    <CreatureCollectCard
      creature={creature}
      selected={selected}
      disabled={locked}
      lockHint={reason}
      onSelect={onSelect}
    />
  );
}
