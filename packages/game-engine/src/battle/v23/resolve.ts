import { combatV23Config, getCardDefinition } from "@nexora/config";
import type { BattleAction, BattleSide, BattleState, CardInstance, PlayableCard } from "../types";
import { graphFromCard } from "./graph";
import { applyIntervention } from "./interventions";
import { applyArcaneReserve, ensureMana, markImpetusUsed, resetImpetusRound, trySpendMana } from "./mana";
import { bothPassed, emptyMagicWar, payStackMana, pushFrame, resolveLifo } from "./stack";
import { hydrateResolutionProfile } from "./timing";
import type { MagicWarDebug, StackFrame } from "./types";
import { matchFusionRecipe, fusionManifestation } from "./virtual";
import { autoPassSides, eligibleResponses, shouldOpenWindow } from "./windows";
import { activatePreparations, startChannel, tickChannels, tickPreparations } from "./zones";

function nextFrameId(state: BattleState): string {
  return `st-${state.eventSeq ?? 0}-${(state.magicWar?.frames.length ?? 0) + 1}`;
}

function hydrateSideCards(side: BattleSide) {
  const livingIds = side.creatures
    .filter((row) => row.hp > 0 && row.creatureId)
    .map((row) => row.creatureId) as string[];
  const onlyOwner = livingIds.length === 1 ? livingIds[0] : undefined;
  for (const card of [...side.hand, ...side.deck, ...side.discard]) {
    if (!card.resolved) {
      const catalog = getCardDefinition(card.definitionKey);
      if (catalog) {
        card.resolved = {
          ...catalog,
          effects: [...catalog.effects],
          typology: card.typology ?? catalog.typology,
        };
      }
    }
    if (!card.sourceCreatureId && onlyOwner) {
      card.sourceCreatureId = onlyOwner;
    }
  }
}

export function ensureV23(state: BattleState): BattleState {
  for (const side of state.sides) {
    ensureMana(side);
    hydrateSideCards(side);
    side.preparedEffects = side.preparedEffects ?? [];
    side.channels = side.channels ?? [];
    side.impetusUsed = side.impetusUsed ?? {};
    side.maxMana = side.maxMana ?? combatV23Config.maxMana;
  }
  state.magicWar = state.magicWar ?? emptyMagicWar();
  state.combatV23 = state.combatV23 ?? {
    impetusUsage: 0,
    reactionUsage: 0,
    counterUsage: 0,
    preparationActivation: 0,
    channelInterruption: 0,
    magicWarCount: 0,
    magicWarDepth: 0,
    actionsOpenedStack: 0,
    actionsResolvedDirect: 0,
    manaGained: 0,
    manaSpent: 0,
    manaStarvation: 0,
    fusionInterrupt: 0,
    stackCancel: 0,
  };
  return state;
}

export function convertReserveOnConfirm(state: BattleState): BattleState {
  const next = ensureV23(state);
  const actor = next.sides[next.activeSide];
  const { converted } = applyArcaneReserve(actor);
  if (converted > 0) {
    next.combatV23!.manaGained += converted;
    next.log.push({
      type: "ARCANE_RESERVE",
      actorSide: next.activeSide,
      value: converted,
      text: `Reserva Arcana · +${converted} Mana (${actor.mana}/${actor.maxMana ?? combatV23Config.maxMana}).`,
    });
  }
  return next;
}

function playable(card: CardInstance): PlayableCard | null {
  return card.resolved ?? null;
}

