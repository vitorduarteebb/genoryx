import { Module } from "@nestjs/common";
import { BattleVisualsController } from "./battle-visuals.controller";
import { BattleVisualsService } from "./battle-visuals.service";

@Module({
  controllers: [BattleVisualsController],
  providers: [BattleVisualsService],
  exports: [BattleVisualsService],
})
export class BattleVisualsModule {}
