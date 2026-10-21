import { energyForRound, genomeV2, getCardDefinition, presentCard, presentPlayableCard, type BattleCreatureVisual, type ResolvedCardArt } from "@nexora/config";
import {
  assignFormationSlots,
  battleFusionEnabled,
  casualHints,
  casualSummary,
  combatLineOf,
  currentPressure,
  eligibleResponses,
  explainTargets,
  hydrateResolutionProfile,
  hydrateGenomeProfile,
  middleWindowOpen,
  presentBattleEvents,
  replayFoundation,
  reservePreview,
  resolveMatchRules,
  TIMING_LABEL_PT,
  usesLinearFormation,
  type BattleSide,
  type BattleState,
  type CardInstance,
  type Combatant,
} from "@nexora/game-engine";

export type PresentedBattleCard = Omit<ReturnType<typeof presentCard>, "locus"> & {
  instanceId: string;
  definitionKey: string;
  artUrl: string | null;
  imageHash: string | null;
  sourceCreature?: string;
  sourceCreatureId?: string;
  sourceTypology?: string;
  timingClass?: string;
  timingLabel?: string;
  resolutionMode?: string;
  stackSpeed?: string;
  effectDomain?: string;
  locus?: string | null;
  genome?: {
    domain: string;
    domainLabel: string;
    speed: string;
    speedLabel: string;
    rulesText: string;
    scale: number;
  };
  effects?: ReadonlyArray<{
    op: string;
    value?: number;
    resource?: string;
    status?: string;
    condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string };
  }>;
};

export type PresentedBattleCreature = Combatant & {
  visual: BattleCreatureVisual;
};

export type BattleSideView = Omit<BattleSide, "hand" | "creatures"> & {
  handCount: number;
  deckCount: number;
  discardCount: number;
  hand: PresentedBattleCard[];
  creatures: PresentedBattleCreature[];
};

export type BattleView = {
  battleId: string;
  yourSide: 0 | 1;
  yourTurn: boolean;
  renderer: "web" | "unity";
  events: ReturnType<typeof presentBattleEvents>;
  validTargets: Record<string, string[]>;
  blockedTargets?: Record<string, Record<string, string>>;
  targetInfo?: Record<string, ReturnType<typeof explainTargets>>;
  combatDebug?: {
    battleDeck: {
      total: number;
      byCreature: Record<string, number>;
      drawPile: number;
      hand: number;
      discard: number;
      exile: number;
    };
    formation: Record<string, Record<string, string>>;
    handByCreature: Record<string, number>;
    actionQueue?: unknown;
    reactionSlot?: unknown;
    cardTiming?: unknown;
    battleStack?: unknown;
    priorityWindow?: unknown;
    mana?: unknown;
    surcharge?: unknown;
    preparedEffects?: unknown;
    channels?: unknown;
    virtualManifestations?: unknown;
    statuses?: unknown;
    resources?: unknown;
    resonance?: unknown;
    geneticChain?: unknown;
    eventChain?: unknown;
    damageBreakdown?: unknown;
    rng?: unknown;
    winCondition?: unknown;
    rulesVersion?: string;
  };
  middleWindow?: "OPEN" | "CLOSED";
  energyCap: number;
  genomeTimeline?: Array<{ id: string; name: string; cardName: string; speed: string; initiative: number; ghost: boolean; side: 0 | 1 }>;
  linear: boolean;
  fusionEnabled: boolean;
  matchRules?: BattleState["matchRules"];
  hints?: ReturnType<typeof casualHints>;
  pressure?: ReturnType<typeof currentPressure>;
  casualRecap?: ReturnType<typeof casualSummary>;
  replay?: ReturnType<typeof replayFoundation>;
  clock?: BattleState["clock"];
  reactionArmed?: [boolean, boolean];
  returnMapKey?: string;
  arcaneReserve?: { leftover: number; manaGain: number; overcommit: boolean };
  magicWar?: BattleState["magicWar"];
  /** Cartas da sua mão que podem responder agora na Guerra Mágica. */
  magicWarRespondIds?: string[];
  state: Omit<BattleState, "sides"> & { sides: [BattleSideView, BattleSideView] };
};

