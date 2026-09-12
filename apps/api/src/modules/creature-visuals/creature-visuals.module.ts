import { Module } from "@nestjs/common";
import { CardArtModule } from "../card-art/card-art.module";
import { CreatureVisualsController } from "./creature-visuals.controller";
import { CreatureVisualsService } from "./creature-visuals.service";
import { CreatureVisualsWorker } from "./creature-visuals.worker";

@Module({
  imports: [CardArtModule],
  controllers: [CreatureVisualsController],
  providers: [CreatureVisualsService, CreatureVisualsWorker],
  exports: [CreatureVisualsService],
})
export class CreatureVisualsModule {}
