import type { Currency } from "@nexora/types";

export type WalletView = {
  currency: Currency;
  balance: string;
};

export function toWalletView(wallet: { currency: Currency; balance: bigint }): WalletView {
  return {
    currency: wallet.currency,
    balance: wallet.balance.toString(),
  };
}
