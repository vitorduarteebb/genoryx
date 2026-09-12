import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsInt, IsUUID, Min } from "class-validator";
import { CurrentUser, type RequestUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MarketService } from "./market.service";

class CreateListingDto {
  @IsUUID()
  creatureId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceGold!: number;
}

@Controller("market")
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query("species") species?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("generation") generation?: string,
    @Query("mutation") mutation?: string,
    @Query("produces") produces?: string,
    @Query("consumes") consumes?: string,
    @Query("archetype") archetype?: string,
  ) {
    return this.market.list(user.id, {
      species,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      generation: generation ? Number(generation) : undefined,
      mutation,
      produces,
      consumes,
      archetype,
    });
  }

  @Get("history")
  history() {
    return this.market.history();
  }

  @Post("listings")
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateListingDto) {
    return this.market.create(user.id, dto.creatureId, dto.priceGold);
  }

  @Post("listings/:id/buy")
  buy(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.market.buy(user.id, id);
  }

  @Post("listings/:id/cancel")
  cancel(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.market.cancel(user.id, id);
  }
}