export function announceForStack(
  state: BattleState,
  card: CardInstance,
  definition: PlayableCard,
  targetId: string | undefined,
  resolveDef: (row: CardInstance) => PlayableCard | null = playable,
): BattleState {
  const next = ensureV23(state);
  const profile = hydrateResolutionProfile(definition, card.locus ?? definition.locusRole);
  const frame: StackFrame = {
    id: nextFrameId(next),
    side: next.activeSide,
    cardInstanceId: card.instanceId,
    cardKey: definition.key,
    cardName: definition.name,
    sourceCreatureId: card.sourceCreatureId,
    targetId,
    timingClass: profile.timingClass,
    stackSpeed: profile.stackSpeed,
    domain: profile.effectDomain,
    interventionOp: profile.interventionOp,
    graph: graphFromCard(definition, profile.effectDomain),
    manaPaid: 0,
    surcharge: 0,
    responseIndex: 0,
    cancelled: false,
    delayed: false,
    sealed: "NONE",
  };
  const window = profile.timingClass === "RITUAL" || profile.opensStack ? "DECLARE" : "PRE_IMPACT";
  const eligible = eligibleResponses(next, window, frame, resolveDef);
  if (!shouldOpenWindow(eligible)) {
    next.combatV23!.actionsResolvedDirect += 1;
    next.log.push({
      type: profile.opensStack || profile.timingClass === "RITUAL" ? "RITUAL_AUTO" : "RESOLVE_DIRECT",
      cardKey: definition.key,
      text: `${definition.name} ${profile.timingClass === "RITUAL" ? "é Ritual, mas" : ""} resolve direto · sem respostas válidas.`,
    });
    return next;
  }
  next.combatV23!.actionsOpenedStack += 1;
  next.combatV23!.magicWarCount += 1;
  const war = emptyMagicWar();
  war.open = true;
  war.window = window;
  war.frames = [frame];
  war.rootFrameId = frame.id;
  war.prioritySide = next.activeSide === 0 ? 1 : 0;
  war.autoPass = autoPassSides(eligible);
  war.passes = [...war.autoPass];
  next.magicWar = war;
  next.activeSide = war.prioritySide;
  next.log.push({
    type: "MAGIC_WAR_OPEN",
    cardKey: definition.key,
    text: `Guerra Mágica · ${definition.name} · ${profile.timingClass} · ${eligible.length} respostas.`,
  });
  if (bothPassed(war.passes)) {
    return collapseStack(next);
  }
  return next;
}

export function stackRespond(
  state: BattleState,
  action: Extract<BattleAction, { type: "STACK_RESPOND" }>,
  resolveDef: (row: CardInstance) => PlayableCard | null = playable,
): BattleState {
  const next = ensureV23(state);
  const war = next.magicWar;
  if (!war?.open || war.lock) {
    next.log.push({ type: "REJECT", text: "Nenhuma janela de Embate." });
    return next;
  }
  const side = next.sides[next.activeSide];
  const card = side.hand.find((row) => row.instanceId === action.cardInstanceId);
  const definition = card ? resolveDef(card) : null;
  if (!card || !definition) {
    next.log.push({ type: "REJECT", text: "Carta fora da mão." });
    return next;
  }
  const profile = hydrateResolutionProfile(definition, card.locus ?? definition.locusRole);
  if (!profile.canJoinStack) {
    next.log.push({ type: "REJECT", text: "Esta carta não entra na Guerra Mágica." });
    return next;
  }
  if (profile.timingClass === "IMPETUS") {
    const used = side.impetusUsed?.[card.sourceCreatureId ?? ""] ?? 0;
    if (used >= profile.impetusLimit) {
      next.log.push({ type: "REJECT", text: "Limite de Ímpeto neste round." });
      return next;
    }
  }
  const top = war.frames[war.frames.length - 1];
  const modifier = surchargeModifier(next, next.activeSide, profile.timingClass);
  const paid = payStackMana(side, profile.manaCost, war.frames, modifier);
  if (!paid.ok) {
    next.combatV23!.manaStarvation += 1;
    next.log.push({ type: "INSUFFICIENT_MANA", text: "INSUFFICIENT_MANA · carta permanece na mão." });
    return next;
  }
  next.combatV23!.manaSpent += paid.paid;
  const frame: StackFrame = {
    id: nextFrameId(next),
    side: next.activeSide,
    cardInstanceId: card.instanceId,
    cardKey: definition.key,
    cardName: definition.name,
    sourceCreatureId: card.sourceCreatureId,
    targetId: action.targetId ?? top?.id,
    timingClass: profile.timingClass,
    stackSpeed: profile.stackSpeed,
    domain: profile.effectDomain,
    interventionOp: action.op ?? profile.interventionOp,
    graph: graphFromCard(definition, profile.effectDomain),
    manaPaid: paid.paid,
    surcharge: paid.surcharge,
    responseIndex: war.frames.length,
    cancelled: false,
    delayed: false,
    sealed: "NONE",
  };
  const pushed = pushFrame(war.frames, frame);
  if (!("length" in pushed)) {
    side.mana = (side.mana ?? 0) + paid.paid;
    next.log.push({ type: "REJECT", text: "Pilha no teto." });
    return next;
  }
  side.hand = side.hand.filter((row) => row.instanceId !== card.instanceId);
  side.discard.push(card);
  if (profile.timingClass === "IMPETUS") {
    markImpetusUsed(side, card.sourceCreatureId);
    next.combatV23!.impetusUsage += 1;
  }
  if (profile.timingClass === "REACTION") next.combatV23!.reactionUsage += 1;
  if (profile.timingClass === "COUNTER") next.combatV23!.counterUsage += 1;
  war.frames = pushed;
  war.passes = [false, false];
  war.prioritySide = (next.activeSide === 0 ? 1 : 0) as 0 | 1;
  next.activeSide = war.prioritySide;
  next.magicWar = war;
  next.log.push({
    type: "STACK_RESPOND",
    cardKey: definition.key,
    text: `${definition.name} entra na pilha · ${profile.timingClass} · ${paid.paid} Mana (base ${profile.manaCost}+${paid.surcharge}).`,
  });
  return next;
}

