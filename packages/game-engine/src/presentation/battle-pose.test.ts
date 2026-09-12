import { describe, expect, it } from "vitest";
import {
  ART04_CANONICAL_FORWARD,
  battleActorYaw,
  battleCameraHeight,
  battleDepthPresentation,
  battleDesiredHeading,
  battleGroundOffset,
  detectCanonicalForward,
  frameBattleCamera,
  resolveBattleDepth,
  rotateYaw,
} from "./battle-pose";

describe("canonical forward", () => {
  it("Art04 documentado é +Z", () => {
    expect(ART04_CANONICAL_FORWARD).toEqual({ x: 0, z: 1 });
  });

  it("detecta +Z, -Z e +X pelo vetor cabeça−quadril", () => {
    expect(detectCanonicalForward({ x: 0, z: 1.2 }, { x: 0, z: 0 })).toEqual({ x: 0, z: 1 });
    const back = detectCanonicalForward({ x: 0, z: -0.8 }, { x: 0, z: 0 });
    expect(back.z).toBeCloseTo(-1);
    const plusX = detectCanonicalForward({ x: 0.9, z: 0 }, { x: 0, z: 0 });
    expect(plusX.x).toBeCloseTo(1);
    expect(plusX.z).toBeCloseTo(0);
  });

  it("sem silhueta usa o fallback +Z", () => {
    expect(detectCanonicalForward({ x: 0, z: 0 }, { x: 0, z: 0 })).toEqual({ x: 0, z: 1 });
  });
});

describe("battle facing", () => {
  it("inimigo olha para +X e jogador para -X, sem virar as costas para +Z", () => {
    const foeYaw = battleActorYaw(ART04_CANONICAL_FORWARD, "FOE");
    const youYaw = battleActorYaw(ART04_CANONICAL_FORWARD, "YOU");
    const foeHead = rotateYaw(ART04_CANONICAL_FORWARD, foeYaw);
    const youHead = rotateYaw(ART04_CANONICAL_FORWARD, youYaw);
    expect(foeHead.x).toBeGreaterThan(0.9);
    expect(youHead.x).toBeLessThan(-0.9);
    expect(foeHead.z).toBeGreaterThan(0);
    expect(youHead.z).toBeGreaterThan(0);
  });

  it("asset já em +X não leva um rotateY(π) extra no time inimigo", () => {
    const plusX = { x: 1, z: 0 };
    const yaw = battleActorYaw(plusX, "FOE");
    expect(Math.abs(yaw)).toBeLessThan(0.4);
    const facing = rotateYaw(plusX, yaw);
    expect(facing.x).toBeGreaterThan(0.9);
  });

  it("asset −Z (traseira no export) ainda aponta o focinho ao adversário", () => {
    const backward = { x: 0, z: -1 };
    const foe = rotateYaw(backward, battleActorYaw(backward, "FOE"));
    const you = rotateYaw(backward, battleActorYaw(backward, "YOU"));
    expect(foe.x).toBeGreaterThan(0.9);
    expect(you.x).toBeLessThan(-0.9);
  });

  it("heading desejado nunca aponta para −Z (traseira na câmera)", () => {
    expect(battleDesiredHeading("FOE").z).toBeGreaterThan(0);
    expect(battleDesiredHeading("YOU").z).toBeGreaterThan(0);
  });
});

describe("ground anchor", () => {
  it("planta pelos pés: offset = −minY", () => {
    expect(battleGroundOffset(-0.41, false, 1.1)).toBeCloseTo(0.41);
    expect(battleGroundOffset(0.2, false, 1.1)).toBeCloseTo(-0.2);
  });

  it("levitação (FLOATING) sobe a âncora sem offsets por espécie", () => {
    const planted = battleGroundOffset(-0.3, false, 1);
    const hover = battleGroundOffset(-0.3, true, 1);
    expect(hover).toBeGreaterThan(planted);
    expect(hover - planted).toBeGreaterThan(0.04);
  });
});

describe("depth and size", () => {
  it("FRONT é maior e mais baixo que BACK", () => {
    const front = battleDepthPresentation("FRONT");
    const back = battleDepthPresentation("BACK");
    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.lift).toBeLessThan(back.lift);
    expect(front.zIndex).toBeGreaterThan(back.zIndex);
  });

  it("slots de formação mapeiam profundidade sem ids de criatura", () => {
    expect(resolveBattleDepth("FRONT")).toBe("FRONT");
    expect(resolveBattleDepth("MIDDLE")).toBe("MIDDLE");
    expect(resolveBattleDepth("BACK_LEFT")).toBe("BACK");
    expect(resolveBattleDepth("BACK_RIGHT")).toBe("BACK");
  });

  it("limites visuais comprimem formiga e colosso e preservam ordem", () => {
    const small = battleCameraHeight(0.35);
    const mid = battleCameraHeight(1.02);
    const large = battleCameraHeight(2.4);
    expect(small).toBeGreaterThanOrEqual(0.76);
    expect(large).toBeLessThanOrEqual(1.32);
    expect(small).toBeLessThan(mid);
    expect(mid).toBeLessThan(large);
  });
});

describe("battle camera", () => {
  it("olha do +Z na altura do peito, não do centro do modelo no céu", () => {
    const framed = frameBattleCamera({ height: 1.1, span: 1.4 });
    expect(framed.position.z).toBeGreaterThan(framed.position.x);
    expect(framed.position.y).toBeGreaterThan(0.2);
    expect(framed.position.y).toBeLessThan(1.2);
    expect(framed.target.y).toBeCloseTo(framed.position.y);
    expect(framed.groundNdcY).toBeLessThan(-0.7);
  });
});
