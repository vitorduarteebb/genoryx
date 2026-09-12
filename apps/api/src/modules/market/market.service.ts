import { Injectable } from "@nestjs/common";
import { alphaConfig, economyConfig } from "@nexora/config";
import { marketFeeGold, marketListingFeeGold } from "@nexora/game-engine";
import { presentCreature, type CreatureRecord } from "../../common/creature-io";
import { canUseRevealedCreature, revealStatusOf } from "../../common/creature-visual-present";
import { Errors } from "../../common/errors/app-error";
import { creditSystemSink, creditWallet, debitWallet } from "../../common/ledger";
import { PrismaService } from "../../prisma/prisma.service";

const creatureInclude = {
  species: true,
  mutation: true,
  loci: true,
  visualAssets: true,
  modelAssets: true,
  geneticPower: { include: { power: true } },
} as const;

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    filters: {
      species?: string;
      minPrice?: number;
      maxPrice?: number;
      generation?: number;
      mutation?: string;
      produces?: string;
      consumes?: string;
      archetype?: string;
    },
  ) {
    const rows = await this.prisma.client.marketListing.findMany({
      where: {
        status: "ACTIVE",
        assetType: "CREATURE",
        priceGold: {
          gte: filters.minPrice !== undefined ? BigInt(filters.minPrice) : undefined,
          lte: filters.maxPrice !== undefined ? BigInt(filters.maxPrice) : undefined,
        },
        creature: {
          generation: filters.generation,
          species: filters.species ? { key: filters.species } : undefined,
          mutation: filters.mutation ? { key: filters.mutation } : undefined,
        },
      },
      include: { creature: { include: creatureInclude }, seller: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    const needle = (value?: string) => value?.trim().toUpperCase();
    const wantProduces = needle(filters.produces);
    const wantConsumes = needle(filters.consumes);
    const wantArchetype = needle(filters.archetype);
    return rows
      .filter((row) => row.creature)
      .filter((row) => {
        if (!wantProduces && !wantConsumes && !wantArchetype) return true;
        const manifest = (row.creature as { combatManifestJson?: {
          identity?: { archetype?: string; synergyTags?: string[] };
          cards?: Array<{ ability?: { produces?: string[]; consumes?: string[] } }>;
        } } | null)?.combatManifestJson;
        if (!manifest) return false;
        const produces = new Set((manifest.cards ?? []).flatMap((card) => card.ability?.produces ?? []));
        const consumes = new Set((manifest.cards ?? []).flatMap((card) => card.ability?.consumes ?? []));
        const tags = new Set([...(manifest.identity?.synergyTags ?? []), manifest.identity?.archetype ?? ""]);
        if (wantProduces && ![...produces, ...tags].some((token) => token.toUpperCase().includes(wantProduces))) return false;
        if (wantConsumes && ![...consumes, ...tags].some((token) => token.toUpperCase().includes(wantConsumes))) return false;
        if (wantArchetype && !(manifest.identity?.archetype ?? "").toUpperCase().includes(wantArchetype)) return false;
        return true;
      })
      .map((row) => ({
        id: row.id,
        priceGold: row.priceGold.toString(),
        createdAt: row.createdAt,
        seller: row.seller.email,
        isMine: row.sellerUserId === userId,
        creature: presentCreature(row.creature as CreatureRecord),
      }));
  }

  async create(userId: string, creatureId: string, priceGold: number) {
    const character = await this.requireCharacter(userId);
    if (character.level < alphaConfig.marketUnlockLevel) {
      throw Errors.marketInvalid("Mercado ainda fechado.");
    }
    if (priceGold <= 0 || !Number.isInteger(priceGold)) {
      throw Errors.marketInvalid("Preço inválido.");
    }
    const listing = await this.prisma.client.$transaction(async (tx) => {
      const creature = await tx.creature.findFirst({
        where: { id: creatureId, ownerCharacterId: character.id },
      });
      if (!creature) {
        throw Errors.creatureNotFound();
      }
      if (creature.lock !== "NONE") {
        throw Errors.creatureLocked();
      }
      if (!canUseRevealedCreature(revealStatusOf(creature))) {
        throw Errors.marketInvalid("Revele o Genesis antes de listar esta criatura.");
      }
      const inParty = await tx.partySlot.findFirst({ where: { creatureId } });
      if (inParty) {
        await tx.partySlot.delete({ where: { id: inParty.id } });
      }
      await tx.creature.update({ where: { id: creatureId }, data: { lock: "MARKET" } });
      const listing = await tx.marketListing.create({
        data: {
          sellerUserId: userId,
          assetType: "CREATURE",
          creatureId,
          priceGold: BigInt(priceGold),
          status: "ACTIVE",
        },
      });
      const listingFee = marketListingFeeGold(listing.priceGold);
      await debitWallet(tx, {
        userId,
        currency: "GOLD",
        amount: listingFee,
        source: economyConfig.ledgerSources.MARKET_LISTING_FEE,
        referenceId: listing.id,
      });
      await creditSystemSink(tx, {
        amount: listingFee,
        source: economyConfig.ledgerSources.SYSTEM_SINK,
        referenceId: `list:${listing.id}`,
      });
      return listing;
    });
    return {
      id: listing.id,
      priceGold: listing.priceGold.toString(),
      listingFeeGold: marketListingFeeGold(listing.priceGold).toString(),
      status: listing.status,
    };
  }

  async cancel(userId: string, listingId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const listing = await tx.marketListing.findUnique({
        where: { id: listingId },
        include: { creature: true },
      });
      if (!listing || listing.status !== "ACTIVE") {
        throw Errors.marketInvalid("Anúncio inativo.");
      }
      if (listing.sellerUserId !== userId) {
        throw Errors.marketInvalid("Só o vendedor pode cancelar.");
      }
      if (listing.creatureId) {
        await tx.creature.update({
          where: { id: listing.creatureId },
          data: { lock: "NONE" },
        });
      }
      await tx.marketListing.update({
        where: { id: listing.id },
        data: { status: "CANCELLED" },
      });
      return { id: listing.id, status: "CANCELLED" as const };
    });
  }

  async buy(userId: string, listingId: string) {
    const buyer = await this.requireCharacter(userId);
    return this.prisma.client.$transaction(async (tx) => {
      const listing = await tx.marketListing.findUnique({
        where: { id: listingId },
        include: { creature: true },
      });
      if (!listing || listing.status !== "ACTIVE" || !listing.creature) {
        throw Errors.marketInvalid("Listing inativo.");
      }
      if (listing.sellerUserId === userId) {
        throw Errors.marketInvalid("Não é possível comprar o próprio anúncio.");
      }
      const { fee, net } = marketFeeGold(listing.priceGold);
      await debitWallet(tx, {
        userId,
        currency: "GOLD",
        amount: listing.priceGold,
        source: economyConfig.ledgerSources.MARKET_SALE,
        referenceId: listing.id,
      });
      if (net > 0n) {
        await creditWallet(tx, {
          userId: listing.sellerUserId,
          currency: "GOLD",
          amount: net,
          source: economyConfig.ledgerSources.MARKET_SALE,
          referenceId: listing.id,
        });
      }
      if (fee > 0n) {
        await creditSystemSink(tx, {
          amount: fee,
          source: economyConfig.ledgerSources.SYSTEM_SINK,
          referenceId: `sale:${listing.id}`,
        });
      }
      await tx.creature.update({
        where: { id: listing.creature.id },
        data: { ownerCharacterId: buyer.id, lock: "NONE" },
      });
      await tx.marketListing.update({
        where: { id: listing.id },
        data: { status: "SOLD", soldAt: new Date() },
      });
      const sale = await tx.marketTransaction.create({
        data: {
          listingId: listing.id,
          buyerUserId: userId,
          grossGold: listing.priceGold,
          feeGold: fee,
          netGold: net,
        },
      });
      return {
        id: sale.id,
        priceGold: listing.priceGold.toString(),
        feeGold: fee.toString(),
        creatureId: listing.creature.id,
      };
    });
  }

  async history() {
    const rows = await this.prisma.client.marketTransaction.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { creature: { include: { species: true } } } } },
    });
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      priceGold: row.grossGold.toString(),
      feeGold: row.feeGold.toString(),
      species: row.listing.creature?.species.name ?? row.listing.creature?.species.key ?? row.listing.creature?.name ?? null,
      buyerUserId: row.buyerUserId,
      sellerUserId: row.listing.sellerUserId,
    }));
  }

  private async requireCharacter(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    return character;
  }
}
