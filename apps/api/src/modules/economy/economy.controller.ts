import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsInt, IsString, Max, Min } from "class-validator";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EconomyService } from "./economy.service";

class BuyDto {
  @IsString()
  itemKey!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(private readonly economy: EconomyService) {}

  @Get("inventory")
  inventory(@CurrentUser() user: RequestUser) {
    return this.economy.inventory(user.id);
  }

  @Get("shop")
  shop() {
    return this.economy.shop();
  }

  @Post("shop/buy")
  buy(@CurrentUser() user: RequestUser, @Body() dto: BuyDto) {
    return this.economy.buy(user.id, dto.itemKey, dto.quantity);
  }
}
