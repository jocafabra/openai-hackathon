import { describe, expect, it } from "vitest";
import {
  applyPromotionEvent,
  evaluateOperationalCase,
  generatePromotionAlerts,
  toStrategyInput,
  validateOperationalCase,
  type OperationalCase,
  type PromotionEvent,
} from "@/domain/operational";

const NOW = "2026-08-19T12:00:00-03:00";

function provenance(mode: "mock" | "live", provider: string) {
  return { mode, provider, observedAt: NOW } as const;
}

function createAnaCase(overrides: Partial<OperationalCase> = {}): OperationalCase {
  const operationalCase: OperationalCase = {
    id: "case_ana_lisbon",
    client: {
      id: "client_ana",
      name: "Ana",
      travelStyle: "economy",
      comfortLevel: 5,
      flexibility: "high",
      flexDays: 4,
      acceptsConnections: true,
      preferredAirports: ["REC"],
      maxConnections: 1,
      beginnerMode: true,
    },
    trip: {
      id: "trip_lisbon",
      travelerId: "client_ana",
      origin: "REC",
      destination: "LIS",
      destinationLabel: "Lisboa",
      departureWindow: { start: "2027-04-10", end: "2027-04-20" },
      passengers: 1,
      objective: "economy",
      maxConnections: 1,
      missingFields: [],
    },
    wallet: {
      data: {
        travelerId: "client_ana",
        balances: [{
          program: "Livelo",
          balance: 110_000,
          expiresAt: null,
          referenceValuePer1000BRL: 10,
          updatedAt: NOW,
        }],
        source: "manual_client_record",
      },
      provenance: provenance("mock", "agent_fixture"),
    },
    offers: [
      {
        data: {
          id: "cash_rec_lis",
          kind: "cash",
          passengers: 1,
          connections: 1,
          available: true,
          totalBRL: 6_000,
          source: "duffel",
          observedAt: NOW,
        },
        provenance: provenance("live", "duffel"),
      },
      {
        data: {
          id: "award_rec_lis",
          kind: "award",
          passengers: 1,
          connections: 1,
          available: true,
          program: "TAP Miles&Go",
          miles: 180_000,
          taxesBRL: 500,
          positioningFlightBRL: 0,
          source: "manual_agent_quote",
          observedAt: NOW,
        },
        provenance: provenance("mock", "agent_fixture"),
      },
    ],
    promotion: {
      data: {
        id: "promo_base_livelo_tap",
        type: "TRANSFER_BONUS",
        sourceProgram: "Livelo",
        targetProgram: "TAP Miles&Go",
        bonusPercent: 20,
        startsAt: "2026-08-18T00:00:00-03:00",
        endsAt: "2026-08-25T23:59:59-03:00",
        source: "manual_promotion",
      },
      provenance: provenance("mock", "agent_fixture"),
    },
    strategy: {
      sourceProgram: "Livelo",
      targetProgram: "TAP Miles&Go",
      minimumBonusPercent: 80,
      plannedSourcePoints: 100_000,
      hasTimeToWait: true,
    },
    now: NOW,
  };

  return { ...operationalCase, ...overrides };
}

function promotionEvent(
  overrides: Partial<PromotionEvent["promotion"]> = {},
): PromotionEvent {
  return {
    id: "event_livelo_tap_90",
    promotion: {
      id: "promo_livelo_tap_90",
      type: "TRANSFER_BONUS",
      sourceProgram: "Livelo",
      targetProgram: "TAP Miles&Go",
      bonusPercent: 90,
      startsAt: "2026-08-19T00:00:00-03:00",
      endsAt: "2026-08-23T23:59:59-03:00",
      source: "promotion_feed",
      ...overrides,
    },
    provenance: provenance("live", "promotion_feed"),
    occurredAt: NOW,
  };
}

