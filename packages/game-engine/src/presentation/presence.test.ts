import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { pickNamedClip, resolveAnimationCapability } from "./animation-capabilities";
import { frameCreatureCamera } from "./framing";
import { composeMotionProfile, formatGeneticHash } from "./motion-profiles";
import { CreaturePresenceController } from "./presence";

const here = dirname(fileURLToPath(import.meta.url));

function florune() {
  return new CreaturePresenceController({
    visualSeed: "florune-feral-baby",
    temperament: "FERAL",
    lifeStage: "BABY",
    bodyPlan: "QUADRUPED",
  });
}

describe("motion profiles", () => {
  it("Florune FERAL BABY QUADRUPED is alert and quicker than a noble golem", () => {
    const pup = composeMotionProfile("QUADRUPED", "FERAL", "BABY");
    const statue = composeMotionProfile("GOLEM", "NOBLE", "ADULT");
    expect(pup.breathPeriod).toBeLessThan(statue.breathPeriod);
    expect(pup.breathScaleY).toBeGreaterThan(statue.breathScaleY);
    expect(pup.restPitchDeg).toBeGreaterThan(statue.restPitchDeg);
    expect(pup.energy).toBeGreaterThan(statue.energy);
    expect(pup.lookInterval[0]).toBeLessThan(statue.lookInterval[0]);
    expect(pup.breathScaleY).toBeLessThan(0.008);
    expect(pup.swayZDeg).toBeLessThan(1.2);
  });

  it("FLOATING bobs more than QUADRUPED", () => {
    const floating = composeMotionProfile("FLOATING", "NOBLE", "ADULT");
    const ground = composeMotionProfile("QUADRUPED", "NOBLE", "ADULT");
    expect(floating.verticalAmp).toBeGreaterThan(ground.verticalAmp * 4);
  });

  it("formatGeneticHash abreviado", () => {
    expect(formatGeneticHash("e85b6a94")).toBe("e85b…6a94");
    expect(formatGeneticHash("58d7781eac4307b7")).toBe("58d7…07b7");
  });
});

describe("CreaturePresenceController", () => {
  it("mesmo visualSeed no mesmo tempo reproduz o sample", () => {
    const a = florune().sample(3.25);
    const b = florune().sample(3.25);
    expect(a).toEqual(b);
  });

  it("respiração muda scaleY sem inflar como balão", () => {
    const life = florune();
    const samples = [0.4, 1.1, 1.8, 2.5, 3.2].map((t) => life.sample(t).scale.y);
    const spread = Math.max(...samples) - Math.min(...samples);
    expect(spread).toBeGreaterThan(0.0015);
    expect(Math.max(...samples)).toBeLessThan(1.01);
    expect(Math.min(...samples)).toBeGreaterThan(0.99);
  });

  it("FERAL BABY não fica estático e não gira sozinho", () => {
    const life = florune();
    const a = life.sample(1.2);
    const b = life.sample(8.4);
    expect(Math.abs(a.rotation.x) + Math.abs(a.rotation.z)).toBeGreaterThan(0.004);
    expect(Math.abs(b.rotation.y)).toBeLessThan(0.12);
    expect(Math.abs(b.position.y)).toBeLessThan(0.02);
  });

  it("interação reduz o movimento automático", () => {
    const calm = florune();
    const busy = florune();
    busy.setInteracting(true);
    calm.sample(5);
    busy.sample(5);
    const laterCalm = calm.sample(5.4);
    const laterBusy = busy.sample(5.4);
    expect(laterBusy.dampen).toBeLessThan(laterCalm.dampen);
    expect(Math.abs(laterBusy.rotation.z)).toBeLessThanOrEqual(Math.abs(laterCalm.rotation.z) + 1e-6);
  });

  it("entrada sobe de 0.96 visual via appear", () => {
    const life = florune();
    expect(life.sample(0).appear).toBe(0);
    expect(life.sample(0.2).appear).toBeGreaterThan(0.3);
    expect(life.sample(0.7).appear).toBe(1);
  });

  it("não usa Math.random no módulo de presença", () => {
    const files = ["presence.ts", "motion-profiles.ts", "framing.ts", "animation-capabilities.ts", "presentation-vfx.ts", "battle-pose.ts"];
    for (const file of files) {
      const text = readFileSync(join(here, file), "utf8");
      expect(text).not.toContain("Math.random");
    }
  });
});

describe("framing", () => {
  it("enquadra pelo bounding box, não por espécie", () => {
    const compact = frameCreatureCamera({
      size: { x: 1, y: 1, z: 1 },
      center: { x: 0, y: 0.5, z: 0 },
      aspect: 1,
      fovDeg: 32,
      bodyPlan: "QUADRUPED",
    });
    const long = frameCreatureCamera({
      size: { x: 4, y: 0.6, z: 0.6 },
      center: { x: 0, y: 0.3, z: 0 },
      aspect: 1,
      fovDeg: 32,
      bodyPlan: "SERPENT_WYRM",
    });
    expect(long.distance).toBeGreaterThan(compact.distance);
    expect(compact.minPolarAngle).toBeGreaterThan(0.8);
    expect(compact.maxPolarAngle).toBeLessThan(2.3);
    expect(compact.fill).toBeGreaterThanOrEqual(0.65);
    expect(compact.fill).toBeLessThanOrEqual(0.8);
  });
});

describe("animation capabilities", () => {
  it("GLB estático cai em NONE e idle ausente", () => {
    const row = resolveAnimationCapability({ boneCount: 0, morphTargetCount: 0, clipNames: [] });
    expect(row.capability).toBe("NONE");
    expect(row.idleClip).toBeNull();
  });

  it("clip idle normalizado", () => {
    expect(pickNamedClip(["Armature|Idle_02", "walk"], "idle")).toBe("Armature|Idle_02");
  });
});
