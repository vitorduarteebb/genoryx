import { visualGrowth } from "./creature-visual-contract";

const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export function visualHash(text: string) {
  let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0;
}
function noise(seed: number, index: number) { let h = Math.imul(seed ^ index, 1597334677); h = Math.imul(h ^ (h >>> 16), 2246822519); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; }
function blinkPulse(t: number, start: number) {
  const q = t - start; return q < .085 ? smooth(q / .085) : 1 - smooth((q - .14) / .16);
}
/** O(1), seekable presentation noise; no access to genetic or gameplay RNG. */
export function sampleCreatureLife(time: number, identity: string, stage?: string | null, temperament?: string | null, reduced = false) {
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  if (reduced) return { breath: .25, blink: 0, yaw: 0, pitch: 0, tail: 0, special: 0 };
  const seed = visualHash(identity || "genoryx"), growth = visualGrowth(stage);
  const phase = noise(seed, 1) * Math.PI * 2;
  const period = growth.breathPeriod * (temperament === "CALM" ? 1.12 : temperament === "AGGRESSIVE" ? .93 : 1);
  const breath = .25 + .32 * (.5 - .5 * Math.cos(t * Math.PI * 2 / period + phase + .10 * Math.sin(t * .17 + phase)));
  let blink = 0;
  const window = Math.floor(t / 8);
  for (let w = window - 1; w <= window; w++) {
    if (w < 0 || noise(seed, w * 7 + 11) < .18) continue;
    const start = w * 8 + 1.0 + noise(seed, w * 7 + 12) * 5.4;
    blink = Math.max(blink, blinkPulse(t, start));
    if (noise(seed, w * 7 + 13) < .10) blink = Math.max(blink, blinkPulse(t, start + .40));
  }
  const w = Math.floor(t / 18), start = w * 18 + 4 + noise(seed, w * 3 + 101) * 8;
  const local = (t - start) / 3.8;
  const envelope = local > 0 && local < 1 ? Math.sin(local * Math.PI) ** 2 : 0;
  const gain = temperament === "MYSTERIOUS" ? .7 : temperament === "PLAYFUL" ? 1.15 : 1;
  return { breath, blink: clamp(blink), yaw: envelope * (noise(seed, w * 3 + 102) - .5) * .065 * gain,
    pitch: envelope * (noise(seed, w * 3 + 103) - .5) * .025,
    tail: Math.sin(t * .48 + phase) * .015, special: envelope };
}
