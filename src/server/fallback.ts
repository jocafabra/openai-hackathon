import { demoScenario } from "@/data/demo";
import type { StrategyResult } from "@/domain/types";

export interface ExtractedProfile {
  travelerName: string;
  origin: string;
  destination: string;
  departureStart: string;
  departureEnd: string;
  passengers: number;
  objective: "economy" | "balance" | "comfort";
  flexDays: number;
  acceptsConnections: boolean;
  walletBalances: Array<{ program: string; balance: number }>;
  missingFields: string[];
  clarificationQuestions: string[];
}

export interface StrategyExplanation {
  decision: string;
  economy: string;
  reason: string;
  nextStep: string;
}

export function fallbackProfile(): ExtractedProfile {
  return {
    travelerName: demoScenario.traveler.name,
    origin: demoScenario.trip.origin,
    destination: demoScenario.trip.destination,
    departureStart: demoScenario.trip.departureWindow.start,
    departureEnd: demoScenario.trip.departureWindow.end,
    passengers: demoScenario.trip.passengers,
    objective: demoScenario.trip.objective,
    flexDays: demoScenario.traveler.flexDays,
    acceptsConnections: demoScenario.traveler.acceptsConnections,
    walletBalances: demoScenario.wallet.balances.map(({ program, balance }) => ({ program, balance })),
    missingFields: [],
    clarificationQuestions: [],
  };
}

export function fallbackExplanation(strategy: StrategyResult): StrategyExplanation {
  const points = strategy.options.find((option) => option.kind === "own_points");
  const economy = strategy.action === "EXECUTE"
    ? `Economia econômica estimada de R$ ${(points?.savingsVsCashBRL ?? 0).toLocaleString("pt-BR")}, com desembolso de R$ ${(points?.cashOutlayBRL ?? 0).toLocaleString("pt-BR")}.`
    : "Ainda não há economia recomendada para executar; o bônus atual está abaixo da condição definida.";

  return {
    decision: strategy.decision === "WAIT" ? "Espere. Não transfira os pontos agora." : "Execute somente após confirmar a emissão.",
    economy,
    reason: strategy.summary,
    nextStep: strategy.nextStep,
  };
}

