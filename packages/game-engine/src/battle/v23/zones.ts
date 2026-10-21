import type { BattleSide, BattleState, PlayableCard } from "../types";
import { graphFromCard } from "./graph";
import { hydrateResolutionProfile } from "./timing";
import type { ChannelState, PreparedEffect } from "./types";

export function armPreparation(
  side: BattleSide,
  card: { instanceId: string; sourceCreatureId?: string },
  definition: PlayableCard,
  trigger = "ENEMY_MARKED",
): PreparedEffect {
  const profile = hydrateResolutionProfile(definition, definition.locusRole);
  const prepared: PreparedEffect = {
    id: `prep-${card.instanceId}`,
    side: 0,
    sourceCreatureId: card.sourceCreatureId,
    cardKey: definition.key,
    cardName: definition.name,
    trigger,
    remainingRounds: profile.durationRounds ?? 2,
    visibility: profile.visibility,
    graph: graphFromCard(definition, profile.effectDomain),
    profile,
  };
  side.preparedEffects = [...(side.preparedEffects ?? []), prepared];
  return prepared;
}

export function tickPreparations(side: BattleSide): PreparedEffect[] {
  const next = (side.preparedEffects ?? [])
    .map((row) => ({ ...row, remainingRounds: row.remainingRounds - 1 }))
    .filter((row) => row.remainingRounds > 0);
  side.preparedEffects = next;
  return next;
}

export function activatePreparations(side: BattleSide, trigger: string): PreparedEffect[] {
  const ready = (side.preparedEffects ?? []).filter((row) => row.trigger === trigger);
  side.preparedEffects = (side.preparedEffects ?? []).filter((row) => row.trigger !== trigger);
  return ready;
}

export function startChannel(
  side: BattleSide,
  sourceCreatureId: string,
  definition: PlayableCard,
): ChannelState {
  const profile = hydrateResolutionProfile(definition, definition.locusRole);
  const channel: ChannelState = {
    id: `ch-${sourceCreatureId}-${definition.key}`,
    side: 0,
    sourceCreatureId,
    cardKey: definition.key,
    cardName: definition.name,
    current: 1,
    required: profile.channelRounds ?? 2,
    interruptConditions: profile.interruptConditions,
    graph: graphFromCard(definition, profile.effectDomain),
    profile,
  };
  side.channels = [...(side.channels ?? []), channel];
  return channel;
}

export function tickChannels(state: BattleState, side: BattleSide): { completed: ChannelState[]; interrupted: ChannelState[] } {
  const completed: ChannelState[] = [];
  const interrupted: ChannelState[] = [];
  const kept: ChannelState[] = [];
  for (const channel of side.channels ?? []) {
    const source = side.creatures.find((unit) => unit.creatureId === channel.sourceCreatureId || unit.id === channel.sourceCreatureId);
    if (!source || source.hp <= 0) {
      interrupted.push(channel);
      continue;
    }
    const stunned = source.statuses.some((row) => channel.interruptConditions.includes(row.key));
    if (stunned) {
      interrupted.push(channel);
      continue;
    }
    const advanced = { ...channel, current: channel.current + 1 };
    if (advanced.current >= advanced.required) {
      completed.push(advanced);
    } else {
      kept.push(advanced);
    }
  }
  side.channels = kept;
  void state;
  return { completed, interrupted };
}
