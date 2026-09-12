import { combatConfig, combatMatrixConfig, energyForRound, fusionFamilies, geneticPowerConfig, getCardDefinition } from "@nexora/config";
import { evaluateFusionAvailability } from "../powers/fusion";
import { resonanceForPlay, resonanceForPlayCapped } from "../powers/resonance";
import { calculateElementMultiplier } from "../elements/element-multiplier";
import { createSeededRandom, type RandomService } from "../random/random-service";
import { livingCreatures } from "./create";
import { fusionOf } from "./fusion-state";
import { usesLinearFormation } from "./formation";
import { collapseLinearFormation } from "./matrix/formation-linear";
import { evaluateMatrixFusion, livingTypologies } from "./matrix/fusion-v2";
import { recycleDiscard } from "./matrix/recycle";
import { listFormationTargets } from "./targeting-resolve";
import { combatLineOf, livingOnLine, swapSlots } from "./formation-line";
import { guardRedirect } from "./targeting-resolve";
import { canonicalPlayTypology, combatMechanicTags, targetingTags } from "./matrix/combat-tags";
import { playsOfTypology } from "./matrix/usage";
import { applyStatusReactions, clauseReady, consumeResource, gainResource } from "../genetic-combat/runtime";
import { applyResourceEvent, decayPersonalResources, requiredResource, spendPersonalResource } from "../genetic-combat/resource-runtime";
import {
  announcePressure,
  appendReplay,
  applyStructuredStatus,
  armReaction,
  availableEnergy,
  canArmReaction,
  cancelQueued,
  chooseRetarget,
  collapseFormation,
  effectMetaOf,
  evaluateTimeout,
  expireReaction,
  gainTeamResonance,
  interceptRedirect,
  isReactionCard,
  nextEventId,
  queueCard,
  recordChainLink,
  removeQueued,
  reorderQueue,
  resetAutoTurns,
  resetTurnChain,
  resolveMatchRules,
  retargetQueued,
  scaleSustain,
  spendResonance,
  startTurnClock,
  supremeReady,
} from "./v15";
import { applyPositionEffect } from "./v15/formation";
import type { BattleAction, BattleFusionState, BattleSide, BattleState, CardInstance, Combatant, PlayableCard } from "./types";

function isV2(state: BattleState) {
  return (state.rulesVersion ?? "V1") === "V2";
}

function usesLinear(state: BattleState) {
  return usesLinearFormation({
    rulesVersion: state.rulesVersion,
    creatures: state.sides.flatMap((side) => side.creatures),
  });
}

/** Lab V2, genetic flag, or PvE already presented as linear (wild com slots F/M/B). Casual PvP fica de fora. */
export function battleFusionEnabled(state: BattleState) {
  if (geneticPowerConfig.enabled || isV2(state)) {
    return true;
  }
  return state.type === "PVE" && usesLinear(state);
}

function playDefinition(instance: CardInstance): PlayableCard | ReturnType<typeof getCardDefinition> {
  return instance.resolved ?? getCardDefinition(instance.definitionKey);
}

function syncActiveFusion(state: BattleState) {
  state.fusion = fusionOf(state.sides[state.activeSide]);
}

function playTypologyTags(instance: CardInstance, definition: { tags: readonly string[]; typology?: string } | null): string[] {
  return combatMechanicTags({
    typology: instance.typology ?? definition?.typology,
    tags: definition?.tags,
  });
}

function sourceCreatureAlive(side: BattleSide, card: CardInstance): boolean {
  if (!card.sourceCreatureId) {
    return true;
  }
  const owner = side.creatures.find((row) => row.creatureId === card.sourceCreatureId);
  return !owner || owner.hp > 0;
}

function purgeDeadCreatureCards(side: BattleSide, creatureId: string, state: BattleState) {
  const take = (rows: CardInstance[]) => {
    const keep: CardInstance[] = [];
    for (const card of rows) {
      if (card.sourceCreatureId === creatureId) {
        side.exile.push(card);
      } else {
        keep.push(card);
      }
    }
    return keep;
  };
  const before = side.hand.length + side.deck.length;
  side.hand = take(side.hand);
  side.deck = take(side.deck);
  if (side.hand.length + side.deck.length < before) {
    state.log.push({ type: "CARDS_EXILED", text: "Cartas da criatura caída saem da luta." });
  }
}

function rngFrom(state: BattleState): RandomService {
  const rng = createSeededRandom(state.seed);
  for (let i = 0; i < state.rngIndex; i += 1) {
    rng.next();
  }
  return rng;
}

function cloneState(state: BattleState): BattleState {
  return structuredClone(state);
}

function actorOf(side: BattleSide, instance?: { sourceCreatureId?: string }): Combatant | undefined {
  if (instance?.sourceCreatureId) {
    const owner = side.creatures.find((row) => row.creatureId === instance.sourceCreatureId && row.hp > 0);
    if (owner) return owner;
  }
  return firstLiving(side);
}

function firstLiving(side: BattleSide, preferredId?: string): Combatant | undefined {
  if (preferredId) {
    const preferred = side.creatures.find((row) => row.id === preferredId && row.hp > 0);
    if (preferred) {
      return preferred;
    }
  }
  return livingCreatures(side)[0];
}

function drawCards(side: BattleSide, count: number, rng: RandomService, state?: BattleState) {
  let drawn = 0;
  let guard = 0;
  while (drawn < count && guard < 48) {
    guard += 1;
    if (side.deck.length === 0 && side.discard.length > 0) {
      const live: typeof side.discard = [];
      for (const card of side.discard) {
        if (sourceCreatureAlive(side, card)) live.push(card);
        else side.exile.push(card);
      }
      side.discard = live;
    }
    const recycled = recycleDiscard(side.deck, side.discard, rng);
    side.deck = recycled.deck;
    side.discard = recycled.discard;
    if (recycled.recycled && state) {
      state.log.push({ type: "DECK_RECYCLED", text: "O descarte foi reciclado." });
    }
    const card = side.deck.shift();
    if (!card) {
      break;
    }
    if (!sourceCreatureAlive(side, card)) {
      side.exile.push(card);
      continue;
    }
    if (side.hand.length >= combatConfig.maxHand) {
      side.discard.push(card);
    } else {
      side.hand.push(card);
    }
    drawn += 1;
  }
}

