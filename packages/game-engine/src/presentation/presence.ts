import { createSeededRandom } from "../random/random-service";
import { seedFromParts } from "../genes/hash";
import { composeMotionProfile, type MotionProfile } from "./motion-profiles";

export type PresenceInput = {
  visualSeed: string;
  temperament: string;
  lifeStage: string;
  bodyPlan: string;
  reducedMotion?: boolean;
};

export type PresenceSample = {
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  appear: number;
  dampen: number;
};

type LifeEvent = {
  at: number;
  kind: "look" | "posture" | "special";
  yaw: number;
  pitch: number;
  roll: number;
  duration: number;
};

const DEG = Math.PI / 180;

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

function envelope(t: number, start: number, duration: number) {
  if (t < start || t > start + duration) {
    return 0;
  }
  return Math.sin(((t - start) / duration) * Math.PI);
}

export class CreaturePresenceController {
  readonly profile: MotionProfile;
  private readonly visualSeed: string;
  private readonly phase: number;
  private readonly reducedMotion: boolean;
  private interacting = false;
  private dampen = 1;
  private lastT: number | null = null;

  constructor(input: PresenceInput) {
    this.visualSeed = input.visualSeed || "genesis";
    this.profile = composeMotionProfile(input.bodyPlan, input.temperament, input.lifeStage);
    this.reducedMotion = Boolean(input.reducedMotion);
    const rng = createSeededRandom(seedFromParts([this.visualSeed, "presence-phase"]));
    this.phase = rng.next() * Math.PI * 2;
  }

  setInteracting(next: boolean) {
    this.interacting = next;
  }

  sample(elapsed: number): PresenceSample {
    const dt = this.lastT === null ? 0 : Math.min(0.05, Math.max(0, elapsed - this.lastT));
    this.lastT = elapsed;
    const target = this.interacting ? 0.28 : 1;
    const tau = this.interacting ? 0.16 : 0.72;
    this.dampen += (target - this.dampen) * (1 - Math.exp(-dt / tau));
    const appear = easeOutCubic(elapsed / 0.58);

    if (this.reducedMotion) {
      return {
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: this.profile.restPitchDeg * DEG, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        appear,
        dampen: this.dampen,
      };
    }

    const p = this.profile;
    const wobble = 1 + 0.035 * Math.sin(elapsed * 0.19 + this.phase);
    const period = p.breathPeriod * wobble;
    const breathWave = Math.sin((elapsed * Math.PI * 2) / period + this.phase);
    const hold = p.pause > 0 && (0.5 + 0.5 * Math.sin(elapsed * 0.31 + this.phase * 0.7)) < p.pause * 0.55;
    const breath = hold ? breathWave * 0.18 : breathWave;
    const life = this.dampen * (0.72 + 0.28 * appear);

    const events = this.activeEvents(elapsed);
    let lookY = 0;
    let lookX = 0;
    let postureZ = 0;
    let postureY = 0;
    let lunge = 0;
    for (const event of events) {
      const w = envelope(elapsed, event.at, event.duration);
      if (event.kind === "look") {
        lookY += event.yaw * w;
        lookX += event.pitch * w;
      } else if (event.kind === "posture") {
        postureZ += event.roll * w;
        postureY += event.yaw * 0.35 * w;
      } else {
        lunge += event.yaw * w;
        lookX += event.pitch * 0.45 * w;
      }
    }

    const sway = Math.sin(elapsed * (0.55 + p.energy * 0.25) + this.phase) * p.swayZDeg * DEG;
    const swayY = Math.sin(elapsed * 0.33 + this.phase * 1.3) * p.swayYDeg * DEG;
    const bob = Math.sin(elapsed * (0.7 + p.energy * 0.2) + this.phase) * p.verticalAmp;
    const entryY = (1 - appear) * -0.035;

    return {
      scale: {
        x: 1 + breath * p.breathScaleXZ * life + p.asymmetry * 0.0008 * breath,
        y: 1 + breath * p.breathScaleY * life,
        z: 1 + breath * p.breathScaleXZ * life * (1 - p.asymmetry * 0.25),
      },
      rotation: {
        x: (p.restPitchDeg + lookX * p.lookAmpDeg + lunge * 4) * DEG * life,
        y: (lookY * p.lookAmpDeg * DEG + swayY + postureY * p.postureAmpDeg * DEG) * life,
        z: (sway + postureZ * p.postureAmpDeg * DEG) * life,
      },
      position: {
        x: lookY * 0.004 * life,
        y: bob * life + entryY,
        z: lunge * p.specialAmp * life,
      },
      appear,
      dampen: this.dampen,
    };
  }

  private activeEvents(elapsed: number): LifeEvent[] {
    const rng = createSeededRandom(seedFromParts([this.visualSeed, "life-events"]));
    const p = this.profile;
    const found: LifeEvent[] = [];
    let lookT = 1.1 + rng.next() * 1.8;
    let postureT = 3.2 + rng.next() * 3.5;
    let specialT = 7 + rng.next() * 6;
    const limit = elapsed + 2.2;
    let guard = 0;
    while (guard < 64 && (lookT < limit || postureT < limit || specialT < limit)) {
      guard += 1;
      if (lookT <= limit) {
        found.push({
          at: lookT,
          kind: "look",
          yaw: (rng.next() - 0.5) * 2,
          pitch: (rng.next() - 0.5) * 0.8,
          roll: 0,
          duration: 0.65 + rng.next() * 0.55,
        });
        lookT += p.lookInterval[0] + rng.next() * (p.lookInterval[1] - p.lookInterval[0]);
      }
      if (postureT <= limit) {
        found.push({
          at: postureT,
          kind: "posture",
          yaw: (rng.next() - 0.5) * 1.4,
          pitch: 0,
          roll: (rng.next() - 0.5) * 2,
          duration: 0.9 + rng.next() * 0.7,
        });
        postureT += p.postureInterval[0] + rng.next() * (p.postureInterval[1] - p.postureInterval[0]);
      }
      if (specialT <= limit) {
        found.push({
          at: specialT,
          kind: "special",
          yaw: rng.next() > 0.35 ? 1 : -0.35,
          pitch: (rng.next() - 0.35) * 0.6,
          roll: 0,
          duration: 0.45 + rng.next() * 0.35,
        });
        specialT += p.specialInterval[0] + rng.next() * (p.specialInterval[1] - p.specialInterval[0]);
      }
    }
    return found.filter((event) => elapsed >= event.at && elapsed <= event.at + event.duration);
  }
}
