import { NextResponse } from "next/server";
import { createDemoInput, demoScenario } from "@/data/demo";
import { replayPromotionEvent } from "@/domain/promotion-replay";
import { fallbackExplanation } from "@/server/fallback";

export async function POST() {
  const replay = replayPromotionEvent(createDemoInput(), demoScenario.wowPromotion);
  return NextResponse.json({
    ...replay,
    explanation: fallbackExplanation(replay.updated),
  });
}