function applyDamage(target: Combatant, amount: number, attacker?: Combatant, allies: Combatant[] = [], tags: readonly string[] = []) {
  const redirected = interceptRedirect(guardRedirect(target, allies, tags), allies, tags);
  if (redirected.id !== target.id) {
    target = redirected;
  }
  let remaining = amount;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp = Math.max(0, target.hp - remaining);
  if (amount > 0 && attacker) {
    const molten = target.statuses.some((row) => row.key === "MOLTEN");
    if (molten || (target.tags.includes("TANK") && target.tags.includes("BURN"))) {
      applyStatus(attacker, "BURN", 1);
    }
  }
}

function applyStatus(target: Combatant, key: string, duration: number, reactions?: { applied: Set<string>; depth: { value: number } }) {
  const result = applyStructuredStatus(target, key, duration);
  if (result.extra) {
    reactions?.applied.add(result.extra);
  }
  if (reactions) {
    reactions.applied.add(key);
    applyStatusReactions(target, reactions.applied, reactions.depth);
  }
}

function tickStatuses(side: BattleSide, state: BattleState) {
  for (const creature of side.creatures) {
    if (creature.hp <= 0) {
      continue;
    }
    for (const status of creature.statuses) {
      if (status.key === "BURN") {
        applyDamage(creature, combatConfig.burnDamagePerStack * status.stacks);
        applyResourceEvent(state, { trigger: "RECEIVE_DAMAGE", target: creature, damage: combatConfig.burnDamagePerStack * status.stacks });
        state.log.push({ type: "STATUS", targetId: creature.id, value: status.stacks, text: `${creature.name} queima.` });
      }
      if (status.key === "POISON") {
        applyDamage(creature, combatConfig.poisonDamagePerStack * status.stacks);
        applyResourceEvent(state, { trigger: "RECEIVE_DAMAGE", target: creature, damage: combatConfig.poisonDamagePerStack * status.stacks });
        state.log.push({ type: "STATUS", targetId: creature.id, text: `${creature.name} sofre veneno.` });
      }
      status.remainingRounds -= 1;
    }
    creature.statuses = creature.statuses.filter((row) => row.remainingRounds > 0);
  }
}

function checkVictory(state: BattleState) {
  const aAlive = livingCreatures(state.sides[0]).length > 0;
  const bAlive = livingCreatures(state.sides[1]).length > 0;
  if (!aAlive || !bAlive) {
    state.status = "FINISHED";
    state.winnerSide = aAlive ? 0 : 1;
    state.log.push({ type: "VICTORY", text: aAlive ? `${state.sides[0].displayName} venceu.` : `${state.sides[1].displayName} venceu.` });
  }
}

export function listLegalTargets(
  state: BattleState,
  sideIndex: 0 | 1,
  targetType: string,
  tags: readonly string[] = [],
): Combatant[] {
  const selfSide = state.sides[sideIndex];
  const enemySide = state.sides[sideIndex === 0 ? 1 : 0];
  return listFormationTargets({
    allies: selfSide.creatures,
    enemies: enemySide.creatures,
    targetType,
    tags: targetingTags(tags),
  });
}

export function resolveValidTargets(
  state: BattleState,
  sideIndex: 0 | 1,
  targetType: string,
  tags: readonly string[] = [],
  targetId?: string,
): Combatant[] {
  const selfSide = state.sides[sideIndex];
  const enemySide = state.sides[sideIndex === 0 ? 1 : 0];
  return listFormationTargets({
    allies: selfSide.creatures,
    enemies: enemySide.creatures,
    targetType,
    tags: targetingTags(tags),
    preferredId: targetId,
  });
}

function resolveTargets(state: BattleState, sideIndex: 0 | 1, targetType: string, targetId?: string, tags: readonly string[] = []): Combatant[] {
  return resolveValidTargets(state, sideIndex, targetType, tags, targetId);
}

function syncActiveTypologies(side: BattleSide) {
  side.activeTypologies = side.creatures
    .filter((row) => row.hp > 0)
    .map((row) => row.typology)
    .filter((row): row is string => Boolean(row));
}

function collapseIfNeeded(state: BattleState, side: BattleSide) {
  if (!resolveMatchRules(state).formationCollapse) {
    return;
  }
  const result = usesLinear(state) ? collapseLinearFormation(side.creatures) : collapseFormation(side.creatures);
  if (!result.collapsed) {
    return;
  }
  side.creatures = result.next;
  state.log.push({ type: "FORMATION_COLLAPSED", text: `Formação colapsou · ${result.promotions.join(", ")}` });
}

function refreshSupreme(state: BattleState, side: BattleSide) {
  const cards = [...side.hand, ...side.deck, ...side.discard];
  for (const unit of side.creatures) {
    const mine = cards.filter((card) => !card.sourceCreatureId || card.sourceCreatureId === unit.creatureId);
    const ready = supremeReady(unit, mine);
    if (ready && !unit.supremeReady) {
      state.log.push({
        type: "SUPREME_READY",
        targetId: unit.id,
        text: `${unit.name} · ${(unit.resourceDef?.displayName ?? "RECURSO").toUpperCase()} ${unit.resources?.[unit.resourceDef?.id ?? ""] ?? 0}/${unit.resourceDef?.maxStacks ?? 0} · SUPREME READY`,
      });
    }
    unit.supremeReady = ready;
  }
}

