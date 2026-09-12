import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { cardArtGenerationConfig } from "@nexora/config";
import { CardArtService } from "./card-art.service";

@Injectable()
export class CardArtWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(CardArtWorker.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly arts: CardArtService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || process.env.SKIP_VISUAL_WORKER === "1" || process.env.CARD_ART_PROVIDER === "mock") {
      return;
    }
    const tick = () => {
      void this.arts
        .enqueueMissingForReadyCreatures()
        .then(() => this.arts.processDue(cardArtGenerationConfig.generationConcurrency))
        .catch((error: unknown) => {
          this.log.warn(error instanceof Error ? error.message : "worker card-art falhou");
        });
    };
    tick();
    this.timer = setInterval(tick, cardArtGenerationConfig.workerIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
