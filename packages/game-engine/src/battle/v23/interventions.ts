import type { InterventionOp } from "@nexora/config";
import type { Combatant } from "../types";
import { amplifyNode, cancelGraph, echoStatusPortion, mitigateDamage, suppressStatus, transformStatus } from "./graph";
import type { StackFrame } from "./types";

export function applyIntervention(
  op: InterventionOp,
  target: StackFrame,
  extras?: { newTargetId?: string; fromStatus?: string; toStatus?: string; interceptId?: string },
): StackFrame {
  const next: StackFrame = { ...target, graph: { nodes: target.graph.nodes.map((node) => ({ ...node })) } };
  switch (op) {
    case "CANCEL":
      next.cancelled = true;
      next.graph = cancelGraph(next.graph);
      break;
    case "MITIGATE":
      next.graph = mitigateDamage(next.graph, 0.5);
      break;
    case "SUPPRESS":
      next.graph = suppressStatus(next.graph);
      break;
    case "AMPLIFY":
      next.graph = amplifyNode(next.graph, "STATUS", 1);
      break;
    case "TRANSFORM":
      next.graph = transformStatus(next.graph, extras?.fromStatus ?? "BURN", extras?.toStatus ?? "HEAT");
      break;
    case "ECHO":
      next.graph = echoStatusPortion(next.graph);
      break;
    case "DELAY":
      next.delayed = true;
      break;
    case "SEAL":
      next.sealed = "NORMAL_LOCK";
      break;
    case "REDIRECT":
    case "INTERCEPT":
      if (extras?.newTargetId) next.redirectedTo = extras.newTargetId;
      break;
    case "DODGE":
      next.cancelled = true;
      next.graph = cancelGraph(next.graph);
      break;
    case "LAST_STAND":
      break;
    default:
      break;
  }
  return next;
}

export function applyLastStand(unit: Combatant, stoneCost: number, haveStone: number): boolean {
  if (haveStone < stoneCost) return false;
  if (unit.hp > 0) return false;
  unit.hp = 1;
  return true;
}

export function applyRedirectToCreature(frames: StackFrame[], frameId: string, newTargetId: string): StackFrame[] {
  return frames.map((frame) => (frame.id === frameId ? { ...frame, targetId: newTargetId, redirectedTo: newTargetId } : frame));
}
