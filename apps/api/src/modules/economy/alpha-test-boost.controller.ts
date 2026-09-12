import { Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { economyConfig, economySystemEmail, genomeCatalystKey } from "@nexora/config";
import { creditOnce } from "../../common/ledger";
import { grantItem } from "../../common/inventory";
import { PrismaService } from "../../prisma/prisma.service";

const GOLD = 100_000n;
const CATALYSTS = 25;
const REFERENCE = "alpha-test-boost-20260910";

@Controller()
export class AlphaTestBoostController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("internal/alpha-test-boost")
  async boost(@Headers("x-reseed-token") token?: string) {
    const expected = process.env.CHASSIS_RESEED_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException();
    }

    const users = await this.prisma.client.user.findMany({
      where: { email: { not: economySystemEmail } },
      select: { id: true, character: { select: { id: true } } },
    });

    let goldGranted = 0;
    let catalystsGranted = 0;
    for (const user of users) {
      const result = await this.prisma.client.$transaction(async (tx) => {
        const credit = await creditOnce(tx, {
          userId: user.id,
          currency: "GOLD",
          amount: GOLD,
          source: economyConfig.ledgerSources.SYSTEM_GRANT,
          referenceId: REFERENCE,
        });
        const characterId = user.character?.id;
        if (characterId) {
          const already = await tx.itemFlow.findFirst({
            where: { characterId, templateKey: genomeCatalystKey, source: economyConfig.ledgerSources.SYSTEM_GRANT, referenceId: REFERENCE },
          });
          if (!already) {
            await grantItem(tx, characterId, genomeCatalystKey, CATALYSTS, {
              source: economyConfig.ledgerSources.SYSTEM_GRANT,
              referenceId: REFERENCE,
            });
            return { credited: credit.credited, catalyst: true };
          }
        }
        return { credited: credit.credited, catalyst: false };
      });
      if (result.credited) {
        goldGranted += 1;
      }
      if (result.catalyst) {
        catalystsGranted += 1;
      }
    }

    const eggs = await this.prisma.client.egg.updateMany({
      where: { status: "INCUBATING" },
      data: { hatchesAt: new Date() },
    });

    return {
      ok: true,
      gold: GOLD.toString(),
      goldGranted,
      catalysts: CATALYSTS,
      catalystsGranted,
      eggsReady: eggs.count,
    };
  }
}
