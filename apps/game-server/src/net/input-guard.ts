import { worldConfig } from "@nexora/config";

export class InputGuard {
  private readonly timestamps = new Map<string, number[]>();
  private readonly lastSequence = new Map<string, number>();

  accept(sessionId: string, sequence: number, now = Date.now()): "ok" | "flood" | "stale" | "invalid" {
    if (!Number.isInteger(sequence) || sequence < 0 || sequence > Number.MAX_SAFE_INTEGER) {
      return "invalid";
    }

    const previous = this.lastSequence.get(sessionId);
    if (previous !== undefined && sequence <= previous) {
      return "stale";
    }
    if (previous !== undefined && sequence - previous > worldConfig.maxSequenceGap) {
      return "invalid";
    }

    const windowStart = now - 1000;
    const recent = (this.timestamps.get(sessionId) ?? []).filter((stamp) => stamp >= windowStart);
    if (recent.length >= worldConfig.maxInputsPerSecond) {
      return "flood";
    }

    recent.push(now);
    this.timestamps.set(sessionId, recent);
    this.lastSequence.set(sessionId, sequence);
    return "ok";
  }

  forget(sessionId: string) {
    this.timestamps.delete(sessionId);
    this.lastSequence.delete(sessionId);
  }
}