export function passPriority(state: BattleState): BattleState {
  const next = ensureV23(state);
  const war = next.magicWar;
  if (!war?.open) return next;
  war.passes[next.activeSide] = true;
  next.log.push({ type: "PASS_PRIORITY", actorSide: next.activeSide, text: `${next.sides[next.activeSide].displayName} passa o Embate.` });
  if (bothPassed(war.passes)) {
    return collapseStack(next);
  }
  war.prioritySide = next.activeSide === 0 ? 1 : 0;
  next.activeSide = war.prioritySide;
  next.magicWar = war;
  return next;
}

export function collapseStack(state: BattleState): BattleState {
  const next = ensureV23(state);
  const war = next.magicWar;
  if (!war) return next;
  war.lock = true;
  const order = resolveLifo(war.frames);
  const debug: MagicWarDebug = {
    rootFrame: war.rootFrameId,
    responses: war.frames.slice(1).map((row) => row.cardName),
    passes: 2,
    surcharge: war.frames.map((row) => row.surcharge),
    manaBefore: [next.sides[0].mana ?? 0, next.sides[1].mana ?? 0],
    manaAfter: [next.sides[0].mana ?? 0, next.sides[1].mana ?? 0],
    resolutionOrder: order.map((row) => row.cardName),
    cancelledNodes: [],
    suppressedNodes: [],
    redirects: [],
  };
  let frames = war.frames.map((row) => ({ ...row }));
  for (const frame of order) {
    if (frame.interventionOp && frame.responseIndex > 0) {
      const targetId = frame.targetId ?? war.rootFrameId;
      frames = frames.map((row) => {
        if (row.id !== targetId && row.id !== war.rootFrameId) return row;
        if (row.id !== targetId && targetId !== row.id) {
          const hit = frames.find((item) => item.id === targetId) ?? row;
          const applied = applyIntervention(frame.interventionOp!, hit, {
            newTargetId: frame.sourceCreatureId,
          });
          if (applied.cancelled) next.combatV23!.stackCancel += 1;
          if (applied.redirectedTo) debug.redirects.push(`${hit.cardName}→${applied.redirectedTo}`);
          debug.cancelledNodes.push(...applied.graph.nodes.filter((node) => node.cancelled).map((node) => node.id));
          debug.suppressedNodes.push(...applied.graph.nodes.filter((node) => node.suppressed).map((node) => node.id));
          return row.id === hit.id ? applied : row;
        }
        const applied = applyIntervention(frame.interventionOp!, row, { newTargetId: frame.sourceCreatureId });
        if (applied.cancelled) next.combatV23!.stackCancel += 1;
        return applied;
      });
    }
    next.log.push({
      type: "STACK_RESOLVE",
      cardKey: frame.cardKey,
      text: `Resolve ↓ ${frame.cardName} · ${frame.timingClass}${frame.cancelled ? " · cancelado" : ""}`,
    });
  }
  next.combatV23!.magicWarDepth += war.frames.length;
  next.magicWarDebug = debug;
  const remaining = war.remainingQueue;
  next.magicWar = emptyMagicWar();
  next.activeSide = (war.frames[0]?.side ?? next.activeSide) as 0 | 1;
  if (remaining.length > 0) {
    next.sides[next.activeSide].actionQueue = remaining.map((row, index) => ({
      id: `resume-${index}`,
      cardInstanceId: row.cardInstanceId,
      card: next.sides[next.activeSide].hand.find((card) => card.instanceId === row.cardInstanceId) ?? {
        instanceId: row.cardInstanceId,
        definitionKey: row.cardInstanceId,
      },
      targetId: row.targetId,
      reservedEnergy: 0,
      retargetPolicy: "NONE" as const,
    }));
    return next;
  }
  return next;
}

