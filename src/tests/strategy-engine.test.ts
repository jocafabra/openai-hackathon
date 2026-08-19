import { describe, expect, it } from "vitest";
import { createDemoInput, demoScenario } from "@/data/demo";
import { calculateStrategy } from "@/domain/strategy-engine";
import type { MilesBrokerOffer } from "@/domain/types";

describe("motor estratégico do MilesAI", () => {
  it("valida e importa integralmente o cenário mockado", () => {
    expect(demoScenario.traveler.name).toBe("João");
    expect(demoScenario.wallet.balances).toHaveLength(2);
    expect(demoScenario.offers).toHaveLength(3);
  });

  it("bônus de 30% retorna WAIT e registra a condição de 80%", () => {
    const result = calculateStrategy(createDemoInput());
    const points = result.options.find((option) => option.kind === "own_points");

    expect(result.decision).toBe("WAIT");
    expect(result.action).toBe("WAIT");
    expect(result.watchCondition?.condition.thresholdPercent).toBe(80);
    expect(points?.transfer?.plannedResultingMiles).toBe(156_000);
  });

  it("bônus de 80% exige 125k e gera 225k milhas", () => {
    const input = createDemoInput();
    input.promotion.bonusPercent = 80;
    const result = calculateStrategy(input);
    const points = result.options.find((option) => option.kind === "own_points");

    expect(result.decision).toBe("USE_POINTS");
    expect(result.action).toBe("EXECUTE");
    expect(points?.transfer?.sourcePoints).toBe(125_000);
    expect(points?.transfer?.resultingMiles).toBe(225_000);
  });

  it("bônus de 90% transforma 120k em 228k e reproduz economia econômica de R$ 4.200", () => {
    const result = calculateStrategy(createDemoInput({ promotion: demoScenario.wowPromotion }));
    const points = result.options.find((option) => option.kind === "own_points");

    expect(result.decision).toBe("USE_POINTS");
    expect(result.action).toBe("EXECUTE");
    expect(points?.transfer?.sourcePoints).toBe(120_000);
    expect(points?.transfer?.resultingMiles).toBe(228_000);
    expect(points?.cashOutlayBRL).toBe(1_750);
    expect(points?.economicCostBRL).toBe(4_150);
    expect(points?.savingsVsCashBRL).toBe(4_200);
  });

  it("saldo insuficiente impede a transferência", () => {
    const input = createDemoInput({ promotion: demoScenario.wowPromotion });
    input.wallet.balances[0].balance = 100_000;
    const result = calculateStrategy(input);
    const points = result.options.find((option) => option.kind === "own_points");

    expect(points?.eligible).toBe(false);
    expect(result.decision).not.toBe("USE_POINTS");
  });

  it("emissão indisponível impede qualquer recomendação de transferência", () => {
    const input = createDemoInput({ promotion: demoScenario.wowPromotion });
    const award = input.offers.find((offer) => offer.kind === "award");
    if (award) award.available = false;
    const result = calculateStrategy(input);
    const points = result.options.find((option) => option.kind === "own_points");

    expect(points?.eligible).toBe(false);
    expect(result.decision).not.toBe("USE_POINTS");
    expect(result.nextStep).toContain("emissão");
  });

  it("cotação vencida torna o balcão inelegível", () => {
    const input = createDemoInput({ now: "2026-08-22T12:00:00-03:00" });
    const result = calculateStrategy(input);
    const broker = result.options.find((option) => option.kind === "miles_broker");

    expect((input.offers.find((offer) => offer.kind === "miles_broker") as MilesBrokerOffer).expiresAt)
      .toBe("2026-08-21T23:59:59-03:00");
    expect(broker?.eligible).toBe(false);
  });

  it("não recomenda pontos quando seu custo econômico supera dinheiro", () => {
    const input = createDemoInput({ promotion: demoScenario.wowPromotion });
    input.wallet.balances[0].referenceValuePer1000BRL = 60;
    const result = calculateStrategy(input);
    const points = result.options.find((option) => option.kind === "own_points");

    expect(points?.economicCostBRL).toBeGreaterThan(8_350);
    expect(points?.eligible).toBe(false);
    expect(result.decision).not.toBe("USE_POINTS");
  });

  it("dados materiais ausentes retornam REVIEW", () => {
    const input = createDemoInput();
    input.trip.missingFields = ["passengers"];
    const result = calculateStrategy(input);

    expect(result.decision).toBe("REVIEW");
    expect(result.action).toBe("ASK_USER");
  });
});

