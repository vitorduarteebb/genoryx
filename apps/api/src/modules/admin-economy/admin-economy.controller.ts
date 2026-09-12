import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AdminEconomyService } from "./admin-economy.service";

class AdjustDto {
  @IsUUID()
  userId!: string;

  @Type(() => Number)
  @IsInt()
  amount!: number;

  @IsIn(["GOLD", "NEX"])
  currency!: "GOLD" | "NEX";

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  reason!: string;
}

@Controller("admin/economy")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminEconomyController {
  constructor(private readonly economy: AdminEconomyService) {}

  @Get("dashboard")
  dashboard(@Query("window") window?: string) {
    const key = window === "7d" || window === "30d" || window === "24h" ? window : "24h";
    return this.economy.dashboard(key);
  }

  @Post("adjust")
  adjust(@CurrentUser() user: RequestUser, @Body() dto: AdjustDto) {
    return this.economy.adjust(user.id, dto);
  }
}
