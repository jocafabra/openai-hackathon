import type { Wallet, WalletBalance } from "./types";

export interface WalletBalanceUpdate {
  program: string;
  balance: number;
  expiresAt?: string | null;
  referenceValuePer1000BRL: number;
  source?: string;
  updatedAt?: string;
}

interface WalletUpdateContext {
  source: string;
  observedAt: string;
}

/**
 * Replaces the editable balances while preserving wallet ownership.
 * Manual values carry their own source/date so the UI never hides provenance.
 */
export function replaceWalletBalances(
  current: Wallet,
  updates: readonly WalletBalanceUpdate[],
  context: WalletUpdateContext,
): Wallet {
  const balances: WalletBalance[] = updates.map((update) => ({
    program: update.program.trim(),
    balance: update.balance,
    expiresAt: update.expiresAt?.trim() || null,
    referenceValuePer1000BRL: update.referenceValuePer1000BRL,
    source: update.source?.trim() || context.source,
    updatedAt: update.updatedAt?.trim() || context.observedAt,
  }));

  return {
    travelerId: current.travelerId,
    balances,
    source: context.source.trim(),
  };
}
