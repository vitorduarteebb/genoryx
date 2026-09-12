import { Controller, Get, UseGuards } from "@nestjs/common";
import { presentationConfig, verdantisLandmarks, verdantisMobSpawns, worldRespawnConfig } from "@nexora/config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("world")
@UseGuards(JwtAuthGuard)
export class WorldController {
  @Get("presentation")
  presentation() {
    return {
      worldRenderer: presentationConfig.worldRenderer,
      battleRenderer: presentationConfig.battleRenderer,
      landmarks: verdantisLandmarks,
      spawns: verdantisMobSpawns,
      respawn: worldRespawnConfig,
    };
  }
}