describe("domínio operacional do MilesAI", () => {
  it("transforma Ana em StrategyInput sem substituir identidade ou números pelo caso João", () => {
    const input = toStrategyInput(createAnaCase());
    const evaluation = evaluateOperationalCase(createAnaCase());
    const points = evaluation.result.options.find((option) => option.kind === "own_points");

    expect(input.traveler.name).toBe("Ana");
    expect(input.trip.origin).toBe("REC");
    expect(input.trip.destination).toBe("LIS");
    expect(input.wallet.balances[0]?.balance).toBe(110_000);
    expect(points?.transfer?.plannedSourcePoints).toBe(100_000);
    expect(points?.transfer?.plannedResultingMiles).toBe(120_000);
    expect(evaluation.clientId).toBe("client_ana");
    expect(evaluation.result.watchCondition?.travelerId).toBe("client_ana");
    expect(JSON.stringify(input)).not.toContain("João");
  });

  it("recalcula a decisão quando bônus, saldo ou preço mudam", () => {
    const base = createAnaCase();
    expect(evaluateOperationalCase(base).result.decision).toBe("WAIT");

    const withBonus: OperationalCase = {
      ...base,
      promotion: {
        ...base.promotion,
        data: { ...base.promotion.data, bonusPercent: 80 },
      },
    };
    expect(evaluateOperationalCase(withBonus).result.decision).toBe("USE_POINTS");

    const lowBalance: OperationalCase = {
      ...withBonus,
      wallet: {
        ...withBonus.wallet,
        data: {
          ...withBonus.wallet.data,
          balances: [{ ...withBonus.wallet.data.balances[0]!, balance: 90_000 }],
        },
      },
    };
    expect(evaluateOperationalCase(lowBalance).result.decision).toBe("BUY_CASH");

    const cheapCash: OperationalCase = {
      ...withBonus,
      offers: withBonus.offers.map((entry) => entry.data.kind === "cash"
        ? { ...entry, data: { ...entry.data, totalBRL: 1_000 } }
        : entry),
    };
    expect(evaluateOperationalCase(cheapCash).result.decision).toBe("BUY_CASH");
  });

  it("retorna REVIEW quando há campos materiais pendentes", () => {
    const operationalCase = createAnaCase();
    operationalCase.trip.missingFields = ["datas exatas", "número de passageiros"];

    const evaluation = evaluateOperationalCase(operationalCase);

    expect(evaluation.result.decision).toBe("REVIEW");
    expect(evaluation.result.action).toBe("ASK_USER");
    expect(evaluation.result.nextStep).toContain("datas exatas");
  });

  it("mantém origem mock/live explícita e classifica composição mista", () => {
    const evaluation = evaluateOperationalCase(createAnaCase());

    expect(evaluation.dataMode).toBe("mixed");
    expect(evaluation.provenance.offers).toEqual([
      expect.objectContaining({ mode: "live", provider: "duffel" }),
      expect.objectContaining({ mode: "mock", provider: "agent_fixture" }),
    ]);

    const invalid = createAnaCase();
    delete (invalid.offers[0]!.provenance as Partial<typeof invalid.offers[0]["provenance"]>).mode;
    expect(validateOperationalCase(invalid).valid).toBe(false);
  });

  it("aplica promoção apenas ao caso compatível entre vários clientes", () => {
    const ana = createAnaCase();
    const bia: OperationalCase = {
      ...createAnaCase(),
      id: "case_bia_madrid",
      client: { ...createAnaCase().client, id: "client_bia", name: "Bia" },
      trip: {
        ...createAnaCase().trip,
        id: "trip_bia_madrid",
        travelerId: "client_bia",
        destination: "MAD",
        destinationLabel: "Madri",
      },
      wallet: {
        ...createAnaCase().wallet,
        data: { ...createAnaCase().wallet.data, travelerId: "client_bia" },
      },
      strategy: {
        ...createAnaCase().strategy,
        targetProgram: "Iberia Plus",
      },
      promotion: {
        ...createAnaCase().promotion,
        data: {
          ...createAnaCase().promotion.data,
          targetProgram: "Iberia Plus",
        },
      },
    };

    const outcome = applyPromotionEvent([ana, bia], promotionEvent());

    expect(outcome.matches.map((match) => match.caseId)).toEqual(["case_ana_lisbon"]);
    expect(outcome.matches[0]?.previous.result.decision).toBe("WAIT");
    expect(outcome.matches[0]?.updated.result.decision).toBe("USE_POINTS");
    expect(outcome.unmatchedCaseIds).toEqual(["case_bia_madrid"]);
  });

  it("gera alertas puros, estáveis e idempotentes por caso + evento", () => {
    const outcome = applyPromotionEvent([createAnaCase()], promotionEvent());
    const first = generatePromotionAlerts(outcome.matches);
    const repeatedWithoutState = generatePromotionAlerts(outcome.matches);
    const afterPersisting = generatePromotionAlerts(outcome.matches, first);

    expect(first).toHaveLength(1);
    expect(repeatedWithoutState).toEqual(first);
    expect(first[0]?.id).toBe("promotion:event_livelo_tap_90:case_ana_lisbon");
    expect(first[0]?.clientId).toBe("client_ana");
    expect(first[0]?.decision).toBe("USE_POINTS");
    expect(afterPersisting).toEqual([]);
  });
});
