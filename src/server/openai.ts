import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { profileExtractionSchema, strategyExplanationSchema } from "@/domain/schemas";
import type { StrategyResult } from "@/domain/types";
import { extractProfilePrompt } from "@/prompts/extract-profile";
import { explainStrategyPrompt } from "@/prompts/explain-strategy";
import type { ExtractedProfile, StrategyExplanation } from "./fallback";

export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
}

export function hasOpenAIConfig(config: OpenAIConfig): config is Required<OpenAIConfig> {
  return Boolean(config.apiKey?.trim() && config.model?.trim());
}

export async function extractProfileWithOpenAI(
  message: string,
  config: Required<OpenAIConfig>,
): Promise<ExtractedProfile> {
  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await client.responses.parse({
    model: config.model,
    input: [
      { role: "system", content: extractProfilePrompt },
      { role: "user", content: message },
    ],
    text: { format: zodTextFormat(profileExtractionSchema, "travel_request") },
  });

  if (!response.output_parsed) throw new Error("A OpenAI não retornou um perfil estruturado.");
  return profileExtractionSchema.parse(response.output_parsed);
}

export async function explainStrategyWithOpenAI(
  strategy: StrategyResult,
  config: Required<OpenAIConfig>,
): Promise<StrategyExplanation> {
  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await client.responses.parse({
    model: config.model,
    input: [
      { role: "system", content: explainStrategyPrompt },
      { role: "user", content: JSON.stringify(strategy) },
    ],
    text: { format: zodTextFormat(strategyExplanationSchema, "strategy_explanation") },
  });

  if (!response.output_parsed) throw new Error("A OpenAI não retornou uma explicação estruturada.");
  return strategyExplanationSchema.parse(response.output_parsed);
}

