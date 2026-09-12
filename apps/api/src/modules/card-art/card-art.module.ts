import { Module } from "@nestjs/common";
import { GeneticPowersModule } from "../genetic-powers/genetic-powers.module";
import { CardArtController } from "./card-art.controller";
import { CardArtService } from "./card-art.service";
import { CardArtWorker } from "./card-art.worker";

@Module({
  imports: [GeneticPowersModule],
  controllers: [CardArtController],
  providers: [CardArtService, CardArtWorker],
  exports: [CardArtService],
})
export class CardArtModule {}
