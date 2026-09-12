import { Controller, Get, Header, Param } from "@nestjs/common";
import { CreatureModelsService } from "./creature-models.service";

@Controller("creature-models")
export class CreatureModelsController {
  constructor(private readonly models: CreatureModelsService) {}

  @Get(":modelId/model")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  @Header("Cache-Control", "public, max-age=86400")
  model(@Param("modelId") modelId: string) {
    return this.models.streamModel(modelId);
  }

  @Get(":modelId/views/:view")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  @Header("Cache-Control", "public, max-age=86400")
  view(@Param("modelId") modelId: string, @Param("view") view: string) {
    return this.models.streamView(modelId, view);
  }
}
