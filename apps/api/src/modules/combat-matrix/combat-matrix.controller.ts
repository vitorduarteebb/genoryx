import { Controller, Get } from "@nestjs/common";
import { CombatMatrixService } from "./combat-matrix.service";

@Controller("combat-matrix")
export class CombatMatrixController {
  constructor(private readonly matrix: CombatMatrixService) {}

  @Get("proof")
  proof() {
    return this.matrix.proof();
  }
}
