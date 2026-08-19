import { z } from "zod";
import {
  offerSchema,
  transferPromotionSchema,
  travelRequestSchema,
  travelerProfileSchema,
  walletSchema,
} from "./schemas";
import { calculateStrategy } from "./strategy-engine";
import type {
  Offer,
  StrategyInput,
  StrategyResult,
  TransferPromotion,
  TravelRequest,
  TravelerProfile,
  Wallet,
} from "./types";

/** Identifies whether a datum is demonstrative or came from an external source. */
export interface OperationalProvenance {
  mode: "mock" | "live";
  provider: string;
  observedAt: string;
}

export interface SourcedValue<T> {
  data: T;
  provenance: OperationalProvenance;
}

export interface OperationalStrategy {
  sourceProgram: string;
  targetProgram: string;
  minimumBonusPercent: number;
  plannedSourcePoints: number;
  hasTimeToWait: boolean;
}

/**
 * Complete, provider-independent input owned by the operational application.
 * Every volatile datum carries provenance instead of relying on fixture names.
 */
export interface OperationalCase {
  id: string;
  client: TravelerProfile;
  trip: TravelRequest;
  wallet: SourcedValue<Wallet>;
  offers: Array<SourcedValue<Offer>>;
  promotion: SourcedValue<TransferPromotion>;
  strategy: OperationalStrategy;
  now: string;
}

export type OperationalDataMode = "mock" | "live" | "mixed" | "unknown";

export type OperationalValidation =
  | { valid: true; value: OperationalCase; issues: [] }
  | { valid: false; issues: string[] };

export interface OperationalEvaluation {
  caseId: string;
  clientId: string;
  validation: OperationalValidation;
  result: StrategyResult;
  dataMode: OperationalDataMode;
  provenance: {
    wallet?: OperationalProvenance;
    offers: OperationalProvenance[];
    promotion?: OperationalProvenance;
  };
}

export interface PromotionEvent {
  id: string;
  promotion: TransferPromotion;
  provenance: OperationalProvenance;
  occurredAt: string;
}

export interface PromotionCaseMatch {
  eventId: string;
  caseId: string;
  clientId: string;
  previous: OperationalEvaluation;
  updated: OperationalEvaluation;
}

export interface PromotionApplication {
  event: PromotionEvent;
  matches: PromotionCaseMatch[];
  unmatchedCaseIds: string[];
}

export interface OperationalAlert {
  id: string;
  dedupeKey: string;
  kind: "PROMOTION_MATCHED";
  eventId: string;
  caseId: string;
  clientId: string;
  decision: StrategyResult["decision"];
  title: string;
  message: string;
  createdAt: string;
  provenance: OperationalProvenance;
}

const isoDate = z.string().min(10);
const provenanceSchema = z.object({
  mode: z.enum(["mock", "live"]),
  provider: z.string().min(1),
  observedAt: isoDate,
});

const sourcedWalletSchema = z.object({
  data: walletSchema,
  provenance: provenanceSchema,
});

const sourcedOfferSchema = z.object({
  data: offerSchema,
  provenance: provenanceSchema,
});

const sourcedPromotionSchema = z.object({
  data: transferPromotionSchema,
  provenance: provenanceSchema,
});

const operationalStrategySchema = z.object({
  sourceProgram: z.string().min(1),
  targetProgram: z.string().min(1),
  minimumBonusPercent: z.number().nonnegative(),
  plannedSourcePoints: z.number().int().nonnegative(),
  hasTimeToWait: z.boolean(),
});

const operationalCaseSchema = z.object({
  id: z.string().min(1),
  client: travelerProfileSchema,
  trip: travelRequestSchema,
  wallet: sourcedWalletSchema,
  offers: z.array(sourcedOfferSchema),
  promotion: sourcedPromotionSchema,
  strategy: operationalStrategySchema,
  now: isoDate,
}).superRefine((operationalCase, context) => {
  if (operationalCase.trip.travelerId !== operationalCase.client.id) {
    context.addIssue({
      code: "custom",
      path: ["trip", "travelerId"],
      message: "trip.travelerId deve pertencer ao cliente do caso",
    });
  }
  if (operationalCase.wallet.data.travelerId !== operationalCase.client.id) {
    context.addIssue({
      code: "custom",
      path: ["wallet", "data", "travelerId"],
      message: "wallet.travelerId deve pertencer ao cliente do caso",
    });
  }
});

const promotionEventSchema = z.object({
  id: z.string().min(1),
  promotion: transferPromotionSchema,
  provenance: provenanceSchema,
  occurredAt: isoDate,
});

function issueText(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}

export function validateOperationalCase(rawCase: unknown): OperationalValidation {
  const parsed = operationalCaseSchema.safeParse(rawCase);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map(issueText),
    };
  }

  return {
    valid: true,
    value: parsed.data as OperationalCase,
    issues: [],
  };
}

function dataModeOf(operationalCase: OperationalCase): OperationalDataMode {
  const modes = new Set([
    operationalCase.wallet.provenance.mode,
    operationalCase.promotion.provenance.mode,
    ...operationalCase.offers.map((offer) => offer.provenance.mode),
  ]);
  if (modes.size === 0) return "unknown";
  if (modes.size > 1) return "mixed";
  return modes.has("live") ? "live" : "mock";
}

