import { Controller, Get, Header, Param } from "@nestjs/common";
import { CreatureVisualsService } from "./creature-visuals.service";

@Controller("creature-visuals")
export class CreatureVisualsController {
  constructor(private readonly visuals: CreatureVisualsService) {}

  @Get(":assetId/image")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  @Header("Cache-Control", "public, max-age=86400")
  image(@Param("assetId") assetId: string) {
    return this.visuals.streamImage(assetId);
  }
}
