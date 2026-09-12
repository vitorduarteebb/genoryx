"use client";

import { useState } from "react";
import { CreatureShrine } from "./creature-shrine";
import { GeneticPowerPanel } from "./genetic-power-panel";
import { IdentityPanel } from "./identity-panel";
import { ProfileTabs, type ProfileTab } from "./profile-tabs";
import "./profile.css";
import { visualFixture } from "../../lib/creature-visual-fixtures";

const genes = { HP: "A", ATK: "C", DEF: "A", MAG: "B", RES: "D", SPD: "B", CRIT: "S", EVA: "A", STATUS: "C" };

export function CreatureSheetLab() {
  const [tab, setTab] = useState<ProfileTab>("OVERVIEW");
  const chassis = visualFixture(11, "BABY");
  const power = {
    name: "Núcleo de Precisão",
    element: "ELECTRIC",
    typology: "CRITICAL",
    originType: "GENESIS",
    cards: [
      { locus: "G1", role: "BASIC", name: "Spark", namePt: "Faísca", text: "Golpe elétrico preciso.", catalogKey: "ember_strike", cost: 1 },
      { locus: "G2", role: "SKILL", name: "Arc", namePt: "Arco", text: "Avança e aplica choque.", catalogKey: "spark_step", cost: 2 },
      { locus: "G9", role: "SIGNATURE", name: "Needle", namePt: "Agulha", text: "Crítico garantido na janela.", catalogKey: "cinder_bolt", cost: 3 },
    ],
  };
  const row = {
    name: "Sparkyn",
    speciesName: "Sparkyn",
    level: 1,
    origin: "STARTER",
    generation: 0,
    mutation: null as string | null,
    geneticHash: "e85b6a9458d7781e",
    geneticPurity: 100,
    fertility: 4,
    lifeStage: "BABY",
    temperament: "NOBLE",
    bodyPlan: "INSECTOID_BIPED",
    genes,
    physical: { body: "INSECTOID_BIPED", head: "EXOTIC", temperament: "NOBLE", mutation: null },
    loci: [] as Array<{ key: string; expressed: string; recessive: string }>,
    geneticPower: power,
    parents: { father: null, mother: null },
    chassis,
    elementPrimary: "ELECTRIC",
    elementSecondary: null as string | null,
  };

  return (
    <main style={{ minHeight: "100vh", padding: 20, background: "#07060a" }}>
      <p style={{ color: "#87c2be", letterSpacing: 4, textAlign: "center" }}>GENORYX / FICHA</p>
      <div className="gx-ficha" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <CreatureShrine
          name="Sparkyn"
          element="ELECTRIC"
          chassis={chassis}
          lifeStage="BABY"
          temperament="NOBLE"
          creatureId="qa-sheet"
          bodyPlan="INSECTOID_BIPED"
          head="EXOTIC"
        />
        <IdentityPanel
          name="Sparkyn"
          speciesName="Sparkyn"
          gender="FEMALE"
          lifeStage="BABY"
          temperament="NOBLE"
          generation={0}
          fertility={4}
          bodyPlan="INSECTOID_BIPED"
          mutation={null}
          genes={genes}
          busy={false}
          error={null}
          saved={false}
          onRename={async () => undefined}
          onOpenGenetics={() => setTab("GENETICS")}
          onOpenCards={() => setTab("CARDS")}
          level={1}
          elementPrimary="ELECTRIC"
          origin="STARTER"
          geneticPurity={100}
          typology="CRITICAL"
        />
      </div>
      <div style={{ maxWidth: 1180, margin: "1rem auto" }}>
        <GeneticPowerPanel power={power} onOpenCards={() => setTab("CARDS")} />
        <div style={{ height: 16 }} />
        <ProfileTabs tab={tab} onTab={setTab} row={row} />
      </div>
    </main>
  );
}
