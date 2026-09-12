import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsUUID } from "class-validator";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BreedingService } from "./breeding.service";

class BreedDto {
  @IsUUID()
  parentAId!: string;

  @IsUUID()
  parentBId!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class BreedingController {
  constructor(private readonly breeding: BreedingService) {}

  @Post("breeding/preview")
  preview(@CurrentUser() user: RequestUser, @Body() dto: BreedDto) {
    return this.breeding.preview(user.id, dto.parentAId, dto.parentBId);
  }

  @Post("breeding")
  breed(@CurrentUser() user: RequestUser, @Body() dto: BreedDto) {
    return this.breeding.breed(user.id, dto.parentAId, dto.parentBId);
  }

  @Get("eggs")
  eggs(@CurrentUser() user: RequestUser) {
    return this.breeding.eggs(user.id);
  }

  @Get("breeding/history")
  history(@CurrentUser() user: RequestUser) {
    return this.breeding.history(user.id);
  }

  @Post("eggs/:id/hatch")
  hatch(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.breeding.hatch(user.id, id);
  }
}