function hidePrivate(side: BattleSideView): BattleSideView {
  return {
    ...side,
    hand: [],
    deck: [],
    discard: [],
    exile: [],
    fusion: side.fusion
      ? {
          ...side.fusion,
          pool: [],
          awakened: null,
          convergence: null,
        }
      : undefined,
    actionQueue: [],
    reservedEnergy: 0,
    reactionSlot: null,
    reactionArmedVisible: Boolean(side.reactionSlot),
  };
}

export function presentBattleCard(
  card: CardInstance,
  art?: ResolvedCardArt | null,
  source?: { name?: string; typology?: string; portraitUrl?: string | null },
): PresentedBattleCard {
  const presented = card.resolved ? presentPlayableCard(card.resolved) : presentCard(card.definitionKey);
  const effects = card.resolved?.effects;
  const profile = card.resolved ? hydrateResolutionProfile(card.resolved, card.locus ?? card.resolved.locusRole) : null;
  const genome = card.resolved ? hydrateGenomeProfile(card.resolved, card.locus ?? card.resolved.locusRole) : null;
  return {
    instanceId: card.instanceId,
    definitionKey: card.definitionKey,
    ...presented,
    timingClass: profile?.timingClass ?? presented.timingClass,
    timingLabel: profile ? TIMING_LABEL_PT[profile.timingClass] : presented.timingLabel,
    resolutionMode: profile?.resolutionMode,
    stackSpeed: profile?.stackSpeed,
    effectDomain: profile?.effectDomain,
    genome: genome
      ? {
          domain: genome.domain,
          domainLabel: genomeV2.domainLabel[genome.domain],
          speed: genome.speed,
          speedLabel: genomeV2.speedLabel[genome.speed],
          rulesText: genome.rulesText,
          scale: genome.scale,
        }
      : undefined,
    effects,
    artUrl: art?.artUrl ?? source?.portraitUrl ?? null,
    imageHash: art?.imageHash ?? null,
    sourceCreature: source?.name ?? card.sourceCreatureId,
    sourceCreatureId: card.sourceCreatureId,
    sourceTypology: source?.typology ?? card.typology,
    locus: card.locus ?? null,
  };
}

export function presentBattleCreature(unit: Combatant, visual: BattleCreatureVisual): PresentedBattleCreature {
  return { ...unit, visual };
}

