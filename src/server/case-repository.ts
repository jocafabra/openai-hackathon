import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createDemoInput } from "@/data/demo";
import {
  applyPromotionEvent,
  evaluateOperationalCase,
  generatePromotionAlerts,
  type OperationalCase as DomainOperationalCase,
  type PromotionEvent,
} from "@/domain/operational";
import { offerSchema, transferPromotionSchema, travelRequestSchema, travelerProfileSchema, walletSchema } from "@/domain/schemas";
import type { StrategyInput, StrategyResult, TransferPromotion } from "@/domain/types";
import { query, tenantId, transaction } from "./db";

const strategyConfigSchema = z.object({
  sourceProgram: z.string().min(1),
  targetProgram: z.string().min(1),
  minimumBonusPercent: z.number().nonnegative(),
  plannedSourcePoints: z.number().int().nonnegative(),
  hasTimeToWait: z.boolean(),
});

export const strategyInputSchema = z.object({
  traveler: travelerProfileSchema,
  trip: travelRequestSchema,
  wallet: walletSchema,
  offers: z.array(offerSchema).min(1),
  promotion: transferPromotionSchema,
  strategy: strategyConfigSchema,
  now: z.string().min(10),
});

export const caseCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).default("ACTIVE"),
  dataMode: z.enum(["mock", "live"]).default("mock"),
  isMock: z.boolean().default(true),
  input: strategyInputSchema,
});

export const casePatchSchema = caseCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Envie ao menos um campo para atualizar.",
);

export const promotionEventSchema = transferPromotionSchema;

type CaseStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
type DataMode = "mock" | "live";