/** Converts the operational aggregate without introducing fixture defaults. */
export function toStrategyInput(rawCase: unknown): StrategyInput {
  const validation = validateOperationalCase(rawCase);
  if (!validation.valid) {
    throw new Error(`Caso operacional inválido: ${validation.issues.join("; ")}`);
  }

  const operationalCase = validation.value;
  return {
    traveler: operationalCase.client,
    trip: operationalCase.trip,
    wallet: operationalCase.wallet.data,
    offers: operationalCase.offers.map((offer) => offer.data),
    promotion: operationalCase.promotion.data,
    strategy: operationalCase.strategy,
    now: operationalCase.now,
  };
}

function invalidReview(issues: string[], now: string): StrategyResult {
  return {
    decision: "REVIEW",
    action: "ASK_USER",
    confidence: "low",
    summary: "O caso possui dados inválidos ou incompletos.",
    options: [],
    nextStep: `Corrija: ${issues.join(", ")}.`,
    beginnerSteps: [],
    assumptions: ["Nenhuma recomendação foi calculada com dados estruturalmente inválidos."],
    generatedAt: now,
    dataMode: "mock",
  };
}

/** Validates and evaluates one case while preserving source provenance beside the legacy result. */
export function evaluateOperationalCase(rawCase: unknown): OperationalEvaluation {
  const validation = validateOperationalCase(rawCase);
  if (!validation.valid) {
    const candidate = rawCase && typeof rawCase === "object"
      ? rawCase as Record<string, unknown>
      : {};
    const client = candidate.client && typeof candidate.client === "object"
      ? candidate.client as Record<string, unknown>
      : {};
    const now = typeof candidate.now === "string" ? candidate.now : new Date(0).toISOString();
    return {
      caseId: typeof candidate.id === "string" ? candidate.id : "invalid_case",
      clientId: typeof client.id === "string" ? client.id : "unknown_client",
      validation,
      result: invalidReview(validation.issues, now),
      dataMode: "unknown",
      provenance: { offers: [] },
    };
  }

  const operationalCase = validation.value;
  return {
    caseId: operationalCase.id,
    clientId: operationalCase.client.id,
    validation,
    result: calculateStrategy(toStrategyInput(operationalCase)),
    dataMode: dataModeOf(operationalCase),
    provenance: {
      wallet: operationalCase.wallet.provenance,
      offers: operationalCase.offers.map((offer) => offer.provenance),
      promotion: operationalCase.promotion.provenance,
    },
  };
}

function eventMatchesCase(
  operationalCase: OperationalCase,
  event: PromotionEvent,
  previous: OperationalEvaluation,
): boolean {
  const condition = previous.result.watchCondition?.condition;
  const now = new Date(operationalCase.now).getTime();
  return Boolean(
    condition
    && event.promotion.sourceProgram === condition.sourceProgram
    && event.promotion.targetProgram === condition.targetProgram
    && event.promotion.bonusPercent >= condition.thresholdPercent
    && new Date(event.promotion.startsAt).getTime() <= now
    && new Date(event.promotion.endsAt).getTime() >= now,
  );
}

/** Applies one feed event to every compatible watch without mutating any case. */
export function applyPromotionEvent(
  rawCases: readonly OperationalCase[],
  rawEvent: PromotionEvent,
): PromotionApplication {
  const event = promotionEventSchema.parse(rawEvent) as PromotionEvent;
  const matches: PromotionCaseMatch[] = [];
  const unmatchedCaseIds: string[] = [];

  for (const rawCase of rawCases) {
    const validation = validateOperationalCase(rawCase);
    if (!validation.valid) {
      unmatchedCaseIds.push(rawCase.id);
      continue;
    }

    const operationalCase = validation.value;
    const previous = evaluateOperationalCase(operationalCase);
    if (!eventMatchesCase(operationalCase, event, previous)) {
      unmatchedCaseIds.push(operationalCase.id);
      continue;
    }

    const updatedCase: OperationalCase = {
      ...operationalCase,
      promotion: {
        data: event.promotion,
        provenance: event.provenance,
      },
    };
    matches.push({
      eventId: event.id,
      caseId: operationalCase.id,
      clientId: operationalCase.client.id,
      previous,
      updated: evaluateOperationalCase(updatedCase),
    });
  }

  return { event, matches, unmatchedCaseIds };
}

function alertId(match: PromotionCaseMatch): string {
  return `promotion:${match.eventId}:${match.caseId}`;
}

/**
 * Produces stable alerts. Passing previously persisted alerts makes retries return
 * only new records, while repeated stateless calls remain byte-for-byte equal.
 */
export function generatePromotionAlerts(
  matches: readonly PromotionCaseMatch[],
  existing: readonly OperationalAlert[] = [],
): OperationalAlert[] {
  const known = new Set(existing.flatMap((alert) => [alert.id, alert.dedupeKey]));
  const generated = new Map<string, OperationalAlert>();

  for (const match of matches) {
    const id = alertId(match);
    if (known.has(id) || generated.has(id)) continue;

    const provenance = match.updated.provenance.promotion;
    if (!provenance) continue;
    generated.set(id, {
      id,
      dedupeKey: id,
      kind: "PROMOTION_MATCHED",
      eventId: match.eventId,
      caseId: match.caseId,
      clientId: match.clientId,
      decision: match.updated.result.decision,
      title: "Promoção compatível encontrada",
      message: match.updated.result.summary,
      createdAt: provenance.observedAt,
      provenance,
    });
  }

  return [...generated.values()];
}
