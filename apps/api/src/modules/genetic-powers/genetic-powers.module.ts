import { Module } from "@nestjs/common";
import { GeneticPowersController } from "./genetic-powers.controller";
import { GeneticPowersService } from "./genetic-powers.service";

@Module({
  controllers: [GeneticPowersController],
  providers: [GeneticPowersService],
  exports: [GeneticPowersService],
})
export class GeneticPowersModule {}
