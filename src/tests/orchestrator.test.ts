import { describe, expect, it } from "vitest";
import { demoScenario } from "@/data/demo";
import { analyzeMessage } from "@/server/orchestrator";

describe("orquestrador com fallback", () => {
  it("analisa o caso de demo sem chave da OpenAI", async () => {
    const result = await analyzeMessage(demoScenario.inputMessage, {});

    expect(result.aiMode).toBe("fallback");
    expect(result.profile.travelerName).toBe("João");
    expect(result.strategy.decision).toBe("WAIT");
    expect(result.fallbackReason).toContain("OPENAI_API_KEY");
  });

  it("mantém números do motor na explicação local", async () => {
    const result = await analyzeMessage(demoScenario.inputMessage, {});

    expect(result.strategy.options.find((option) => option.kind === "cash")?.economicCostBRL).toBe(8_350);
    expect(result.explanation.reason).toBe(result.strategy.summary);
  });
});