interface CaseRow {
  id: string;
  tenant_id: string;
  name: string;
  status: CaseStatus;
  data_mode: DataMode;
  is_mock: boolean;
  input: StrategyInput;
  latest_result: StrategyResult | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface OpportunityRow {
  id: string;
  tenant_id: string;
  case_id: string;
  case_name: string;
  promotion_event_id: string | null;
  dedupe_key: string;
  kind: string;
  status: "OPEN" | "DISMISSED" | "COMPLETED";
  title: string;
  summary: string;
  savings_brl: string | number | null;
  result: StrategyResult;
  event_source?: string | null;
  event_observed_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface OperationalCase {
  id: string;
  name: string;
  status: CaseStatus;
  dataMode: DataMode;
  isMock: boolean;
  input: StrategyInput;
  latestResult: StrategyResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  caseId: string;
  caseName: string;
  promotionEventId: string | null;
  kind: string;
  status: "OPEN" | "DISMISSED" | "COMPLETED";
  title: string;
  summary: string;
  savingsBRL: number | null;
  result: StrategyResult;
  source: string;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapCase(row: CaseRow): OperationalCase {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    dataMode: row.data_mode,
    isMock: row.is_mock,
    input: row.input,
    latestResult: row.latest_result,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    caseId: row.case_id,
    caseName: row.case_name,
    promotionEventId: row.promotion_event_id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    summary: row.summary,
    savingsBRL: row.savings_brl === null ? null : Number(row.savings_brl),
    result: row.result,
    source: row.event_source ?? "Motor MilesAI",
    observedAt: row.event_observed_at ? iso(row.event_observed_at) : iso(row.created_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function operationalCaseOf(
  id: string,
  input: StrategyInput,
  mode: "mock" | "live",
): DomainOperationalCase {
  return {
    id,
    client: input.traveler,
    trip: input.trip,
    wallet: {
      data: input.wallet,
      provenance: {
        mode,
        provider: input.wallet.source,
        observedAt: input.wallet.balances[0]?.updatedAt ?? input.now,
      },
    },
    offers: input.offers.map((offer) => ({
      data: offer,
      provenance: { mode, provider: offer.source, observedAt: offer.observedAt },
    })),
    promotion: {
      data: input.promotion,
      provenance: {
        mode,
        provider: input.promotion.source,
        observedAt: input.promotion.startsAt,
      },
    },
    strategy: input.strategy,
    now: input.now,
  };
}

function evaluateInput(
  id: string,
  input: StrategyInput,
  mode: "mock" | "live",
): StrategyResult {
  return evaluateOperationalCase(operationalCaseOf(id, input, mode)).result;
}

function secondSeedInput(): StrategyInput {
  const input = createDemoInput();
  input.traveler = {
    ...input.traveler,
    id: "traveler_ana_mock",
    name: "Ana (mock)",
    preferredAirports: ["REC", "GRU"],
  };
  input.trip = {
    ...input.trip,
    id: "trip_lisbon_mock",
    travelerId: input.traveler.id,
    origin: "REC",
    destination: "LIS",
    destinationLabel: "Lisboa, Portugal",
    departureWindow: { start: "2027-06-08", end: "2027-06-15" },
    passengers: 1,
  };
  input.wallet = {
    travelerId: input.traveler.id,
    source: "manual_mock_seed",
    balances: [{
      program: "Smiles",
      balance: 150_000,
      expiresAt: null,
      referenceValuePer1000BRL: 16,
      updatedAt: input.now,
    }],
  };
  input.offers = input.offers.map((offer) => ({
    ...offer,
    passengers: 1,
    source: "mock_operational_seed",
    ...(offer.kind === "cash" ? { id: "cash_rec_lis", totalBRL: 4_900 } : {}),
    ...(offer.kind === "award" ? { id: "award_rec_lis", program: "Flying Blue", miles: 80_000 } : {}),
    ...(offer.kind === "miles_broker" ? { id: "broker_rec_lis", program: "Flying Blue", miles: 80_000 } : {}),
  }));
  input.promotion = {
    ...input.promotion,
    id: "promo_smiles_flyingblue_mock_20",
    sourceProgram: "Smiles",
    targetProgram: "Flying Blue",
    bonusPercent: 20,
    source: "mock_operational_seed",
  };
  input.strategy = {
    sourceProgram: "Smiles",
    targetProgram: "Flying Blue",
    minimumBonusPercent: 70,
    plannedSourcePoints: 70_000,
    hasTimeToWait: true,
  };
  return strategyInputSchema.parse(input) as StrategyInput;
}

export async function seedCasesIfEmpty(): Promise<void> {
  const tenant = tenantId();
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [812_026_820]);
    const existing = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM cases WHERE tenant_id = $1",
      [tenant],
    );
    if (Number(existing.rows[0]?.count ?? 0) > 0) return;

    const seeds = [
      { name: "João · Roma · maio/2027 (mock)", input: createDemoInput() },
      { name: "Ana · Lisboa · junho/2027 (mock)", input: secondSeedInput() },
    ];
    for (const seed of seeds) {
      const input = strategyInputSchema.parse(seed.input) as StrategyInput;
      const id = randomUUID();
      const result = evaluateInput(id, input, "mock");
      await client.query(
        `INSERT INTO cases (id, tenant_id, name, status, data_mode, is_mock, input, latest_result)
         VALUES ($1, $2, $3, 'ACTIVE', 'mock', true, $4::jsonb, $5::jsonb)`,
        [id, tenant, seed.name, JSON.stringify(input), JSON.stringify(result)],
      );
    }
  });
}

export async function listCases(options: { status?: CaseStatus } = {}): Promise<OperationalCase[]> {
  await seedCasesIfEmpty();
  const tenant = tenantId();
  const result = options.status
    ? await query<CaseRow>(
      "SELECT * FROM cases WHERE tenant_id = $1 AND status = $2 ORDER BY updated_at DESC",
      [tenant, options.status],
    )
    : await query<CaseRow>(
      "SELECT * FROM cases WHERE tenant_id = $1 ORDER BY updated_at DESC",
      [tenant],
    );
  return result.rows.map(mapCase);
}

export async function getCase(id: string): Promise<OperationalCase | null> {
  await seedCasesIfEmpty();
  const result = await query<CaseRow>(
    "SELECT * FROM cases WHERE tenant_id = $1 AND id = $2",
    [tenantId(), id],
  );
  return result.rows[0] ? mapCase(result.rows[0]) : null;
}

export async function createCase(raw: unknown): Promise<OperationalCase> {
  const data = caseCreateSchema.parse(raw);
  await seedCasesIfEmpty();
  const input = data.input as StrategyInput;
  const id = randomUUID();
  const result = evaluateInput(id, input, data.dataMode);
  const created = await query<CaseRow>(
    `INSERT INTO cases (id, tenant_id, name, status, data_mode, is_mock, input, latest_result)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
     RETURNING *`,
    [id, tenantId(), data.name, data.status, data.dataMode, data.isMock, JSON.stringify(input), JSON.stringify(result)],
  );
  return mapCase(created.rows[0]);
}

export async function updateCase(id: string, raw: unknown): Promise<OperationalCase | null> {
  const patch = casePatchSchema.parse(raw);
  const current = await getCase(id);
  if (!current) return null;
  const input = (patch.input ?? current.input) as StrategyInput;
  const nextMode = patch.dataMode ?? current.dataMode;
  const latest = patch.input || patch.dataMode
    ? evaluateInput(id, input, nextMode)
    : current.latestResult;
  const updated = await query<CaseRow>(
    `UPDATE cases SET
       name = $3,
       status = $4,
       data_mode = $5,
       is_mock = $6,
       input = $7::jsonb,
       latest_result = $8::jsonb,
       updated_at = now()
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId(), id,
      patch.name ?? current.name,
      patch.status ?? current.status,
      patch.dataMode ?? current.dataMode,
      patch.isMock ?? current.isMock,
      JSON.stringify(input),
      latest ? JSON.stringify(latest) : null,
    ],
  );
  return updated.rows[0] ? mapCase(updated.rows[0]) : null;
}

export async function deleteCase(id: string): Promise<boolean> {
  const result = await query(
    "DELETE FROM cases WHERE tenant_id = $1 AND id = $2",
    [tenantId(), id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function evaluateCase(
  id: string,
  trigger: "MANUAL" | "MONITOR" = "MANUAL",
): Promise<{ case: OperationalCase; result: StrategyResult; runId: string } | null> {
  const current = await getCase(id);
  if (!current) return null;
  const result = evaluateInput(id, current.input, current.dataMode);
  const runId = randomUUID();
  const runKey = `${trigger.toLowerCase()}:${randomUUID()}`;
  const updated = await transaction(async (client) => {
    await client.query(
      `INSERT INTO strategy_runs (id, tenant_id, case_id, trigger, run_key, input_snapshot, result)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [runId, tenantId(), id, trigger, runKey, JSON.stringify(current.input), JSON.stringify(result)],
    );
    const saved = await client.query<CaseRow>(
      `UPDATE cases SET latest_result = $3::jsonb, updated_at = now()
       WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [tenantId(), id, JSON.stringify(result)],
    );
    return saved.rows[0];
  });
  return { case: mapCase(updated), result, runId };
}

function bestSavings(result: StrategyResult): number | null {
  const recommended = result.options.find((option) => option.id === result.recommendedOptionId);
  return recommended ? Math.max(0, recommended.savingsVsCashBRL) : null;
}

export interface PromotionProcessingResult {
  event: TransferPromotion;
  duplicateEvent: boolean;
  checkedCases: number;
  matchedCases: number;
  createdOpportunities: number;
  opportunities: Opportunity[];
}

export async function processPromotionEvent(raw: unknown): Promise<PromotionProcessingResult> {
  const event = promotionEventSchema.parse(raw) as TransferPromotion;
  await seedCasesIfEmpty();
  const tenant = tenantId();
  return transaction(async (client) => {
    const eventId = randomUUID();
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO promotion_events (id, tenant_id, external_id, payload, observed_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (tenant_id, external_id) DO NOTHING
       RETURNING id`,
      [eventId, tenant, event.id, JSON.stringify(event), event.startsAt],
    );
    const duplicateEvent = inserted.rowCount === 0;
    const storedEvent = inserted.rows[0] ?? (await client.query<{ id: string }>(
      "SELECT id FROM promotion_events WHERE tenant_id = $1 AND external_id = $2",
      [tenant, event.id],
    )).rows[0];

    const cases = await client.query<CaseRow>(
      "SELECT * FROM cases WHERE tenant_id = $1 AND status = 'ACTIVE' ORDER BY updated_at DESC",
      [tenant],
    );
    const activeCases = cases.rows.map(mapCase);
    const eventMode = /serpapi|duffel|amadeus|skyscanner/i.test(event.source) ? "live" : "mock";
    const promotionEvent: PromotionEvent = {
      id: event.id,
      promotion: event,
      provenance: {
        mode: eventMode,
        provider: event.source,
        observedAt: event.startsAt,
      },
      occurredAt: event.startsAt,
    };
    const application = applyPromotionEvent(
      activeCases.map((current) => operationalCaseOf(current.id, current.input, current.dataMode)),
      promotionEvent,
    );
    const byId = new Map(activeCases.map((current) => [current.id, current]));
    const alerts = generatePromotionAlerts(application.matches)
      .filter((alert) => alert.decision === "USE_POINTS");
    const opportunities: Opportunity[] = [];
    let createdOpportunities = 0;

    for (const alert of alerts) {
      const current = byId.get(alert.caseId);
      const match = application.matches.find((item) => item.caseId === alert.caseId);
      if (!current || !match) continue;
      const updatedInput: StrategyInput = { ...current.input, promotion: event };
      const result = match.updated.result;
      const runKey = `promotion:${event.id}`;
      const run = await client.query<{ id: string }>(
        `INSERT INTO strategy_runs
           (id, tenant_id, case_id, promotion_event_id, trigger, run_key, input_snapshot, result)
         VALUES ($1, $2, $3, $4, 'PROMOTION', $5, $6::jsonb, $7::jsonb)
         ON CONFLICT (case_id, run_key) DO NOTHING
         RETURNING id`,
        [randomUUID(), tenant, current.id, storedEvent.id, runKey, JSON.stringify(updatedInput), JSON.stringify(result)],
      );

      if ((run.rowCount ?? 0) > 0) {
        await client.query(
          `UPDATE cases SET input = $3::jsonb, latest_result = $4::jsonb, updated_at = now()
           WHERE tenant_id = $1 AND id = $2`,
          [tenant, current.id, JSON.stringify(updatedInput), JSON.stringify(result)],
        );
      }

      const dedupeKey = `${current.id}:promotion:${event.id}`;
      const opportunity = await client.query<OpportunityRow>(
        `INSERT INTO opportunities
           (id, tenant_id, case_id, promotion_event_id, dedupe_key, title, summary, savings_brl, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         ON CONFLICT (tenant_id, dedupe_key) DO NOTHING
         RETURNING opportunities.*, $10::text AS case_name`,
        [
          randomUUID(), tenant, current.id, storedEvent.id, dedupeKey,
          `Bônus de ${event.bonusPercent}% para ${current.input.traveler.name}`,
          result.summary,
          bestSavings(result),
          JSON.stringify(result),
          current.name,
        ],
      );
      if (opportunity.rows[0]) {
        createdOpportunities += 1;
        opportunities.push(mapOpportunity(opportunity.rows[0]));
      }
    }

    return {
      event,
      duplicateEvent,
      checkedCases: cases.rowCount ?? 0,
      matchedCases: application.matches.length,
      createdOpportunities,
      opportunities,
    };
  });
}