export function reduceBattle(state: BattleState, action: BattleAction): BattleState {
  const next = cloneState(state);
  if (next.status !== "ACTIVE") {
    return next;
  }

  const rng = rngFrom(next);
  const side = next.sides[next.activeSide];
  const rules = resolveMatchRules(next);
  if (action.type !== "TIMEOUT") {
    appendReplay(next, action);
  }

  if (action.type === "FLEE") {
    if (next.type !== "PVE") {
      next.log.push({ type: "REJECT", text: "PvP não permite fuga. Use desistência." });
      return next;
    }
    next.status = "FLED";
    next.winnerSide = 1;
    next.log.push({ type: "FLEE", text: `${side.displayName} fugiu.` });
    return next;
  }

  if (action.type === "CONCEDE") {
    if (next.round < rules.surrenderMinRound) {
      next.log.push({ type: "REJECT", text: `Desistência só a partir do round ${rules.surrenderMinRound}.` });
      return next;
    }
    const loser = action.side === 1 ? 1 : 0;
    next.status = "FINISHED";
    next.winnerSide = loser === 0 ? 1 : 0;
    next.log.push({
      type: "CONCEDE",
      actorSide: loser,
      text: `${next.sides[loser].displayName} desistiu.`,
    });
    return next;
  }

  if (action.type === "TIMEOUT") {
    const decision = evaluateTimeout(next);
    if (decision === "WAIT") {
      return next;
    }
    if (decision === "AUTO_SURRENDER") {
      next.log.push({ type: "AFK", text: `${side.displayName} foi considerado AFK.` });
      return reduceBattle(next, { type: "CONCEDE", side: next.activeSide });
    }
    if (decision === "AFK_WARNING") {
      next.log.push({ type: "AFK_WARNING", text: `${side.displayName} recebeu aviso de AFK.` });
      return reduceBattle(next, { type: "END_TURN" });
    }
    if (decision === "AUTO_CONFIRM") {
      next.log.push({ type: "AUTO_CONFIRM", text: "Timer esgotado · fila válida confirmada." });
      return reduceBattle(next, { type: "CONFIRM_TURN" });
    }
    next.log.push({ type: "AUTO_PASS", text: "Timer esgotado · passe automático." });
    return reduceBattle(next, { type: "END_TURN" });
  }

  if (action.type === "QUEUE_CARD") {
    const cardIndex = side.hand.findIndex((row) => row.instanceId === action.cardInstanceId);
    if (cardIndex < 0) {
      next.log.push({ type: "REJECT", text: "Carta fora da mão." });
      return next;
    }
    const instance = side.hand[cardIndex]!;
    const definition = playDefinition(instance);
    if (!definition || !sourceCreatureAlive(side, instance)) {
      next.log.push({ type: "REJECT", text: "Carta inválida para a fila." });
      return next;
    }
    if (availableEnergy(side) < definition.cost) {
      next.log.push({ type: "REJECT", text: "Energia insuficiente para reservar." });
      return next;
    }
    side.hand.splice(cardIndex, 1);
    const queued = queueCard(side, instance, definition.cost, action.targetId, effectMetaOf(definition).retargetPolicy);
    next.log.push({
      type: "ACTION_QUEUED",
      cardKey: definition.key,
      text: `Fila ${side.actionQueue?.length ?? 1} · ${actorOf(side, instance)?.name ?? side.displayName} → ${definition.name}`,
    });
    void queued;
    return next;
  }

  if (action.type === "UNQUEUE_CARD") {
    const removed = removeQueued(side, action.queueId);
    if (!removed) {
      next.log.push({ type: "REJECT", text: "Ação não está na fila." });
      return next;
    }
    next.log.push({ type: "ACTION_CANCELLED", text: "Ação removida. Energia reservada liberada." });
    return next;
  }

  if (action.type === "REORDER_QUEUE") {
    if (!reorderQueue(side, action.order)) {
      next.log.push({ type: "REJECT", text: "Ordem da fila inválida." });
    }
    return next;
  }

  if (action.type === "RETARGET_QUEUE") {
    if (!retargetQueued(side, action.queueId, action.targetId)) {
      next.log.push({ type: "REJECT", text: "Não foi possível trocar o alvo." });
    }
    return next;
  }

  if (action.type === "ARM_REACTION") {
    const cardIndex = side.hand.findIndex((row) => row.instanceId === action.cardInstanceId);
    const instance = cardIndex >= 0 ? side.hand[cardIndex] : undefined;
    const definition = instance ? playDefinition(instance) : null;
    if (!instance || !definition || !canArmReaction(definition) || side.energy < definition.cost) {
      next.log.push({ type: "REJECT", text: "Não foi possível armar a reação." });
      return next;
    }
    if (side.reactionSlot) {
      next.log.push({ type: "REJECT", text: "Reaction Slot já ocupado." });
      return next;
    }
    side.energy -= definition.cost;
    side.hand.splice(cardIndex, 1);
    armReaction(next, side, instance, definition.cost);
    return next;
  }

  if (action.type === "RESONANCE_ACTION") {
    if (!spendResonance(side, next)) {
      next.log.push({ type: "REJECT", text: "Resonance insuficiente." });
      return next;
    }
    if (action.action === "RESONANCE_SHIFT" && action.creatureId && action.destSlot) {
      const moved = applyPositionEffect(side.creatures, action.creatureId, "SWAP");
      const unit = side.creatures.find((row) => row.id === action.creatureId || row.creatureId === action.creatureId);
      if (unit && (action.destSlot === "FRONT" || action.destSlot === "MIDDLE" || action.destSlot === "BACK" || action.destSlot === "BACK_LEFT" || action.destSlot === "BACK_RIGHT")) {
        const occupant = side.creatures.find((row) => row.slot === action.destSlot && row.hp > 0);
        if (occupant) {
          const prev = unit.slot;
          unit.slot = occupant.slot;
          occupant.slot = prev;
        } else {
          unit.slot = action.destSlot;
        }
        next.log.push({ type: "FORMATION", text: `RESONANCE SHIFT · ${unit.name}` });
      }
      void moved;
    } else if (action.action === "GENETIC_DRAW") {
      drawCards(side, 1, rng, next);
      if (action.discardInstanceId) {
        const discardAt = side.hand.findIndex((row) => row.instanceId === action.discardInstanceId);
        if (discardAt >= 0) {
          side.discard.push(side.hand.splice(discardAt, 1)[0]!);
        }
      } else if (side.hand.length > 0) {
        side.discard.push(side.hand.pop()!);
      }
      next.log.push({ type: "GENETIC_DRAW", text: "GENETIC DRAW · compra 1 e descarta 1." });
    } else {
      side.teamResonance = side.teamResonance ?? { value: 0, max: rules.maxResonance, ready: false, amplifyPending: false, gainedThisBattle: 0 };
      side.teamResonance.amplifyPending = true;
      next.log.push({ type: "RESONANCE_AMPLIFY", text: "RESONANCE AMPLIFY · próxima reação genética avançada." });
    }
    return next;
  }

  if (action.type === "CONFIRM_TURN") {
    const actor = next.sides[next.activeSide];
    const queued = [...(actor.actionQueue ?? [])];
    actor.actionQueue = [];
    for (const item of queued) {
      const live = next.sides[next.activeSide];
      const definition = playDefinition(item.card);
      const tags = definition?.tags ?? [];
      const legal = definition ? listLegalTargets(next, next.activeSide, definition.targetType, tags) : [];
      let targetId = item.targetId;
      if (targetId && !legal.some((row) => row.id === targetId)) {
        const chosen = chooseRetarget(item.retargetPolicy, legal, targetId, (id) => next.sides.flatMap((row) => row.creatures).find((unit) => unit.id === id)?.slot);
        if (!chosen) {
          cancelQueued(live, item, "INVALID_AFTER_BOARD_CHANGE");
          next.log.push({
            type: "ACTION_CANCELLED",
            text: `${definition?.name ?? "Ação"} cancelada. Energia reservada liberada. Carta devolvida.`,
          });
          continue;
        }
        targetId = chosen.id;
        next.log.push({ type: "RETARGET", text: `Retarget ${item.retargetPolicy} → ${chosen.name}.` });
      }
      if (!sourceCreatureAlive(live, item.card) || !definition) {
        cancelQueued(live, item, "SOURCE_DEAD");
        next.log.push({ type: "ACTION_CANCELLED", text: "Ação inválida após mudança no campo. Energia e carta devolvidas." });
        continue;
      }
      live.hand.push(item.card);
      live.reservedEnergy = Math.max(0, (live.reservedEnergy ?? 0) - item.reservedEnergy);
      const played = reduceBattle(next, { type: "PLAY_CARD", cardInstanceId: item.card.instanceId, targetId });
      Object.assign(next, played);
    }
    next.sides[next.activeSide].reservedEnergy = 0;
    next.sides[next.activeSide].actionQueue = [];
    return reduceBattle(next, { type: "END_TURN" });
  }

  if (action.type === "END_TURN") {
    resetAutoTurns(next, next.activeSide);
    resetTurnChain(side);
    if (side.actionQueue?.length) {
      for (const item of [...side.actionQueue]) {
        cancelQueued(side, item, "END_TURN");
      }
    }
    decayPersonalResources(next, side, "END_OF_TURN");
    const enemyIndex = next.activeSide === 0 ? 1 : 0;
    next.activeSide = enemyIndex as 0 | 1;
    if (next.activeSide === 0) {
      next.round += 1;
      if (isV2(next)) {
        const open = next.round % 2 === 0;
        next.log.push({
          type: "MIDDLE_WINDOW_CHANGED",
          text: open ? "MIDDLE WINDOW: OPEN" : "MIDDLE WINDOW: CLOSED",
        });
        if (next.round === combatMatrixConfig.fusionUnlockRound && !next.fusion?.windowAnnounced) {
          next.log.push({ type: "GENETIC_RESONANCE_UNLOCKED", text: "GENETIC RESONANCE UNLOCKED" });
        }
      }
    }
    const incoming = next.sides[next.activeSide];
    expireReaction(next, incoming);
    decayPersonalResources(next, incoming, "START_OF_TURN");
    tickStatuses(incoming, next);
    announcePressure(next);
    startTurnClock(next, next.clock?.turnStartedAt ?? 0);
    for (const creature of incoming.creatures) {
      if (creature.hp <= 0 && creature.creatureId) {
        purgeDeadCreatureCards(incoming, creature.creatureId, next);
      }
    }
    incoming.energy = energyForRound(next.round);
    drawCards(incoming, combatConfig.drawPerRound, rng, next);
    next.rngIndex += 8;
    next.log.push({ type: "END_TURN", actorSide: next.activeSide === 0 ? 1 : 0, text: "Turno encerrado." });
    if (battleFusionEnabled(next)) {
      refreshFusion(next, 0);
      refreshFusion(next, 1);
      syncActiveFusion(next);
    }
    refreshSupreme(next, incoming);
    checkVictory(next);
    return next;
  }

  if (action.type === "CAPTURE") {
    next.log.push({ type: "CAPTURE_INTENT", text: `Tentativa de captura com ${action.orbKey}.` });
    return next;
  }

  if (action.type === "SELECT_FUSION") {
    const pool = fusionOf(side).pool;
    const candidate = pool.find((row) => row.familyKey === action.familyKey && row.ready && !row.triple);
    if (!candidate) {
      next.log.push({ type: "REJECT", text: "Fusão indisponível." });
      return next;
    }
    const fusion = fusionOf(side);
    fusion.awakened = candidate.familyKey;
    syncActiveFusion(next);
    next.log.push({ type: "FUSION_AVAILABLE", text: `SINERGIA DESPERTADA · ${candidate.namePt}` });
    return next;
  }

  if (action.type === "PLAY_FUSION" || action.type === "PLAY_CONVERGENCE") {
    return playSpecialCard(next, action, rng);
  }

  if (action.type === "SET_FORMATION") {
    next.log.push({ type: "REJECT", text: "Formação só muda antes da batalha ativa." });
    return next;
  }

  if (action.type !== "PLAY_CARD") {
    return next;
  }

  const cardIndex = side.hand.findIndex((row) => row.instanceId === action.cardInstanceId);
  if (cardIndex < 0) {
    next.log.push({ type: "REJECT", text: "Carta fora da mão." });
    return next;
  }
  const instance = side.hand[cardIndex]!;
  const definition = playDefinition(instance);
  if (!definition) {
    next.log.push({ type: "REJECT", text: "Carta desconhecida." });
    return next;
  }
  if (!sourceCreatureAlive(side, instance)) {
    next.log.push({ type: "REJECT", text: "A criatura desta carta já caiu." });
    return next;
  }
  if (side.energy < definition.cost) {
    next.log.push({ type: "REJECT", text: "Energia insuficiente." });
    return next;
  }

  const stunned = firstLiving(side)?.statuses.some((row) => row.key === "STUN");
  if (stunned && definition.type === "ATTACK") {
    next.log.push({ type: "REJECT", text: "Atordoado: ataques bloqueados neste turno." });
    return next;
  }

  if (action.targetId && definition.targetType !== "ALL_ENEMIES" && definition.targetType !== "ALL_ALLIES") {
    const legal = listLegalTargets(next, next.activeSide, definition.targetType, definition.tags);
    if (!legal.some((row) => row.id === action.targetId)) {
      const exposed = legal[0];
      next.log.push({
        type: "REJECT",
        text: exposed
          ? `INVALID_TARGET · FRONTLINE_BLOCKING · derrote ${exposed.name} ou use uma carta que ignore a formação.`
          : "INVALID_TARGET · alvo ilegal.",
      });
      return next;
    }
  }

  const actor = actorOf(side, instance);
  const preTargets = resolveTargets(next, next.activeSide, definition.targetType, action.targetId, definition.tags);
  const clauses = definition.ability?.clauses ?? definition.effects;
  const consume = clauses.find((effect) => effect.op === "CONSUME_RESOURCE");
  const gate = actor?.resourceDef ? requiredResource(actor.resourceDef, instance.locus ?? definition.locusRole) : null;
  const have = actor && consume?.resource ? (actor.resources?.[consume.resource] ?? 0) : actor?.resourceDef ? (actor.resources?.[actor.resourceDef.id] ?? 0) : 0;
  const need = gate?.need ?? consume?.condition?.resourceAtLeast ?? consume?.value ?? 0;
  if ((gate || consume) && (!actor || have < need || (consume && !clauseReady(consume, actor, preTargets[0])))) {
    next.log.push({ type: "REJECT", text: `${definition.name} precisa de recurso.` });
    return next;
  }

  side.energy -= definition.cost;
  side.hand.splice(cardIndex, 1);
  side.discard.push(instance);
  next.log.push({
    type: "CARD_PLAYED",
    actorSide: next.activeSide,
    cardKey: definition.key,
    text: `${actor?.name ?? side.displayName} usa ${definition.name}.`,
  });
  if (definition.type === "ULTIMATE" || definition.locusRole === "ULTIMATE") {
    next.log.push({ type: "ULTIMATE_TRIGGERED", actorSide: next.activeSide, cardKey: definition.key, text: `${definition.name} manifesta o potencial máximo.` });
  }
  if (definition.type === "SYNERGY" || definition.locusRole === "SYNERGY") {
    next.log.push({ type: "SYNERGY_TRIGGERED", actorSide: next.activeSide, cardKey: definition.key, text: `Sinergia — ${definition.name}.` });
  }

  const targets = preTargets;
  const reactions = { applied: new Set<string>(), depth: { value: 0 } };
  let struck = false;
  if (actor) {
    applyResourceEvent(next, { trigger: "PLAY_CARD", actor, cardGrade: instance.locus });
  }
  if (actor?.resourceDef && gate) {
    if (!spendPersonalResource(next, actor, instance.locus ?? definition.locusRole)) {
      next.log.push({ type: "REJECT", text: `${definition.name} precisa de recurso.` });
      return next;
    }
  } else if (consume && actor && consume.resource) {
    consumeResource(actor, consume.resource, consume.value ?? 1);
    next.log.push({ type: "RESOURCE_SPEND", targetId: actor.id, value: consume.value, text: `−${consume.value ?? 1} ${consume.resource}` });
  }
  for (const effect of clauses) {
    if (effect.op === "CONSUME_RESOURCE") {
      continue;
    }
    if (!clauseReady(effect, actor, targets[0])) {
      continue;
    }
    if (effect.op === "GAIN_RESOURCE" && actor && effect.resource) {
      const allowed = actor.resourceDef?.id;
      if (allowed && effect.resource !== allowed) {
        next.log.push({
          type: "RESOURCE_BLOCKED",
          ownerCreatureId: actor.creatureId,
          resourceId: effect.resource,
          sourceCreatureId: actor.creatureId,
          reason: "IDENTITY_MISMATCH",
          text: `${actor.name} não pode ganhar ${effect.resource} — identidade usa ${allowed}.`,
        });
        continue;
      }
      const before = actor.resources?.[effect.resource] ?? 0;
      gainResource(actor, effect.resource, effect.value ?? 1);
      const after = actor.resources?.[effect.resource] ?? 0;
      if (after > before) {
        next.log.push({
          type: "RESOURCE_GAIN",
          targetId: actor.id,
          ownerCreatureId: actor.creatureId,
          resourceId: effect.resource,
          amount: after - before,
          sourceCardId: instance.instanceId,
          sourceCreatureId: actor.creatureId,
          reason: "CARD_GAIN_RESOURCE",
          value: after - before,
          text: `${actor.name} ganha +${after - before} ${effect.resource}.`,
        });
      }
      continue;
    }
    if (effect.op === "DRAW") {
      drawCards(side, effect.value ?? 1, rng);
      continue;
    }
    if (effect.op === "GAIN_ENERGY") {
      side.energy = Math.min(combatConfig.maxEnergy, side.energy + (effect.value ?? 1));
      continue;
    }
    if (effect.op === "GAIN_MOMENTUM") {
      side.momentum = Math.min(combatConfig.maxMomentum, side.momentum + (effect.value ?? 1));
      continue;
    }
    if (
      effect.op === "HEAL" &&
      actor &&
      definition.effects.some((row) => row.op === "DAMAGE") &&
      (definition.targetType === "ENEMY" || definition.targetType === "ALL_ENEMIES")
    ) {
      const healed = scaleSustain(next, effect.value ?? 0, "HEAL");
      actor.hp = Math.min(actor.maxHp, actor.hp + healed);
      next.log.push({ type: "HEAL", targetId: actor.id, value: healed, text: `${actor.name} recupera ${healed}.` });
      applyResourceEvent(next, { trigger: "HEAL", actor, target: actor });
      continue;
    }
    for (const target of targets) {
      if (effect.op === "HEAL") {
        const healed = scaleSustain(next, effect.value ?? 0, "HEAL");
        target.hp = Math.min(target.maxHp, target.hp + healed);
        next.log.push({ type: "HEAL", targetId: target.id, value: healed, text: `${target.name} recupera ${healed}.` });
        applyResourceEvent(next, { trigger: "HEAL", actor, target });
      }
      if (effect.op === "SHIELD") {
        const shielded = scaleSustain(next, effect.value ?? 0, "SHIELD");
        target.shield += shielded;
        next.log.push({ type: "SHIELD", targetId: target.id, value: shielded, text: `${target.name} ganha ${shielded} de escudo.` });
        applyResourceEvent(next, { trigger: "GAIN_SHIELD", actor, target, shieldAmount: shielded });
      }
      if (effect.op === "REMOVE_STATUS") {
        if (target.statuses.length > 0) {
          next.log.push({ type: "STATUS_REMOVED", targetId: target.id, text: `${target.name} se livra dos status.` });
        }
        target.statuses = [];
      }
      if (effect.op === "APPLY_STATUS" && effect.status) {
        applyStatus(target, effect.status, effect.duration ?? 2, reactions);
        if (effect.status === "BURN" && actor) {
          applyStatus(actor, "MOLTEN", 1);
        }
        next.log.push({
          type: "STATUS",
          targetId: target.id,
          sourceCreatureId: actor?.creatureId,
          text: `${target.name} recebe ${effect.status}${actor ? ` por ${actor.name}` : ""}.`,
        });
        applyResourceEvent(next, { trigger: "APPLY_STATUS", actor, target, status: effect.status });
      }
      if (effect.op === "DAMAGE") {
        const stat = definition.element === "FIRE" || definition.element === "WATER" || definition.element === "NATURE" || definition.element === "ELECTRIC"
          ? (actor?.mag ?? 10)
          : (actor?.atk ?? 10);
        const atkScaling = Math.floor(stat * 0.35);
        const base = (effect.value ?? 8) + atkScaling;
        const elementMul = actor ? calculateElementMultiplier(definition.element, target.element) : 1;
        const defMitigation = Math.round(target.def / combatConfig.defenseDivisor);
        const mitigated = Math.max(
          combatConfig.minDamageOnHit,
          Math.round(base * elementMul - defMitigation),
        );
        const crit = actor && rng.next() < actor.crit;
        const finalDamage = crit ? Math.round(mitigated * combatConfig.critDamage) : mitigated;
        const breakdown = {
          base: effect.value ?? 8,
          atkScaling,
          element: Math.round(base * elementMul - base),
          defMitigation: -defMitigation,
          crit: crit ? finalDamage - mitigated : 0,
          final: finalDamage,
        };
        const hpBefore = target.maxHp <= 0 ? 0 : target.hp / target.maxHp;
        applyDamage(target, finalDamage, actor, next.sides[next.activeSide === 0 ? 1 : 0].creatures, definition.tags);
        struck = true;
        applyResourceEvent(next, { trigger: "RECEIVE_DAMAGE", actor, target, damage: finalDamage });
        applyResourceEvent(next, { trigger: "DEAL_DAMAGE", actor, target, damage: finalDamage, targetHpRatioBefore: hpBefore, crit: Boolean(crit) });
        if (crit) {
          applyResourceEvent(next, { trigger: "CRITICAL_HIT", actor, target, crit: true, targetHpRatioBefore: hpBefore });
        }
        next.log.push({
          type: "DAMAGE",
          actorSide: next.activeSide,
          cardKey: definition.key,
          targetId: target.id,
          value: finalDamage,
          sourceCreatureId: actor?.creatureId,
          sourceCardId: instance.instanceId,
          damageBreakdown: breakdown,
          text: `${target.name} sofre ${finalDamage} de dano.`,
        });
        if (target.hp <= 0) {
          next.log.push({ type: "CREATURE_KO", targetId: target.id, text: `${target.name} cai.` });
          const foe = next.sides[next.activeSide === 0 ? 1 : 0];
          if (target.creatureId) {
            purgeDeadCreatureCards(foe, target.creatureId, next);
          }
          collapseIfNeeded(next, foe);
          syncActiveTypologies(foe);
        }
      }
    }
  }

  if (struck) {
    decayPersonalResources(next, side, "AFTER_ATTACK");
  }
  if (definition.tags.includes("LIVING_FURNACE") && actor) {
    applyStatus(actor, "MOLTEN", 2);
  }
  if (definition.tags.includes("PULL")) {
    const foe = next.sides[next.activeSide === 0 ? 1 : 0];
    const front = livingOnLine(foe.creatures, "FRONT")[0];
    const mid = livingOnLine(foe.creatures, "MID")[0];
    if (front && mid) {
      swapSlots(front, mid);
      next.log.push({ type: "FORMATION", targetId: mid.id, text: `${mid.name} é puxado para a linha de frente.` });
    }
  }
  if (definition.tags.includes("MOBILITY") && actor && combatLineOf(actor.slot) !== "FRONT") {
    const front = livingOnLine(side.creatures, "FRONT")[0];
    if (front && front.id !== actor.id) {
      swapSlots(actor, front);
      next.log.push({ type: "FORMATION", targetId: actor.id, text: `${actor.name} avança para a frente.` });
    }
  }

  next.rngIndex += 6;
  const playTypology = canonicalPlayTypology({
    typology: instance.typology ?? definition.typology,
    tags: definition.tags,
  });
  const playTags = playTypologyTags(instance, definition);
  recordUsage(next, { ...instance, typology: playTypology ?? instance.typology ?? definition.typology }, playTags);
  if (battleFusionEnabled(next)) {
    const living = livingTypologies(side.creatures);
    const already = playTypology ? playsOfTypology(next.usageHistory, next.activeSide, playTypology, next.round) : 0;
    const gain = isV2(next)
      ? resonanceForPlayCapped(
          playTypology ? [playTypology] : [],
          living,
          Math.max(0, already - 1),
          combatMatrixConfig.resonanceCapPerTypologyPerRound,
          combatMatrixConfig.diminishingAfterPlays,
        )
      : resonanceForPlay(playTypology ? [playTypology] : [], living);
    if (gain > 0 && playTypology) {
      const current = fusionOf(side);
      const byTypology = { ...(current.byTypology ?? {}) };
      byTypology[playTypology] = (byTypology[playTypology] ?? 0) + gain;
      side.fusion = {
        ...current,
        resonance: current.resonance + gain,
        byTypology,
        telegraph: current.resonance + gain >= combatMatrixConfig.resonanceThreshold ? "HIGH_RESONANCE" : null,
      };
      next.log.push({ type: "RESONANCE_GAINED", value: gain, text: `+${gain} Resonance` });
    }
    refreshFusion(next, next.activeSide);
    syncActiveFusion(next);
  }
  const meta = effectMetaOf(definition);
  if (actor) {
    const chain = recordChainLink(side, {
      creatureId: actor.creatureId ?? actor.id,
      creatureName: actor.name,
      cardKey: definition.key,
      cardName: definition.name,
      produces: [...meta.produces],
      consumes: [...meta.consumes],
      reactsTo: [...meta.reactsTo],
      transforms: [...meta.transforms],
    });
    if (chain.chained) {
      const names = (side.geneticChain?.links ?? []).map((row) => row.creatureName);
      next.log.push({
        type: "GENETIC_CHAIN",
        eventId: nextEventId(next),
        sourceCreatureId: actor.creatureId,
        sourceCardId: instance.instanceId,
        value: chain.length,
        text: `Reage a ${chain.tokens.join(", ")}. Genetic Chain x${chain.length}. ${names.join(" → ")}`,
      });
      const prior = side.geneticChain?.links[chain.length - 2];
      gainTeamResonance(next, side, prior?.creatureId, actor.creatureId, chain.tokens.join("+"));
    }
  }
  const foe = next.sides[next.activeSide === 0 ? 1 : 0];
  if (foe.reactionSlot && isReactionCard(playDefinition(foe.reactionSlot.card))) {
    const reactionDef = playDefinition(foe.reactionSlot.card);
    const reactionMeta = effectMetaOf(reactionDef);
    const produced = new Set(meta.produces);
    const triggers = reactionMeta.reactsTo.some((token) => produced.has(token)) || reactionDef?.tags.includes("COUNTER");
    if (triggers && (reactionMeta.reactsTo.length === 0 || reactionMeta.reactsTo.some((token) => produced.has(token) || token === "ANY"))) {
      const armed = foe.reactionSlot;
      foe.discard.push(armed.card);
      foe.reactionSlot = null;
      next.log.push({
        type: "REACTION_RESOLVED",
        eventId: nextEventId(next),
        parentEventId: next.log.at(-1)?.eventId,
        reactionDepth: 1,
        text: `Reação de ${foe.displayName} resolve · ${reactionDef?.name ?? armed.card.definitionKey}.`,
      });
    }
  }
  refreshSupreme(next, side);
  checkVictory(next);
  return next;
}

