import { demoScenario, createDemoInput } from "@/data/demo";
import { calculateStrategy } from "@/domain/strategy-engine";
import type { StrategyResult } from "@/domain/types";
import {
  fallbackExplanation,
  fallbackProfile,
  type ExtractedProfile,
  type StrategyExplanation,
} from "./fallback";
import {
  explainStrategyWithOpenAI,
  extractProfileWithOpenAI,
  hasOpenAIConfig,
  type OpenAIConfig,
} from "./openai";

export interface AnalysisResult {
  profile: ExtractedProfile;
  strategy: StrategyResult;
  explanation: StrategyExplanation;
  aiMode: "openai" | "fallback";
  fallbackReason?: string;
  scenario: typeof demoScenario;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 180);
  return "Falha desconhecida na chamada opcional à OpenAI.";
}

export async function analyzeMessage(
  message: string,
  config: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  },
): Promise<AnalysisResult> {
  const strategy = calculateStrategy(createDemoInput());
  const local = {
    profile: fallbackProfile(),
    strategy,
    explanation: fallbackExplanation(strategy),
    aiMode: "fallback" as const,
    scenario: demoScenario,
  };

  if (!hasOpenAIConfig(config)) {
    return {
      ...local,
      fallbackReason: "OPENAI_API_KEY ou OPENAI_MODEL não configurado; usando fallback local da demo.",
    };
  }

  try {
    const profile = await extractProfileWithOpenAI(message, config);
    const explanation = await explainStrategyWithOpenAI(strategy, config);
    return { profile, strategy, explanation, aiMode: "openai", scenario: demoScenario };
  } catch (error) {
    return { ...local, fallbackReason: safeErrorMessage(error) };
  }
}

