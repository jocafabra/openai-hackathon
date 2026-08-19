import rawScenario from "./demo-scenario.json";
import { demoScenarioSchema } from "@/domain/schemas";
import type { DemoScenario, StrategyInput } from "@/domain/types";

export const demoScenario: DemoScenario = demoScenarioSchema.parse(rawScenario);

export function createDemoInput(overrides: Partial<StrategyInput> = {}): StrategyInput {
  return {
    traveler: structuredClone(demoScenario.traveler),
    trip: structuredClone(demoScenario.trip),
    wallet: structuredClone(demoScenario.wallet),
    offers: structuredClone(demoScenario.offers),
    promotion: structuredClone(demoScenario.initialPromotion),
    strategy: structuredClone(demoScenario.strategy),
    now: "2026-08-19T16:00:00-03:00",
    ...overrides,
  };
}

