import { describe, expect, it } from "vitest";
import { createDemoInput, demoScenario } from "@/data/demo";
import { replayPromotionEvent } from "@/domain/promotion-replay";

describe("replay de promoção", () => {
  it("casa o evento com a condição e muda WAIT para EXECUTE", () => {
    const replay = replayPromotionEvent(createDemoInput(), demoScenario.wowPromotion);

    expect(replay.matched).toBe(true);
    expect(replay.previous.decision).toBe("WAIT");
    expect(replay.updated.decision).toBe("USE_POINTS");
    expect(replay.updated.action).toBe("EXECUTE");
    expect(replay.affectedTravelerIds).toEqual(["traveler_joao"]);
  });

  it("ignora promoção que não corresponde ao programa monitorado", () => {
    const event = { ...demoScenario.wowPromotion, targetProgram: "Smiles" };
    const replay = replayPromotionEvent(createDemoInput(), event);

    expect(replay.matched).toBe(false);
    expect(replay.updated.decision).toBe("WAIT");
    expect(replay.affectedTravelerIds).toEqual([]);
  });
});

