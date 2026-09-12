import { Injectable } from "@nestjs/common";
import { combatMatrixConfig } from "@nexora/config";
import { combatDraftProof, combatMatrixProof } from "@nexora/game-engine";

@Injectable()
export class CombatMatrixService {
  proof() {
    return {
      flags: {
        COMBAT_DRAFT_V2: combatMatrixConfig.draftV2,
        FORMATION_LINEAR_V2: combatMatrixConfig.formationLinearV2,
        FUSION_V2: combatMatrixConfig.fusionV2,
        CONVERGENCE_V1: combatMatrixConfig.convergenceV1,
      },
      draft: combatDraftProof(),
      battle: combatMatrixProof(),
    };
  }
}
