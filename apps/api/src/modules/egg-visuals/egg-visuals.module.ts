import { Module } from "@nestjs/common";
import { EggVisualsController } from "./egg-visuals.controller";
import { EggVisualsService } from "./egg-visuals.service";
import { EggVisualsWorker } from "./egg-visuals.worker";

@Module({
  controllers: [EggVisualsController],
  providers: [EggVisualsService, EggVisualsWorker],
  exports: [EggVisualsService],
})
export class EggVisualsModule {}
