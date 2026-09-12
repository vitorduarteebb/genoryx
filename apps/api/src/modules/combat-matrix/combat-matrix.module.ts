import { Module } from "@nestjs/common";
import { CombatMatrixController } from "./combat-matrix.controller";
import { CombatMatrixService } from "./combat-matrix.service";

@Module({
  controllers: [CombatMatrixController],
  providers: [CombatMatrixService],
})
export class CombatMatrixModule {}