export async function listOpportunities(
  status?: "OPEN" | "DISMISSED" | "COMPLETED",
): Promise<Opportunity[]> {
  await seedCasesIfEmpty();
  const values: unknown[] = [tenantId()];
  const statusFilter = status ? "AND o.status = $2" : "";
  if (status) values.push(status);
  const result = await query<OpportunityRow>(
    `SELECT o.*, c.name AS case_name,
            pe.payload->>'source' AS event_source,
            pe.observed_at AS event_observed_at
     FROM opportunities o
     JOIN cases c ON c.id = o.case_id
     LEFT JOIN promotion_events pe ON pe.id = o.promotion_event_id
     WHERE o.tenant_id = $1 ${statusFilter}
     ORDER BY o.created_at DESC`,
    values,
  );
  return result.rows.map(mapOpportunity);
}

export async function runMonitor(rawEvents?: unknown[]): Promise<{
  processedEvents: number;
  matchedCases: number;
  createdOpportunities: number;
  results: PromotionProcessingResult[];
}> {
  const events = rawEvents ?? [];
  const results: PromotionProcessingResult[] = [];
  for (const event of events) {
    results.push(await processPromotionEvent(event));
  }
  return {
    processedEvents: results.length,
    matchedCases: results.reduce((sum, result) => sum + result.matchedCases, 0),
    createdOpportunities: results.reduce((sum, result) => sum + result.createdOpportunities, 0),
    results,
  };
}
