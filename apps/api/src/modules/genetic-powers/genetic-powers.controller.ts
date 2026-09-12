import { Controller, Get } from "@nestjs/common";
import { GeneticPowersService } from "./genetic-powers.service";

@Controller("genetic-powers")
export class GeneticPowersController {
  constructor(private readonly powers: GeneticPowersService) {}

  @Get("proof")
  proof() {
    return this.powers.proofs();
  }

  @Get("breeding-proof")
  breeding() {
    return this.powers.proofs().breeding;
  }

  @Get("battle-proof")
  battle() {
    return this.powers.proofs().battle;
  }
}