function surchargeModifier(state: BattleState, side: 0 | 1, timing: string): number {
  const units = state.sides[side].creatures.filter((row) => row.hp > 0);
  const speed = units.reduce((sum, row) => sum + (row.spd ?? 0), 0);
  const combo = state.magicWar?.frames.filter((row) => row.side === side).length ?? 0;
  const speedCut = timing === "IMPETUS" ? -Math.floor(speed / 220) : 0;
  const comboCut = Math.min(2, combo);
  return speedCut - comboCut;
}

export function beginChannelFromCard(state: BattleState, card: CardInstance, definition: PlayableCard): BattleState {
  const next = ensureV23(state);
  const side = next.sides[next.activeSide];
  const source = card.sourceCreatureId ?? side.creatures[0]?.creatureId ?? side.creatures[0]?.id ?? "unknown";
  startChannel(side, source, definition);
  next.log.push({ type: "CHANNEL_START", cardKey: definition.key, text: `${definition.name} inicia canalização 1/${definition.cost >= 3 ? 2 : 2}.` });
  return next;
}

export function tickV23Turn(state: BattleState, incoming: import("../types").BattleSide): BattleState {
  const next = ensureV23(state);
  resetImpetusRound(incoming);
  tickPreparations(incoming);
  const { completed, interrupted } = tickChannels(next, incoming);
  next.combatV23!.channelInterruption += interrupted.length;
  for (const row of interrupted) {
    next.log.push({ type: "CHANNEL_INTERRUPT", text: `${row.cardName} interrompida.` });
  }
  for (const row of completed) {
    next.log.push({ type: "CHANNEL_COMPLETE", text: `${row.cardName} completa a canalização.` });
  }
  return next;
}

export function triggerPreparations(state: BattleState, sideIndex: 0 | 1, trigger: string): BattleState {
  const next = ensureV23(state);
  const fired = activatePreparations(next.sides[sideIndex], trigger);
  next.combatV23!.preparationActivation += fired.length;
  for (const row of fired) {
    next.log.push({ type: "PREPARATION_FIRE", text: `${row.cardName} dispara (${row.trigger}).` });
  }
  return next;
}

export function openFusionWindow(state: BattleState, tokens: string[]): BattleState {
  const next = ensureV23(state);
  const recipe = matchFusionRecipe(tokens);
  if (!recipe) return next;
  const virtual = fusionManifestation(recipe, tokens);
  next.virtualManifestations = [...(next.virtualManifestations ?? []), virtual];
  const frame: StackFrame = {
    id: nextFrameId(next),
    side: next.activeSide,
    cardKey: recipe.key,
    cardName: recipe.namePt,
    timingClass: "RITUAL",
    stackSpeed: "NORMAL",
    domain: "GENETIC",
    graph: virtual.graph,
    manaPaid: 0,
    surcharge: 0,
    responseIndex: 0,
    virtual: "FUSION",
    recipeId: recipe.key,
    cancelled: false,
    delayed: false,
    sealed: "NONE",
  };
  const eligible = eligibleResponses(next, "FUSION", frame);
  next.log.push({
    type: "FUSION_WINDOW",
    text: `EMBATE DE FUSÃO · ${recipe.namePt} · ${virtual.stackBehavior}${eligible.length ? "" : " · sem respostas, resolve"}.`,
  });
  if (!shouldOpenWindow(eligible)) {
    next.combatV23!.actionsResolvedDirect += 1;
    return next;
  }
  next.combatV23!.fusionInterrupt += 1;
  const war = emptyMagicWar();
  war.open = true;
  war.window = "FUSION";
  war.frames = [frame];
  war.rootFrameId = frame.id;
  war.prioritySide = next.activeSide === 0 ? 1 : 0;
  war.autoPass = autoPassSides(eligible);
  war.passes = [...war.autoPass];
  next.magicWar = war;
  if (bothPassed(war.passes)) return collapseStack(next);
  return next;
}

export function isMagicWarOpen(state: BattleState): boolean {
  return Boolean(state.magicWar?.open);
}
