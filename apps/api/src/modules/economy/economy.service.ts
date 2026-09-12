import { Injectable } from "@nestjs/common";
import { economyConfig, forbiddenShopKeys, shopCatalog } from "@nexora/config";
import { Errors } from "../../common/errors/app-error";
import { grantItem } from "../../common/inventory";
import { debitWallet } from "../../common/ledger";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

  async inventory(userId: string) {
    const character = await this.requireCharacter(userId);
    const slots = await this.prisma.client.inventorySlot.findMany({
      where: { characterId: character.id },
      include: { item: { include: { template: true } } },
    });
    const wallets = await this.prisma.client.wallet.findMany({ where: { userId } });
    return {
      wallets: wallets.map((row) => ({ currency: row.currency, balance: row.balance.toString() })),
      items: slots.map((slot) => ({
        key: slot.item.template.key,
        name: slot.item.template.name,
        quantity: slot.quantity,
        category: slot.category,
      })),
    };
  }

  shop() {
    return { items: shopCatalog };
  }

  async buy(userId: string, itemKey: string, quantity: number) {
    if ((forbiddenShopKeys as readonly string[]).includes(itemKey)) {
      throw Errors.validation("Este item não é vendido.");
    }
    const item = shopCatalog.find((row) => row.key === itemKey);
    if (!item) {
      throw Errors.validation("Item fora do catálogo do Theo.");
    }
    const amount = BigInt(item.priceGold * quantity);
    const character = await this.requireCharacter(userId);
    const referenceId = `shop:${itemKey}:${crypto.randomUUID()}`;
    await this.prisma.client.$transaction(async (tx) => {
      await debitWallet(tx, {
        userId,
        currency: "GOLD",
        amount,
        source: economyConfig.ledgerSources.SHOP_PURCHASE,
        referenceId,
      });
      await grantItem(tx, character.id, itemKey, quantity, {
        source: economyConfig.ledgerSources.SHOP_PURCHASE,
        referenceId,
      });
    });
    return this.inventory(userId);
  }

  private async requireCharacter(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    return character;
  }
}
