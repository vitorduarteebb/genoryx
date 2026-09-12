import { Controller, Get, Header, Param, Query } from "@nestjs/common";
import { CARD_ART_BASE_VARIANT } from "@nexora/config";
import { CardArtService } from "./card-art.service";

const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

@Controller("card-art")
export class CardArtController {
  constructor(private readonly arts: CardArtService) {}

  @Get("proof")
  proof() {
    return this.arts.describeProof();
  }

  @Get("creature-proof/:creatureId")
  creatureProof(@Param("creatureId") creatureId: string) {
    return this.arts.describeCreatureProof(creatureId);
  }

  @Get(":id/image")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  @Header("Cache-Control", "public, max-age=86400")
  image(@Param("id") id: string, @Query("variant") variant?: string) {
    if (UUID_PREFIX.test(id)) {
      return this.arts.streamImage(id);
    }
    return this.arts.streamByCard(id, variant || CARD_ART_BASE_VARIANT);
  }
}
