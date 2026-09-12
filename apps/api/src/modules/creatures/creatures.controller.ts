import { Body, Controller, Get, Param, Patch, Put, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreaturesService } from "./creatures.service";
import { SetPartyDto } from "./dto/party.dto";
import { RenameCreatureDto } from "./dto/rename.dto";
import { ChooseStarterDto } from "./dto/starter.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class CreaturesController {
  constructor(private readonly creatures: CreaturesService) {}

  @Post("creatures/starter")
  starter(@CurrentUser() user: RequestUser, @Body() dto: ChooseStarterDto) {
    return this.creatures.chooseStarter(user.id, dto.speciesKey);
  }

  @Get("creatures")
  list(@CurrentUser() user: RequestUser) {
    return this.creatures.list(user.id);
  }

  @Get("creatures/genesis-queue")
  genesisQueue(@CurrentUser() user: RequestUser) {
    return this.creatures.genesisQueue(user.id);
  }

  @Get("creatures/evolution-queue")
  evolutionQueue(@CurrentUser() user: RequestUser) {
    return this.creatures.evolutionQueue(user.id);
  }

  @Get("creatures/:id/genesis")
  genesis(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.genesis(user.id, id);
  }

  @Post("creatures/:id/reveal")
  reveal(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.reveal(user.id, id);
  }

  @Get("creatures/:id/evolution")
  evolution(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.evolution(user.id, id);
  }

  @Post("creatures/:id/evolve")
  evolve(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.evolve(user.id, id);
  }

  @Get("creatures/:id/card-kit")
  cardKit(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.cardKit(user.id, id);
  }

  @Get("creatures/:id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.creatures.get(user.id, id);
  }

  @Patch("creatures/:id")
  rename(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: RenameCreatureDto) {
    return this.creatures.rename(user.id, id, dto.name);
  }

  @Get("party")
  party(@CurrentUser() user: RequestUser) {
    return this.creatures.party(user.id);
  }

  @Put("party")
  setParty(@CurrentUser() user: RequestUser, @Body() dto: SetPartyDto) {
    return this.creatures.setParty(user.id, dto.creatureIds);
  }

  @Get("deck")
  deck(@CurrentUser() user: RequestUser) {
    return this.creatures.party(user.id);
  }
}
