import { Controller, Get } from "@nestjs/common";
import { BattleVisualsService } from "./battle-visuals.service";

@Controller("battle-visuals")
export class BattleVisualsController {
  constructor(private readonly visuals: BattleVisualsService) {}

  @Get("species")
  species() {
    return this.visuals.speciesCatalog();
  }

  @Get("report")
  report() {
    return this.visuals.diagnose();
  }
}
