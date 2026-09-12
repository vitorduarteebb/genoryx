import { Module } from "@nestjs/common";
import { AdminEconomyController } from "./admin-economy.controller";
import { AdminEconomyService } from "./admin-economy.service";

@Module({
  controllers: [AdminEconomyController],
  providers: [AdminEconomyService],
})
export class AdminEconomyModule {}
