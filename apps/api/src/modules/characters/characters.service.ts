import { Injectable } from "@nestjs/common";
import { authConfig, parseCharacterAppearance } from "@nexora/config";
import { CharacterClass, Prisma } from "@nexora/database";
import { Errors } from "../../common/errors/app-error";
import { toWalletView } from "../../common/wallets";
import { presentCharacter } from "../auth/auth.presenter";
import { PrismaService } from "../../prisma/prisma.service";
import { parseCharacterName } from "./character-name";

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, rawName: string) {
    const existing = await this.prisma.client.character.findUnique({
      where: { userId },
    });
    if (existing) {
      throw Errors.characterExists();
    }

    const { display, normalized } = parseCharacterName(rawName);

    try {
      const character = await this.prisma.client.character.create({
        data: {
          userId,
          name: display,
          nameNormalized: normalized,
          level: 1,
          xp: 0,
          class: authConfig.defaultCharacterClass as CharacterClass,
        },
      });
      return presentCharacter(character);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
        if (fields.includes("user_id")) {
          throw Errors.characterExists();
        }
        throw Errors.characterNameTaken();
      }
      throw error;
    }
  }

  async me(userId: string) {
    const character = await this.prisma.client.character.findUnique({
      where: { userId },
    });
    if (!character) {
      throw Errors.characterNotFound();
    }

    const wallets = await this.prisma.client.wallet.findMany({
      where: { userId },
    });

    return {
      ...presentCharacter(character),
      wallets: wallets.map(toWalletView),
    };
  }

  async updateAppearance(userId: string, raw: unknown) {
    const existing = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!existing) {
      throw Errors.characterNotFound();
    }
    const appearance = parseCharacterAppearance(raw);
    const character = await this.prisma.client.character.update({
      where: { userId },
      data: {
        appearanceJson: appearance,
        appearanceConfirmed: true,
      },
    });
    return presentCharacter(character);
  }
}
