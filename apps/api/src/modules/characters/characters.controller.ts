import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CharactersService } from "./characters.service";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateAppearanceDto } from "./dto/update-appearance.dto";

@Controller("characters")
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCharacterDto) {
    return this.characters.create(user.id, dto.name);
  }

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.characters.me(user.id);
  }

  @Patch("me/appearance")
  updateAppearance(@CurrentUser() user: RequestUser, @Body() dto: UpdateAppearanceDto) {
    return this.characters.updateAppearance(user.id, dto.appearance);
  }
}
