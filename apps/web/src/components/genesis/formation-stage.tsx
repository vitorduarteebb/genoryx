"use client";

import type { ChassisView } from "@nexora/config";
import { GenesisEggVisual } from "./genesis-egg-visual";
import { CreatureGxrFigure } from "../creature-gxr-figure";

export function FormationStage({
  failed,
  chassis,
  element,
  lifeStage,
  temperament,
  creatureId,
  genesisGrade,
}: {
  failed?: boolean;
  chassis?: ChassisView | null;
  element?: string | null;
  lifeStage?: string | null;
  temperament?: string | null;
  creatureId?: string | null;
  genesisGrade?: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      {chassis ? (
        <div className="genesis-forming-chassis">
          <CreatureGxrFigure
            chassis={chassis}
            element={element ?? "ARCANE"}
            lifeStage={lifeStage}
            temperament={temperament}
            creatureId={creatureId}
            context="HATCH"
            size={240}
          />
        </div>
      ) : (
        <GenesisEggVisual hints={{ eggId: creatureId ?? undefined, genesisGrade }} motion="incubating" size={240} />
      )}
      <p className="text-[10px] uppercase tracking-[0.28em] text-crystal">
        {failed ? "Arte oficial indisponível" : "Genesis está formando…"}
      </p>
      <p className="max-w-sm text-sm text-muted">
        {failed
          ? "A pintura oficial está sem crédito agora. O chassi já é o filho — você pode revelar e seguir."
          : "O ovo pulsa. A forma já existe no DNA. A pintura oficial ainda está na forja."}
      </p>
    </div>
  );
}
