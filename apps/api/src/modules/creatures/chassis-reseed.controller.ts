import { Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { CreaturesService } from "./creatures.service";

/**
 * Troca o plantel legado pelo chassi V1. Sem JWT: o token vive só no host
 * de deploy. Aberto na internet sem o header certo devolve 401 e não toca o banco.
 */
@Controller()
export class ChassisReseedController {
  constructor(private readonly creatures: CreaturesService) {}

  @Post("internal/chassis-reseed")
  reseed(@Headers("x-reseed-token") token?: string) {
    const expected = process.env.CHASSIS_RESEED_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException();
    }
    return this.creatures.reseedAllLegacyRosters();
  }
}
