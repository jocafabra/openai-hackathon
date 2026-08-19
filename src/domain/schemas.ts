import { z } from "zod";

const isoDate = z.string().min(10);
const nonNegativeInt = z.number().int().nonnegative();
const money = z.number().nonnegative();

export const travelerProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().min(8).max(30).optional(),
  travelStyle: z.enum(["economy", "balance", "comfort"]),
  comfortLevel: z.number().int().min(1).max(10),
  flexibility: z.enum(["low", "medium", "high"]),
  flexDays: nonNegativeInt,
  acceptsConnections: z.boolean(),
  preferredAirports: z.array(z.string().min(3)),
  maxConnections: nonNegativeInt,
  beginnerMode: z.boolean(),
});

export const travelRequestSchema = z.object({
  id: z.string().min(1),
  travelerId: z.string().min(1),
  origin: z.string().length(3),
  destination: z.string().length(3),
  destinationLabel: z.string().min(1),
  departureWindow: z.object({ start: isoDate, end: isoDate }),
  passengers: z.number().int().positive(),
  objective: z.enum(["economy", "balance", "comfort"]),
  budgetBRL: money.optional(),
  maxConnections: nonNegativeInt,
  missingFields: z.array(z.string()),
});

export const walletSchema = z.object({
  travelerId: z.string().min(1),
  balances: z.array(z.object({
    program: z.string().min(1),
    balance: nonNegativeInt,
    expiresAt: isoDate.nullable(),
    referenceValuePer1000BRL: money,
    updatedAt: isoDate,
  })),
  source: z.string().min(1),
});

const baseOfferSchema = z.object({
  id: z.string().min(1),
  passengers: z.number().int().positive(),
  connections: nonNegativeInt,
  available: z.boolean(),
  source: z.string().min(1),
  observedAt: isoDate,
});

export const offerSchema = z.discriminatedUnion("kind", [
  baseOfferSchema.extend({ kind: z.literal("cash"), totalBRL: money }),
  baseOfferSchema.extend({
    kind: z.literal("award"),
    program: z.string().min(1),
    miles: nonNegativeInt,
    taxesBRL: money,
    positioningFlightBRL: money,
  }),
  baseOfferSchema.extend({
    kind: z.literal("miles_broker"),
    program: z.string().min(1),
    miles: nonNegativeInt,
    pricePer1000BRL: money,
    taxesBRL: money,
    positioningFlightBRL: money,
    expiresAt: isoDate,
  }),
]);

export const transferPromotionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("TRANSFER_BONUS"),
  sourceProgram: z.string().min(1),
  targetProgram: z.string().min(1),
  bonusPercent: z.number().nonnegative(),
  startsAt: isoDate,
  endsAt: isoDate,
  source: z.string().min(1),
});

export const demoScenarioSchema = z.object({
  inputMessage: z.string().min(1),
  traveler: travelerProfileSchema,
  trip: travelRequestSchema,
  wallet: walletSchema,
  offers: z.array(offerSchema).min(3),
  initialPromotion: transferPromotionSchema,
  wowPromotion: transferPromotionSchema,
  strategy: z.object({
    sourceProgram: z.string().min(1),
    targetProgram: z.string().min(1),
    minimumBonusPercent: z.number().nonnegative(),
    plannedSourcePoints: nonNegativeInt,
    hasTimeToWait: z.boolean(),
  }),
});

export const profileExtractionSchema = z.object({
  travelerName: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureStart: z.string(),
  departureEnd: z.string(),
  passengers: z.number().int().positive(),
  objective: z.enum(["economy", "balance", "comfort"]),
  flexDays: z.number().int().nonnegative(),
  acceptsConnections: z.boolean(),
  walletBalances: z.array(z.object({ program: z.string(), balance: nonNegativeInt })),
  missingFields: z.array(z.string()),
  clarificationQuestions: z.array(z.string()).max(3),
});

export const strategyExplanationSchema = z.object({
  decision: z.string(),
  economy: z.string(),
  reason: z.string(),
  nextStep: z.string(),
});

const optionResultSchema = z.object({
  id: z.string(),
  kind: z.enum(["cash", "own_points", "miles_broker"]),
  label: z.string(),
  eligible: z.boolean(),
  cashOutlayBRL: money,
  economicCostBRL: money,
  savingsVsCashBRL: z.number(),
  complexity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  risk: z.enum(["low", "medium", "high"]),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  assumptions: z.array(z.string()),
  dataSource: z.string(),
  observedAt: z.string(),
  transfer: z.object({
    sourceProgram: z.string(),
    targetProgram: z.string(),
    sourcePoints: nonNegativeInt,
    bonusPercent: z.number().nonnegative(),
    resultingMiles: nonNegativeInt,
    plannedSourcePoints: nonNegativeInt,
    plannedResultingMiles: nonNegativeInt,
  }).optional(),
});

export const strategyResultSchema = z.object({
  decision: z.enum(["BUY_CASH", "USE_POINTS", "BUY_MILES", "WAIT", "REVIEW"]),
  action: z.enum(["EXECUTE", "WAIT", "ASK_USER", "NONE"]),
  confidence: z.enum(["low", "medium", "high"]),
  recommendedOptionId: z.string().optional(),
  summary: z.string(),
  options: z.array(optionResultSchema),
  nextStep: z.string(),
  watchCondition: z.object({
    id: z.string(),
    travelerId: z.string(),
    tripId: z.string(),
    condition: z.object({
      type: z.literal("TRANSFER_BONUS_AT_LEAST"),
      sourceProgram: z.string(),
      targetProgram: z.string(),
      thresholdPercent: z.number().nonnegative(),
    }),
    status: z.enum(["WATCHING", "MATCHED"]),
  }).optional(),
  beginnerSteps: z.array(z.string()),
  assumptions: z.array(z.string()),
  generatedAt: z.string(),
  dataMode: z.literal("mock"),
});
