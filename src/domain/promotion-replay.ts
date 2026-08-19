import { calculateStrategy } from "./strategy-engine";
import type { PromotionReplayResult, StrategyInput, TransferPromotion } from "./types";

export function replayPromotionEvent(
  initialInput: StrategyInput,
  event: TransferPromotion,
): PromotionReplayResult {
  const previous = calculateStrategy(initialInput);
  const condition = previous.watchCondition?.condition;
  const matched = Boolean(
    condition
    && event.type === "TRANSFER_BONUS"
    && event.sourceProgram === condition.sourceProgram
    && event.targetProgram === condition.targetProgram
    && event.bonusPercent >= condition.thresholdPercent,
  );
  const updated = matched
    ? calculateStrategy({ ...initialInput, promotion: event })
    : previous;

  return {
    matched,
    previous,
    updated,
    event,
    affectedTravelerIds: matched && updated.action === "EXECUTE"
      ? [initialInput.traveler.id]
      : [],
  };
}

