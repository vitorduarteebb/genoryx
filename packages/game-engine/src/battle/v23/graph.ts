import type { EffectDomain } from "@nexora/config";
import type { PlayableCard } from "../types";
import type { EffectGraph, EffectNode } from "./types";
import { inferEffectDomain } from "./timing";

export function graphFromCard(card: PlayableCard | null | undefined, domain?: EffectDomain): EffectGraph {
  const resolvedDomain = domain ?? inferEffectDomain(card);
  const nodes: EffectNode[] = (card?.effects ?? []).map((effect, index) => {
    const op = effect.op;
    const statusNode = op === "APPLY_STATUS" || op === "GAIN_RESOURCE";
    return {
      id: `n${index}-${op}`,
      op,
      value: effect.value,
      status: effect.status,
      duration: effect.duration,
      resource: effect.resource,
      counterable: op !== "CONSUME_RESOURCE" && op !== "GAIN_ENERGY",
      tags: statusNode ? ["STATUS"] : op === "DAMAGE" ? ["DAMAGE"] : [op],
      domain: resolvedDomain,
      priority: op === "DAMAGE" ? 10 : statusNode ? 20 : 30,
      suppressed: false,
      cancelled: false,
      amplified: 0,
    };
  });
  return { nodes };
}

export function cloneGraph(graph: EffectGraph): EffectGraph {
  return { nodes: graph.nodes.map((node) => ({ ...node, tags: [...node.tags] })) };
}

export function cancelGraph(graph: EffectGraph): EffectGraph {
  return { nodes: graph.nodes.map((node) => ({ ...node, cancelled: true })) };
}

export function suppressStatus(graph: EffectGraph): EffectGraph {
  return {
    nodes: graph.nodes.map((node) =>
      node.tags.includes("STATUS") || node.op === "APPLY_STATUS" ? { ...node, suppressed: true } : node,
    ),
  };
}

export function mitigateDamage(graph: EffectGraph, ratio = 0.5): EffectGraph {
  return {
    nodes: graph.nodes.map((node) =>
      node.op === "DAMAGE" && node.value != null
        ? { ...node, value: Math.max(0, Math.round(node.value * (1 - ratio))) }
        : node,
    ),
  };
}

export function amplifyNode(graph: EffectGraph, tag: string, amount: number): EffectGraph {
  return {
    nodes: graph.nodes.map((node) =>
      node.tags.includes(tag) || node.op === tag
        ? { ...node, amplified: node.amplified + amount, value: (node.value ?? 0) + amount }
        : node,
    ),
  };
}

export function transformStatus(graph: EffectGraph, from: string, to: string): EffectGraph {
  return {
    nodes: graph.nodes.map((node) => (node.status === from ? { ...node, status: to } : node)),
  };
}

export function echoStatusPortion(graph: EffectGraph): EffectGraph {
  return { nodes: graph.nodes.filter((node) => node.op === "APPLY_STATUS" || node.tags.includes("STATUS")).map((node) => ({ ...node })) };
}

export function activeNodes(graph: EffectGraph): EffectNode[] {
  return graph.nodes.filter((node) => !node.cancelled && !node.suppressed);
}
