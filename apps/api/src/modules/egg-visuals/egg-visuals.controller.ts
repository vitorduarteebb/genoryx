import { Controller, Get, Header, Param } from "@nestjs/common";
import { EggVisualsService } from "./egg-visuals.service";

@Controller("egg-visuals")
export class EggVisualsController {
  constructor(private readonly visuals: EggVisualsService) {}

  @Get(":assetId/image")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  @Header("Cache-Control", "public, max-age=86400")
  image(@Param("assetId") assetId: string) {
    return this.visuals.streamImage(assetId);
  }
}
