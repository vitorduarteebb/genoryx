"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GeneticPowerPanel, type GeneticPowerView } from "../../../../components/creature-profile/genetic-power-panel";
import { IdentityPanel } from "../../../../components/creature-profile/identity-panel";
import { CreatureShrine } from "../../../../components/creature-profile/creature-shrine";
import { type MaturationView } from "../../../../components/maturation-meter";
import { ProfileTabs, type Kin, type ProfileTab } from "../../../../components/creature-profile/profile-tabs";
import "../../../../components/creature-profile/profile.css";
import { type CreaturePick } from "../../../../components/creature-pick-card";
import { GameShell } from "../../../../components/game-shell";
import { api } from "../../../../lib/api";
import { useGameSession } from "../../../../lib/use-game-session";

type Detail = CreaturePick & {
  canEvolve?: boolean;
  maturation?: MaturationView | null;
  level: number;
  mutation: string | null;
  fertility: number;
  geneticHash: string | null;
  geneticPurity: number | null;
  visualSeed?: string | null;
  origin?: string;
  birthDate?: string;
  elementSecondary?: string | null;
  genes: Record<string, string>;
  physical: Record<string, string | null> | null;
  loci: Array<{ key: string; expressed: string; recessive: string }>;
  geneticPower?: GeneticPowerView;
  combatIdentity?: import("../../../../components/creature-profile/identity-panel").CombatIdentityView | null;
  parents: {
    fatherId: string | null;
    motherId: string | null;
    breederId: string | null;
    generation: number;
    father: Kin | null;
    mother: Kin | null;
  };
};

export default function CreatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [row, setRow] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("OVERVIEW");

  useEffect(() => {
    if (!accessToken || !id) return;
    let alive = true;
    let timer: number | undefined;
    const shouldPoll = (next: Detail) =>
      next.visual?.status === "FORMING" || next.visual?.status === "PENDING" || Boolean(next.visualJob);
    void api<Detail>(`/creatures/${id}`, { accessToken }).then((next) => {
      if (!alive) return;
      if (next.revealStatus === "PENDING_VISUAL" || next.revealStatus === "READY_TO_REVEAL") {
        router.replace(`/game/genesis/${id}`);
        return;
      }
      setRow(next);
      if (!shouldPoll(next)) {
        return;
      }
      timer = window.setInterval(() => {
        void api<Detail>(`/creatures/${id}`, { accessToken }).then((latest) => {
          if (!alive) return;
          setRow((current) => (current ? { ...current, ...latest, parents: current.parents } : latest));
          if (!shouldPoll(latest)) {
            window.clearInterval(timer);
          }
        });
      }, 2500);
    });
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [accessToken, id, router]);

  async function rename(name: string) {
    if (!accessToken || !id) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const next = await api<Detail>(`/creatures/${id}`, {
        method: "PATCH",
        accessToken,
        body: { name },
      });
      setRow((current) => {
        if (!current) return next;
        return {
          ...current,
          ...next,
          parents: next.parents ?? current.parents,
          geneticPower: next.geneticPower?.cards ? next.geneticPower : current.geneticPower,
        };
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para renomear.");
    } finally {
      setBusy(false);
    }
  }

  if (!row) {
    return <GameShell title="Criatura">Carregando…</GameShell>;
  }

  return (
    <GameShell
      title={row.name}
      wide
      header={
        <header className="flex items-center justify-between gap-3">
          <Link href="/game/creatures" className="gx-page__kicker">
            ← Coleção
          </Link>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Ficha da criatura</p>
        </header>
      }
    >
      <div className="gx-ficha">
        <CreatureShrine
          name={row.name}
          element={String(row.elementPrimary)}
          chassis={row.chassis}
          model={row.model}
          portraitUrl={row.portraitUrl}
          visual={row.visual}
          visualStatus={row.visualStatus}
          visualJob={row.visualJob}
          revealStatus={row.revealStatus}
          lifeStage={row.lifeStage}
          temperament={row.temperament}
          visualSeed={row.visualSeed}
          aura={row.physical?.aura}
          creatureId={row.id}
          speciesKey={row.speciesKey}
          bodyPlan={row.bodyPlan}
          head={row.head}
          genesisSeed={row.genesisSeed}
          phenotype={row.phenotype}
        />
        <IdentityPanel
          name={row.name}
          speciesName={row.speciesName}
          gender={row.gender}
          lifeStage={row.lifeStage}
          temperament={row.temperament}
          generation={row.generation}
          fertility={row.fertility}
          bodyPlan={row.bodyPlan}
          mutation={row.mutation}
          genes={row.genes}
          busy={busy}
          error={error}
          saved={saved}
          onRename={rename}
          onOpenGenetics={() => setTab("GENETICS")}
          onOpenCards={() => setTab("CARDS")}
          creatureId={row.id}
          canEvolve={row.canEvolve}
          level={row.level}
          maturation={row.maturation}
          elementPrimary={String(row.elementPrimary)}
          elementSecondary={row.elementSecondary}
          origin={row.origin}
          geneticPurity={row.geneticPurity}
          typology={row.geneticPower?.typology}
          combatIdentity={row.combatIdentity}
        />
      </div>
      {row.geneticPower ? <GeneticPowerPanel power={row.geneticPower} onOpenCards={() => setTab("CARDS")} /> : null}
      <ProfileTabs tab={tab} onTab={setTab} row={row} />
    </GameShell>
  );
}
