import { Module } from "@nestjs/common";
import { CreatureVisualsModule } from "../creature-visuals/creature-visuals.module";
import { CreatureModelsController } from "./creature-models.controller";
import { CreatureModelsService } from "./creature-models.service";

@Module({
  imports: [CreatureVisualsModule],
  controllers: [CreatureModelsController],
  providers: [CreatureModelsService],
  exports: [CreatureModelsService],
})
export class CreatureModelsModule {}
