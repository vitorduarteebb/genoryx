import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { generationConcurrency } from "./concurrency";
import { CreatureVisualsService } from "./creature-visuals.service";

const WORKER_INTERVAL_MS = 5_000;

@Injectable()
export class CreatureVisualsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(CreatureVisualsWorker.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly visuals: CreatureVisualsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || process.env.SKIP_VISUAL_WORKER === "1" || process.env.CREATURE_IMAGE_PROVIDER === "mock") {
      return;
    }
    const intervalMs = WORKER_INTERVAL_MS;
    const concurrency = generationConcurrency();
    this.timer = setInterval(() => {
      void this.visuals.processDue(concurrency).catch((error: unknown) => {
        this.log.warn(error instanceof Error ? error.message : "worker visual falhou");
      });
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
