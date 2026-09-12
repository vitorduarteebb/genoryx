"use client";

import { BattleCreature, type BattleCreatureView } from "./battle-creature";
import "./battle-arena.css";
import { visualFixture } from "../lib/creature-visual-fixtures";

function unit(
  id: string,
  name: string,
  slot: string,
  index: number,
  stage: "BABY" | "YOUNG" | "ADULT",
  hp: number,
): BattleCreatureView {
  return {
    id,
    creatureId: id,
    name,
    element: index % 2 ? "FIRE" : "AQUA",
    hp,
    maxHp: 100,
    shield: 0,
    slot,
    visual: {
      lifeStage: stage,
      temperament: "PROUD",
      bodyPlan: "QUADRUPED",
      chassis: visualFixture(index, stage),
      visualSeed: id,
    },
    chassis: visualFixture(index, stage),
  };
}

const foe = [
  unit("qa-e-back", "Pequena", "BACK", 2, "BABY", 72),
  unit("qa-e-mid", "Média", "MIDDLE", 7, "YOUNG", 88),
  unit("qa-e-front", "Grande", "FRONT", 11, "ADULT", 96),
];
const you = [
  unit("qa-p-front", "Frente", "FRONT", 14, "ADULT", 90),
  unit("qa-p-mid", "Meio", "MIDDLE", 18, "YOUNG", 80),
  unit("qa-p-back", "Retaguarda", "BACK", 23, "ADULT", 84),
];

export function BattleGroundingLab() {
  return (
    <main className="gx-stage" style={{ minHeight: "100vh", padding: 16, background: "#07060a" }}>
      <p style={{ color: "#87c2be", letterSpacing: 4, textAlign: "center" }}>GENORYX / ARENA GROUNDING</p>
      <section className="gx-arena" data-shot="wide">
        <div className="gx-arena__field" data-formation="linear">
          <div className="gx-arena__side" data-side="foe">
            <div className="gx-arena__slot" data-area="e-back"><span className="gx-arena__lane">Retaguarda</span><BattleCreature unit={foe[0]} foe /></div>
            <div className="gx-arena__slot" data-area="e-mid"><span className="gx-arena__lane">Meio</span><BattleCreature unit={foe[1]} foe /></div>
            <div className="gx-arena__slot" data-area="e-front"><span className="gx-arena__lane">Frente</span><BattleCreature unit={foe[2]} foe /></div>
          </div>
          <div className="gx-arena__core" />
          <div className="gx-arena__side" data-side="you">
            <div className="gx-arena__slot" data-area="p-front"><span className="gx-arena__lane">Frente</span><BattleCreature unit={you[0]} /></div>
            <div className="gx-arena__slot" data-area="p-mid"><span className="gx-arena__lane">Meio</span><BattleCreature unit={you[1]} /></div>
            <div className="gx-arena__slot" data-area="p-back"><span className="gx-arena__lane">Retaguarda</span><BattleCreature unit={you[2]} /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
