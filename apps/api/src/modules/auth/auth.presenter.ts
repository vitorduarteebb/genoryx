import { parseCharacterAppearance } from "@nexora/config";
import type { Character, User, Wallet } from "@nexora/database";
import { toWalletView } from "../../common/wallets";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export type PublicUser = {
  id: string;
  email: string;
  role: User["role"];
  createdAt: Date;
};

export function presentUser(user: PublicUser, wallets: Wallet[] = []) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    wallets: wallets.map(toWalletView),
  };
}

export function presentCharacter(character: Character) {
  return {
    id: character.id,
    name: character.name,
    level: character.level,
    xp: character.xp,
    class: character.class,
    mapKey: character.mapKey,
    posX: character.posX,
    posY: character.posY,
    starterChosen: character.starterChosen,
    appearance: parseCharacterAppearance(character.appearanceJson),
    appearanceConfirmed: character.appearanceConfirmed,
    createdAt: character.createdAt,
  };
}

export { publicUserSelect };