function recordUsage(state: BattleState, instance: { definitionKey: string; sourceCreatureId?: string; typology?: string; element?: string }, tags: readonly string[]) {
  state.usageHistory = state.usageHistory ?? [];
  state.usageHistory.push({
    sequence: state.usageHistory.length + 1,
    round: state.round,
    side: state.activeSide,
    cardKey: instance.definitionKey,
    sourceCreatureId: instance.sourceCreatureId,
    typology: instance.typology,
    element: instance.element,
    mechanicTags: [...tags],
  });
}

function refreshFusion(state: BattleState, sideIndex: 0 | 1 = state.activeSide) {
  const side = state.sides[sideIndex];
  syncActiveTypologies(side);
  const living = livingTypologies(side.creatures);
  const current = fusionOf(side);
  const consumed = current.consumed ?? [];
  const already = current.pool.filter((row) => row.ready && !consumed.includes(row.familyKey)).map((row) => row.familyKey);
  const awakenedKeep = current.awakened && !consumed.includes(current.awakened) ? [current.awakened] : [];
  const candidates = isV2(state)
    ? evaluateMatrixFusion({
        livingTypologies: living,
        usage: state.usageHistory ?? [],
        side: sideIndex,
        round: state.round,
        resonance: current.resonance,
        momentum: side.momentum,
        alreadyAwakened: [...already, ...awakenedKeep],
      })
    : evaluateFusionAvailability({
        typologies: living,
        round: state.round,
        resonance: current.resonance,
        momentum: side.momentum,
      }).map((row) => ({
        ...row,
        kind: row.triple ? ("CONVERGENCE" as const) : ("FUSION" as const),
        presentation: row.triple ? ("CONVERGENCE" as const) : ("FUSION" as const),
        reason: row.reason,
      }));

  const pool = candidates
    .filter((row) => !consumed.includes(row.familyKey))
    .map((row) => ({
      familyKey: row.familyKey,
      namePt: row.namePt,
      ready: row.ready,
      triple: row.triple,
      kind: row.kind,
      textPt: row.textPt,
      reason: row.reason,
    }));
  const awakened = pool.find((row) => row.ready && !row.triple)?.familyKey ?? (current.awakened && !consumed.includes(current.awakened) ? current.awakened : null);
  const convergence = pool.find((row) => row.ready && row.triple)?.familyKey ?? (current.convergence && !consumed.includes(current.convergence) ? current.convergence : null);
  const windowAnnounced = current.windowAnnounced || state.round >= combatMatrixConfig.fusionUnlockRound;
  const nextFusion: BattleFusionState = {
    resonance: current.resonance,
    triggerDepth: current.triggerDepth,
    pool,
    awakened,
    convergence,
    consumed,
    byTypology: current.byTypology ?? {},
    windowAnnounced,
    convergenceAnnounced: Boolean(current.convergenceAnnounced || convergence),
    telegraph: current.resonance >= combatMatrixConfig.resonanceThreshold ? "HIGH_RESONANCE" : null,
  };
  side.fusion = nextFusion;
  if (sideIndex === state.activeSide) {
    state.fusion = nextFusion;
    if (awakened && state.round >= combatMatrixConfig.fusionUnlockRound) {
      if (!state.log.some((row) => row.type === "FUSION_AVAILABLE" && row.text.includes(awakened))) {
        state.log.push({ type: "FUSION_AVAILABLE", text: `SINERGIA DESPERTADA · ${awakened}` });
      }
    }
    if (convergence && state.round >= combatMatrixConfig.convergenceMinRound) {
      if (!state.log.some((row) => row.type === "CONVERGENCE_AVAILABLE")) {
        state.log.push({ type: "CONVERGENCE_AVAILABLE", text: `GENETIC CONVERGENCE DETECTED · ${convergence}` });
      }
    }
  }
}

