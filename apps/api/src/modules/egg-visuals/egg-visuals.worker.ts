import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { eggVisualGenerationConfig } from "@nexora/config";
import { generationConcurrency } from "../creature-visuals/concurrency";
import { EggVisualsService } from "./egg-visuals.service";

@Injectable()
export class EggVisualsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(EggVisualsWorker.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly visuals: EggVisualsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || process.env.SKIP_VISUAL_WORKER === "1" || process.env.CREATURE_IMAGE_PROVIDER === "mock") {
      return;
    }
    this.timer = setInterval(() => {
      void this.visuals.processDue(generationConcurrency()).catch((error: unknown) => {
        this.log.warn(error instanceof Error ? error.message : "worker ovo falhou");
      });
    }, eggVisualGenerationConfig.workerIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
