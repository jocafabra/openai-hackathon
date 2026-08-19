export type Decision = "BUY_CASH" | "USE_POINTS" | "BUY_MILES" | "WAIT" | "REVIEW";
export type StrategyAction = "EXECUTE" | "WAIT" | "ASK_USER" | "NONE";
export type Confidence = "low" | "medium" | "high";
export type Risk = "low" | "medium" | "high";

export interface TravelerProfile {
  id: string;
  name: string;
  travelStyle: "economy" | "balance" | "comfort";
  comfortLevel: number;
  flexibility: "low" | "medium" | "high";
  flexDays: number;
  acceptsConnections: boolean;
  preferredAirports: string[];
  maxConnections: number;
  beginnerMode: boolean;
}

export interface TravelRequest {
  id: string;
  travelerId: string;
  origin: string;
  destination: string;
  destinationLabel: string;
  departureWindow: { start: string; end: string };
  passengers: number;
  objective: "economy" | "balance" | "comfort";
  budgetBRL?: number;
  maxConnections: number;
  missingFields: string[];
}

export interface WalletBalance {
  program: string;
  balance: number;
  expiresAt: string | null;
  referenceValuePer1000BRL: number;
  updatedAt: string;
}

export interface Wallet {
  travelerId: string;
  balances: WalletBalance[];
  source: string;
}

interface BaseOffer {
  id: string;
  passengers: number;
  connections: number;
  available: boolean;
  source: string;
  observedAt: string;
}

export interface CashOffer extends BaseOffer {
  kind: "cash";
  totalBRL: number;
}

export interface AwardOffer extends BaseOffer {
  kind: "award";
  program: string;
  miles: number;
  taxesBRL: number;
  positioningFlightBRL: number;
}

export interface MilesBrokerOffer extends BaseOffer {
  kind: "miles_broker";
  program: string;
  miles: number;
  pricePer1000BRL: number;
  taxesBRL: number;
  positioningFlightBRL: number;
  expiresAt: string;
}

export type Offer = CashOffer | AwardOffer | MilesBrokerOffer;

export interface TransferPromotion {
  id: string;
  type: "TRANSFER_BONUS";
  sourceProgram: string;
  targetProgram: string;
  bonusPercent: number;
  startsAt: string;
  endsAt: string;
  source: string;
}

export interface WatchCondition {
  id: string;
  travelerId: string;
  tripId: string;
  condition: {
    type: "TRANSFER_BONUS_AT_LEAST";
    sourceProgram: string;
    targetProgram: string;
    thresholdPercent: number;
  };
  status: "WATCHING" | "MATCHED";
}

export interface TransferCalculation {
  sourceProgram: string;
  targetProgram: string;
  sourcePoints: number;
  bonusPercent: number;
  resultingMiles: number;
  plannedSourcePoints: number;
  plannedResultingMiles: number;
}

export interface OptionResult {
  id: string;
  kind: "cash" | "own_points" | "miles_broker";
  label: string;
  eligible: boolean;
  cashOutlayBRL: number;
  economicCostBRL: number;
  savingsVsCashBRL: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  risk: Risk;
  score: number;
  reasons: string[];
  assumptions: string[];
  dataSource: string;
  observedAt: string;
  transfer?: TransferCalculation;
}

export interface StrategyResult {
  decision: Decision;
  action: StrategyAction;
  confidence: Confidence;
  recommendedOptionId?: string;
  summary: string;
  options: OptionResult[];
  nextStep: string;
  watchCondition?: WatchCondition;
  beginnerSteps: string[];
  assumptions: string[];
  generatedAt: string;
  dataMode: "mock";
}

export interface DemoScenario {
  inputMessage: string;
  traveler: TravelerProfile;
  trip: TravelRequest;
  wallet: Wallet;
  offers: Offer[];
  initialPromotion: TransferPromotion;
  wowPromotion: TransferPromotion;
  strategy: {
    sourceProgram: string;
    targetProgram: string;
    minimumBonusPercent: number;
    plannedSourcePoints: number;
    hasTimeToWait: boolean;
  };
}

export interface StrategyInput {
  traveler: TravelerProfile;
  trip: TravelRequest;
  wallet: Wallet;
  offers: Offer[];
  promotion: TransferPromotion;
  strategy: DemoScenario["strategy"];
  now: string;
}

export interface PromotionReplayResult {
  matched: boolean;
  previous: StrategyResult;
  updated: StrategyResult;
  event: TransferPromotion;
  affectedTravelerIds: string[];
}