export function presentBattle(
  battleId: string,
  state: BattleState,
  characterId: string,
  extras?: {
    cardArt?: Map<string, ResolvedCardArt>;
    visuals?: Map<string, BattleCreatureVisual>;
    renderer?: "web" | "unity";
  },
): BattleView {
  const found = state.sides.findIndex((side) => side.characterId === characterId);
  const yourSide: 0 | 1 = found === 1 ? 1 : 0;
  const clone = structuredClone(state);
  const artOf = (card: CardInstance) => {
    const creatureKey = card.sourceCreatureId ? `${card.sourceCreatureId}:${card.definitionKey}` : null;
    return (creatureKey ? extras?.cardArt?.get(creatureKey) : undefined) ?? extras?.cardArt?.get(card.definitionKey) ?? null;
  };
  const visualOf = (unit: Combatant): BattleCreatureVisual => {
    const byId = unit.creatureId ? extras?.visuals?.get(unit.creatureId) : undefined;
    if (byId) {
      return byId;
    }
    return extras?.visuals?.get(`species:${unit.speciesKey}`) ?? {
      renderMode: "SILHOUETTE",
      modelUrl: null,
      portraitUrl: null,
      imageHash: null,
      lifeStage: "BABY",
      temperament: null,
      bodyPlan: null,
      mutation: null,
      aura: null,
      visualSeed: null,
      source: "silhouette",
      provider: null,
      forming: false,
    };
  };

  const toSide = (side: BattleSide): BattleSideView => {
    const slotted = assignFormationSlots(side.creatures, state.rulesVersion ?? "V1");
    return {
      ...side,
      creatures: slotted.map((unit) => presentBattleCreature(unit, visualOf(unit))),
      hand: side.hand
        .filter((card) => {
          if (!card.sourceCreatureId) {
            return true;
          }
          const owner = side.creatures.find((unit) => unit.creatureId === card.sourceCreatureId);
          return !owner || owner.hp > 0;
        })
        .map((card) => {
          const owner = side.creatures.find((unit) => unit.creatureId === card.sourceCreatureId);
          return presentBattleCard(card, artOf(card), {
            name: owner?.name,
            typology: card.typology ?? owner?.typology,
            portraitUrl: extras?.visuals?.get(card.sourceCreatureId ?? "")?.portraitUrl,
          });
        }),
      handCount: side.hand.length,
      deckCount: side.deck.length,
      discardCount: side.discard.length,
    };
  };

  const sides: [BattleSideView, BattleSideView] = [toSide(clone.sides[0]), toSide(clone.sides[1])];
  const other = yourSide === 0 ? 1 : 0;
  clone.fusion = clone.sides[yourSide].fusion ?? clone.fusion;
  const validTargets: Record<string, string[]> = {};
  const blockedTargets: Record<string, Record<string, string>> = {};
  const targetInfo: Record<string, ReturnType<typeof explainTargets>> = {};
  if (clone.status === "ACTIVE") {
    for (const card of clone.sides[yourSide].hand) {
      const definition = card.resolved ?? getCardDefinition(card.definitionKey);
      const info = explainTargets({
        allies: clone.sides[yourSide].creatures,
        enemies: clone.sides[other].creatures,
        targetType: definition?.targetType ?? "ENEMY",
        tags: definition?.tags ?? [],
      });
      validTargets[card.instanceId] = info.validTargets;
      blockedTargets[card.instanceId] = info.blockedTargets;
      targetInfo[card.instanceId] = info;
    }
  }
  const genomeTimeline = [
    ...(clone.sides[yourSide].actionQueue ?? []).map((item) => {
      const def = item.card.resolved ?? getCardDefinition(item.card.definitionKey);
      const profile = hydrateGenomeProfile(def ?? undefined, item.card.locus);
      const unit = clone.sides[yourSide].creatures.find((row) => row.creatureId === item.card.sourceCreatureId);
      return {
        id: item.id,
        name: unit?.name ?? clone.sides[yourSide].displayName,
        cardName: def?.name ?? item.card.definitionKey,
        speed: genomeV2.speedLabel[profile.speed],
        initiative: (unit?.spd ?? 0) + genomeV2.cardSpeedBonus[profile.speed],
        ghost: false,
        side: yourSide,
      };
    }),
    ...clone.sides[other].creatures.filter((unit) => unit.hp > 0).map((unit) => ({
      id: `ghost-${unit.id}`,
      name: unit.name,
      cardName: "se jogar Normal",
      speed: genomeV2.speedLabel.NORMAL,
      initiative: unit.spd + genomeV2.cardSpeedBonus.NORMAL,
      ghost: true,
      side: other as 0 | 1,
    })),
  ].sort((a, b) => b.initiative - a.initiative);
  const yours = clone.sides[yourSide];
  const allYours = [...yours.hand, ...yours.deck, ...yours.discard, ...yours.exile];
  const byCreature: Record<string, number> = {};
  const handByCreature: Record<string, number> = {};
  for (const card of allYours) {
    const key = card.sourceCreatureId ?? "none";
    byCreature[key] = (byCreature[key] ?? 0) + 1;
  }
  for (const card of yours.hand) {
    const key = card.sourceCreatureId ?? "none";
    handByCreature[key] = (handByCreature[key] ?? 0) + 1;
  }
  const formationOf = (side: BattleSide) => {
    const map: Record<string, string> = { FRONT: "—", MID: "—", BACKLINE: "—" };
    for (const unit of side.creatures) {
      if (unit.hp <= 0) continue;
      map[combatLineOf(unit.slot)] = unit.name;
    }
    return map;
  };
  sides[other] = hidePrivate(sides[other]);
  const magicWarRespondIds =
    clone.magicWar?.open && clone.activeSide === yourSide
      ? eligibleResponses(clone, clone.magicWar.window ?? "DECLARE", clone.magicWar.frames.at(-1))
          .filter((row) => row.side === yourSide)
          .map((row) => row.card.instanceId)
      : [];
  return {
    battleId,
    yourSide,
    yourTurn: clone.status === "ACTIVE" && clone.activeSide === yourSide,
    renderer: extras?.renderer ?? "web",
    events: presentBattleEvents(clone.log),
    validTargets,
    blockedTargets,
    targetInfo,
    combatDebug: {
      rulesVersion: resolveMatchRules(clone).rulesVersion,
      battleDeck: {
        total: allYours.length,
        byCreature,
        drawPile: yours.deck.length,
        hand: yours.hand.length,
        discard: yours.discard.length,
        exile: yours.exile.length,
      },
      formation: {
        sideA: formationOf(clone.sides[0]),
        sideB: formationOf(clone.sides[1]),
      },
      handByCreature,
      actionQueue: yours.actionQueue ?? [],
      reactionSlot: yours.reactionSlot
        ? { definitionKey: yours.reactionSlot.card.definitionKey, paidCost: yours.reactionSlot.paidCost }
        : null,
      statuses: clone.sides.map((side) => side.creatures.map((unit) => ({ id: unit.id, name: unit.name, statuses: unit.statuses }))),
      resources: clone.sides.map((side) =>
        side.creatures.map((unit) => ({
          id: unit.id,
          name: unit.name,
          resources: unit.resources,
          def: unit.resourceDef?.id,
        })),
      ),
      resonance: clone.sides.map((side) => side.teamResonance),
      geneticChain: clone.sides.map((side) => side.geneticChain),
      eventChain: clone.log.slice(-12).map((row) => ({ type: row.type, eventId: row.eventId, parentEventId: row.parentEventId })),
      damageBreakdown: clone.log.filter((row) => row.damageBreakdown).slice(-6),
      rng: { seed: clone.seed, rngIndex: clone.rngIndex },
      winCondition: clone.status === "FINISHED" ? { winnerSide: clone.winnerSide } : null,
      cardTiming: yours.hand.map((card) => {
        const def = card.resolved ?? getCardDefinition(card.definitionKey);
        const profile = hydrateResolutionProfile(def ?? undefined, card.locus ?? def?.locusRole);
        return {
          cardManifestationId: card.instanceId,
          definitionKey: card.definitionKey,
          sourceCreatureId: card.sourceCreatureId ?? "none",
          grade: card.locus ?? null,
          timingClass: profile.timingClass,
          resolutionMode: profile.resolutionMode,
          stackSpeed: profile.stackSpeed,
          effectDomain: profile.effectDomain,
          responseWindows: profile.responseWindows,
          allowedResponses: profile.allowedResponses,
          stackable: profile.stackable,
          retargetPolicy: profile.retargetPolicy,
          effectGraph: def?.effects ?? [],
        };
      }),
      battleStack: clone.magicWar?.frames ?? [],
      priorityWindow: clone.magicWar?.window ?? null,
      mana: clone.sides.map((side) => ({ id: side.id, mana: side.mana ?? 0, max: side.maxMana ?? 10 })),
      surcharge: clone.magicWar?.frames.map((row) => row.surcharge) ?? [],
      preparedEffects: clone.sides.map((side) =>
        (side.preparedEffects ?? []).map((row) => ({
          name: row.visibility === "HIDDEN" ? "Armadilha preparada" : row.cardName,
          trigger: row.trigger,
          remainingRounds: row.remainingRounds,
        })),
      ),
      channels: clone.sides.map((side) => side.channels ?? []),
      virtualManifestations: clone.virtualManifestations ?? [],
    },
    arcaneReserve: reservePreview(yours),
    magicWar: clone.magicWar,
    magicWarRespondIds,
    middleWindow: usesLinearFormation({
      rulesVersion: clone.rulesVersion,
      creatures: clone.sides.flatMap((side) => side.creatures),
    })
      ? middleWindowOpen(clone.round)
        ? "OPEN"
        : "CLOSED"
      : undefined,
    energyCap: energyForRound(clone.round),
    genomeTimeline,
    linear: usesLinearFormation({
      rulesVersion: clone.rulesVersion,
      creatures: clone.sides.flatMap((side) => side.creatures),
    }),
    fusionEnabled: battleFusionEnabled(clone),
    matchRules: resolveMatchRules(clone),
    hints: casualHints(clone, yourSide, (card) => card.resolved ?? getCardDefinition(card.definitionKey) ?? null),
    pressure: currentPressure(clone),
    casualRecap: clone.status === "FINISHED" ? casualSummary(clone, yourSide) : undefined,
    replay: replayFoundation(clone),
    clock: clone.clock,
    reactionArmed: [Boolean(clone.sides[0].reactionSlot), Boolean(clone.sides[1].reactionSlot)],
    state: { ...clone, sides },
  };
}
