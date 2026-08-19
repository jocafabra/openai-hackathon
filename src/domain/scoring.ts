import type { OptionResult, Risk } from "./types";

const riskScore: Record<Risk, number> = { low: 100, medium: 70, high: 30 };
const simplicityScore: Record<OptionResult["complexity"], number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 20,
};

export function scoreOption(
  option: Pick<OptionResult, "eligible" | "savingsVsCashBRL" | "risk" | "complexity">,
  cashBaselineBRL: number,
  profileFit: number,
): number {
  if (!option.eligible) return 0;

  const savingsScore = cashBaselineBRL > 0
    ? Math.max(0, Math.min(100, (option.savingsVsCashBRL / cashBaselineBRL) * 100))
    : 0;
  const score = (
    savingsScore * 0.45
    + profileFit * 0.25
    + riskScore[option.risk] * 0.15
    + simplicityScore[option.complexity] * 0.15
  );

  return Math.round(score * 10) / 10;
}