function playSpecialCard(
  state: BattleState,
  action: Extract<BattleAction, { type: "PLAY_FUSION" } | { type: "PLAY_CONVERGENCE" }>,
  rng: RandomService,
): BattleState {
  const side = state.sides[state.activeSide];
  const familyKey = action.type === "PLAY_CONVERGENCE" ? (action.familyKey ?? fusionOf(side).convergence) : action.familyKey;
  const family = fusionFamilies.find((row) => row.key === familyKey);
  const candidate = fusionOf(side).pool.find((row) => row.familyKey === familyKey && row.ready);
  if (!family || !candidate) {
    state.log.push({ type: "REJECT", text: action.type === "PLAY_CONVERGENCE" ? "Convergência indisponível." : "Fusão indisponível." });
    return state;
  }
  if (action.type === "PLAY_CONVERGENCE" && !candidate.triple) {
    state.log.push({ type: "REJECT", text: "Isso não é uma Convergência." });
    return state;
  }
  const cost = candidate.triple ? combatMatrixConfig.convergenceEnergyCost : combatMatrixConfig.fusionEnergyCost;
  if (side.energy < cost) {
    state.log.push({ type: "REJECT", text: "Energia insuficiente." });
    return state;
  }
  side.energy -= cost;
  const targets = resolveValidTargets(state, state.activeSide, candidate.triple ? "ALL_ENEMIES" : "ALL_ENEMIES", family.typologies, action.targetId);
  const allies = livingCreatures(side);
  for (const effect of family.effects) {
    if (effect.op === "HEAL" || effect.op === "SHIELD") {
      for (const ally of allies) {
        if (effect.op === "HEAL") {
          ally.hp = Math.min(ally.maxHp, ally.hp + (effect.value ?? 0));
        } else {
          ally.shield += effect.value ?? 0;
        }
      }
    }
    if (effect.op === "DAMAGE" || effect.op === "APPLY_STATUS") {
      for (const target of targets) {
        if (effect.op === "DAMAGE") {
          applyDamage(target, effect.value ?? 10);
        }
        if (effect.op === "APPLY_STATUS" && effect.status) {
          applyStatus(target, effect.status, effect.duration ?? 2);
        }
      }
    }
  }
  const fusion = fusionOf(side);
  fusion.consumed = [...(fusion.consumed ?? []), familyKey!];
  fusion.awakened = fusion.awakened === familyKey ? null : fusion.awakened;
  fusion.convergence = fusion.convergence === familyKey ? null : fusion.convergence;
  fusion.pool = fusion.pool.filter((row) => row.familyKey !== familyKey);
  side.fusion = fusion;
  syncActiveFusion(state);
  state.log.push({
    type: candidate.triple ? "CONVERGENCE_PLAYED" : "FUSION_PLAYED",
    text: `${side.displayName} ativa ${candidate.namePt}.`,
  });
  state.rngIndex += 4;
  void rng;
  refreshFusion(state, state.activeSide);
  checkVictory(state);
  return state;
}

export function pickAiAction(state: BattleState): BattleAction {
  const side = state.sides[state.activeSide];
  const playable = side.hand
    .map((card) => ({ card, def: playDefinition(card) }))
    .filter((row) => row.def && side.energy >= row.def.cost && sourceCreatureAlive(side, row.card))
    .sort((a, b) => (b.def?.cost ?? 0) - (a.def?.cost ?? 0));
  const attack = playable.find((row) => row.def?.effects.some((effect) => effect.op === "DAMAGE"));
  const chosen = attack ?? playable[0];
  if (!chosen) {
    return { type: "END_TURN" };
  }
  const targets = resolveValidTargets(state, state.activeSide, chosen.def?.targetType ?? "ENEMY", targetingTags(chosen.def?.tags ?? []));
  return { type: "PLAY_CARD", cardInstanceId: chosen.card.instanceId, targetId: targets[0]?.id };
}
