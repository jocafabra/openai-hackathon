"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./MilesAIDashboard.module.css";

type JsonObject = Record<string, unknown>;
type DataMode = "live" | "mock" | "manual";

type DashboardCase = {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  mode: DataMode;
  origin: string;
  destination: string;
  destinationLabel: string;
  departureDate?: string;
  returnDate?: string;
  passengers: number;
  program: string;
  balance: number;
  walletUpdatedAt?: string;
  walletExpiresAt?: string;
  updatedAt?: string;
};

type DashboardOpportunity = {
  id: string;
  caseId?: string;
  clientName: string;
  title: string;
  summary: string;
  status: "OPEN" | "DISMISSED" | "COMPLETED";
  savingsBRL?: number;
  mode: DataMode;
  observedAt?: string;
  updatedAt?: string;
};

type DashboardAction = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: "urgent" | "attention" | "calm";
  cta: string;
  run?: () => void;
};

export type MilesAIDashboardProps = {
  /** Dados da API `/api/cases`. Se omitidos, o dashboard tenta buscá-los. */
  cases?: readonly unknown[];
  /** Dados da API `/api/opportunities`. Se omitidos, o dashboard tenta buscá-los. */
  opportunities?: readonly unknown[];
  loading?: boolean;
  error?: string | null;
  onCreateCase?: () => void;
  onOpenCase?: (caseId: string) => void;
  onOpenOpportunities?: () => void;
  onOpenFlights?: (caseId?: string) => void;
  onRefresh?: () => void | Promise<void>;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectAt(value: unknown, key: string): JsonObject {
  return isObject(value) && isObject(value[key]) ? value[key] as JsonObject : {};
}

function textValue(...values: unknown[]): string {
  const value = values.find((item) => typeof item === "string" && item.trim());
  return typeof value === "string" ? value : "";
}

function numberValue(...values: unknown[]): number {
  const value = values.find((item) => typeof item === "number" && Number.isFinite(item));
  return typeof value === "number" ? value : 0;
}

function listAt(value: unknown, key: string): unknown[] {
  return isObject(value) && Array.isArray(value[key]) ? value[key] as unknown[] : [];
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function modeOf(root: JsonObject, source = ""): DataMode {
  const raw = textValue(root.dataMode, root.mode).toLowerCase();
  if (raw === "live") return "live";
  if (raw === "manual" || /manual|agente/i.test(source)) return "manual";
  return "mock";
}

function normalizeCase(value: unknown, index: number): DashboardCase {
  const root = isObject(value) ? value : {};
  const input = objectAt(root, "input");
  const traveler = objectAt(input, "traveler");
  const trip = objectAt(input, "trip");
  const window = objectAt(trip, "departureWindow");
  const wallet = objectAt(input, "wallet");
  const balances = listAt(wallet, "balances");
  const firstBalance = isObject(balances[0]) ? balances[0] : {};
  const source = textValue(wallet.source, root.source);
  const rawStatus = textValue(root.status).toUpperCase();

  return {
    id: textValue(root.id, root.caseId) || `case-${index}`,
    name: textValue(root.name, traveler.name) || "Cliente sem nome",
    status: rawStatus === "PAUSED" || rawStatus === "ARCHIVED" ? rawStatus : "ACTIVE",
    mode: modeOf(root, source),
    origin: textValue(root.origin, trip.origin).toUpperCase() || "—",
    destination: textValue(root.destination, trip.destination).toUpperCase() || "—",
    destinationLabel: textValue(trip.destinationLabel, root.destinationLabel),
    departureDate: textValue(root.departureDate, trip.departureDate, window.start) || undefined,
    returnDate: textValue(root.returnDate, trip.returnDate) || undefined,
    passengers: numberValue(root.passengers, trip.passengers) || 1,
    program: textValue(root.program, firstBalance.program, wallet.program) || "Carteira não informada",
    balance: numberValue(root.balance, firstBalance.balance, wallet.balance),
    walletUpdatedAt: textValue(firstBalance.updatedAt, wallet.updatedAt) || undefined,
    walletExpiresAt: textValue(firstBalance.expiresAt, wallet.expiresAt) || undefined,
    updatedAt: textValue(root.updatedAt, root.createdAt) || undefined,
  };
}

function normalizeOpportunity(value: unknown, index: number): DashboardOpportunity {
  const root = isObject(value) ? value : {};
  const result = objectAt(root, "result");
  const source = textValue(root.source, result.dataSource);
  const rawStatus = textValue(root.status).toUpperCase();
  return {
    id: textValue(root.id, root.opportunityId) || `opportunity-${index}`,
    caseId: textValue(root.caseId, root.tripId) || undefined,
    clientName: textValue(root.caseName, root.clientName, root.travelerName) || "Cliente",
    title: textValue(root.title, result.summary) || "Nova condição detectada",
    summary: textValue(root.summary, root.description, result.nextStep) || "Revise a condição antes de executar.",
    status: rawStatus === "DISMISSED" || rawStatus === "COMPLETED" ? rawStatus : "OPEN",
    savingsBRL: numberValue(root.savingsBRL, root.savingsVsCashBRL) || undefined,
    mode: modeOf(root, source),
    observedAt: textValue(root.observedAt, root.createdAt) || undefined,
    updatedAt: textValue(root.updatedAt, root.createdAt) || undefined,
  };
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, endValue?: string): number | null {
  const end = parseDate(endValue);
  if (!end) return null;
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
}

function formatDate(value?: string, includeYear = false): string {
  const date = parseDate(value);
  if (!date) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function formatRelativeDate(value: string | undefined, now: Date | null): string {
  if (!now) return formatDate(value);
  const days = daysBetween(now, value);
  if (days === null) return "Data não informada";
  if (days < 0) return "Viagem iniciada";
  if (days === 0) return "Embarque hoje";
  if (days === 1) return "Embarque amanhã";
  return `Em ${days} dias`;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function initials(name: string): string {
  const cleanName = name.replace(/\s*\(mock\)\s*/gi, " ").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "M"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function withoutMockSuffix(name: string): string {
  return name.replace(/\s*\(mock\)\s*/gi, "").trim();
}

function ModeBadge({ mode }: { mode: DataMode }) {
  const label = mode === "live" ? "Live" : mode === "manual" ? "Manual" : "Mock";
  return <span className={`${styles.modeBadge} ${styles[`mode_${mode}`]}`}><i />{label}</span>;
}

function Icon({ name }: { name: "spark" | "route" | "wallet" | "bell" | "clock" | "arrow" | "refresh" | "plus" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m5.6 5.6 2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8"/></>,
    route: <><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17c5 0 3-10 10-10"/></>,
    wallet: <><path d="M4 7.5h15v11H4z"/><path d="M4 9V6a2 2 0 0 1 2-2h10v3.5M15 12h4"/><circle cx="15" cy="12" r=".6"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 20h4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    refresh: <><path d="M19 7v5h-5"/><path d="M18 12a7 7 0 1 1-2-5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

async function fetchList(path: string): Promise<unknown[]> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Falha ao carregar dados operacionais.");
  return unwrapList(await response.json());
}

export function MilesAIDashboard({
  cases: casesProp,
  opportunities: opportunitiesProp,
  loading = false,
  error,
  onCreateCase,
  onOpenCase,
  onOpenOpportunities,
  onOpenFlights,
  onRefresh,
}: MilesAIDashboardProps) {
  const [fetchedCases, setFetchedCases] = useState<unknown[]>([]);
  const [fetchedOpportunities, setFetchedOpportunities] = useState<unknown[]>([]);
  const [fetching, setFetching] = useState(() => casesProp === undefined || opportunitiesProp === undefined);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const loadMissingData = useCallback(async () => {
    const shouldFetchCases = casesProp === undefined;
    const shouldFetchOpportunities = opportunitiesProp === undefined;
    if (!shouldFetchCases && !shouldFetchOpportunities) return;

    const [casesResult, opportunitiesResult] = await Promise.allSettled([
      shouldFetchCases ? fetchList("/api/cases") : Promise.resolve([]),
      shouldFetchOpportunities ? fetchList("/api/opportunities") : Promise.resolve([]),
    ]);

    if (casesResult.status === "fulfilled" && shouldFetchCases) setFetchedCases(casesResult.value);
    if (opportunitiesResult.status === "fulfilled" && shouldFetchOpportunities) setFetchedOpportunities(opportunitiesResult.value);
    if (casesResult.status === "rejected" || opportunitiesResult.status === "rejected") {
      setFetchError("Parte dos dados não pôde ser atualizada. O que já estava disponível continua visível.");
    }
    setFetching(false);
  }, [casesProp, opportunitiesProp]);

  useEffect(() => {
    const shouldFetchCases = casesProp === undefined;
    const shouldFetchOpportunities = opportunitiesProp === undefined;
    if (!shouldFetchCases && !shouldFetchOpportunities) return;
    let cancelled = false;

    void Promise.allSettled([
      shouldFetchCases ? fetchList("/api/cases") : Promise.resolve([]),
      shouldFetchOpportunities ? fetchList("/api/opportunities") : Promise.resolve([]),
    ]).then(([casesResult, opportunitiesResult]) => {
      if (cancelled) return;
      if (casesResult.status === "fulfilled" && shouldFetchCases) setFetchedCases(casesResult.value);
      if (opportunitiesResult.status === "fulfilled" && shouldFetchOpportunities) setFetchedOpportunities(opportunitiesResult.value);
      if (casesResult.status === "rejected" || opportunitiesResult.status === "rejected") {
        setFetchError("Parte dos dados não pôde ser atualizada. O que já estava disponível continua visível.");
      }
      setFetching(false);
    });

    return () => { cancelled = true; };
  }, [casesProp, opportunitiesProp]);

  const rawCases = casesProp ?? fetchedCases;
  const rawOpportunities = opportunitiesProp ?? fetchedOpportunities;
  const cases = useMemo(() => rawCases.map(normalizeCase), [rawCases]);
  const opportunities = useMemo(() => rawOpportunities.map(normalizeOpportunity), [rawOpportunities]);
  const activeCases = useMemo(() => cases.filter((item) => item.status === "ACTIVE"), [cases]);
  const openOpportunities = useMemo(
    () => opportunities.filter((item) => item.status === "OPEN").sort((a, b) => (b.savingsBRL ?? 0) - (a.savingsBRL ?? 0)),
    [opportunities],
  );

  const futureTrips = useMemo(() => {
    return activeCases
      .filter((item) => {
        if (!now) return Boolean(item.departureDate);
        const days = daysBetween(now, item.departureDate);
        return days !== null && days >= 0;
      })
      .sort((a, b) => (parseDate(a.departureDate)?.getTime() ?? Infinity) - (parseDate(b.departureDate)?.getTime() ?? Infinity));
  }, [activeCases, now]);

  const walletAlerts = useMemo(() => {
    if (!now) return [];
    return activeCases.flatMap((item) => {
      const alerts: Array<{ id: string; caseItem: DashboardCase; title: string; detail: string; tone: "warning" | "neutral" }> = [];
      const updatedDays = daysBetween(parseDate(item.walletUpdatedAt) ?? new Date(0), now.toISOString());
      const expiresIn = daysBetween(now, item.walletExpiresAt);
      if (!item.walletUpdatedAt) {
        alerts.push({ id: `${item.id}-missing`, caseItem: item, title: "Saldo sem data de conferência", detail: `${item.program} · confirme antes de recomendar`, tone: "warning" });
      } else if (updatedDays !== null && updatedDays > 30) {
        alerts.push({ id: `${item.id}-stale`, caseItem: item, title: "Saldo pode estar desatualizado", detail: `${item.program} · conferido há ${updatedDays} dias`, tone: "warning" });
      }
      if (expiresIn !== null && expiresIn >= 0 && expiresIn <= 90) {
        alerts.push({ id: `${item.id}-expiry`, caseItem: item, title: "Pontos próximos do vencimento", detail: `${formatNumber(item.balance)} pontos · ${formatRelativeDate(item.walletExpiresAt, now)}`, tone: "warning" });
      } else if (expiresIn !== null && expiresIn < 0) {
        alerts.push({ id: `${item.id}-expired`, caseItem: item, title: "Validade dos pontos vencida", detail: `${item.program} · confirme o saldo atual`, tone: "warning" });
      }
      if (item.balance <= 0) {
        alerts.push({ id: `${item.id}-empty`, caseItem: item, title: "Carteira sem saldo informado", detail: `${item.program} · atualize para comparar cenários`, tone: "neutral" });
      }
      return alerts;
    });
  }, [activeCases, now]);

  const actions = useMemo<DashboardAction[]>(() => {
    const result: DashboardAction[] = [];
    openOpportunities.slice(0, 2).forEach((item, index) => {
      result.push({
        id: `opportunity-${item.id}`,
        eyebrow: index === 0 ? "Prioridade agora" : "Oportunidade aberta",
        title: item.title,
        description: `${withoutMockSuffix(item.clientName)}${item.savingsBRL ? ` · potencial de ${formatBRL(item.savingsBRL)}` : ""}`,
        tone: index === 0 ? "urgent" : "attention",
        cta: "Revisar oportunidade",
        run: onOpenOpportunities,
      });
    });

    if (now) {
      const nearTrip = futureTrips.find((item) => {
        const days = daysBetween(now, item.departureDate);
        return days !== null && days <= 90;
      });
      if (nearTrip) {
        result.push({
          id: `trip-${nearTrip.id}`,
          eyebrow: "Viagem se aproximando",
          title: `${nearTrip.origin} → ${nearTrip.destination}`,
          description: `${withoutMockSuffix(nearTrip.name)} · ${formatRelativeDate(nearTrip.departureDate, now)}`,
          tone: "attention",
          cta: "Pesquisar passagens",
          run: onOpenFlights ? () => onOpenFlights(nearTrip.id) : undefined,
        });
      }
    }

    const firstWalletAlert = walletAlerts[0];
    if (firstWalletAlert) {
      result.push({
        id: `wallet-${firstWalletAlert.id}`,
        eyebrow: "Qualidade dos dados",
        title: firstWalletAlert.title,
        description: `${withoutMockSuffix(firstWalletAlert.caseItem.name)} · ${firstWalletAlert.detail}`,
        tone: "calm",
        cta: "Conferir carteira",
        run: onOpenCase ? () => onOpenCase(firstWalletAlert.caseItem.id) : undefined,
      });
    }
    return result.slice(0, 3);
  }, [futureTrips, now, onOpenCase, onOpenFlights, onOpenOpportunities, openOpportunities, walletAlerts]);

  const recentActivity = useMemo(() => {
    const caseEvents = cases.map((item) => ({
      id: `case-${item.id}`,
      title: `${withoutMockSuffix(item.name)} teve o atendimento atualizado`,
      detail: `${item.origin} → ${item.destination}`,
      date: item.updatedAt,
      mode: item.mode,
    }));
    const opportunityEvents = opportunities.map((item) => ({
      id: `opportunity-${item.id}`,
      title: item.title,
      detail: withoutMockSuffix(item.clientName),
      date: item.updatedAt ?? item.observedAt,
      mode: item.mode,
    }));
    return [...caseEvents, ...opportunityEvents]
      .sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0))
      .slice(0, 5);
  }, [cases, opportunities]);

  const potentialSavings = openOpportunities.reduce((sum, item) => sum + (item.savingsBRL ?? 0), 0);
  const hasMockData = [...cases, ...opportunities].some((item) => item.mode === "mock");
  const isBusy = loading || fetching;
  const displayedError = error ?? fetchError;

  async function handleRefresh() {
    setFetching(true);
    setFetchError(null);
    try {
      if (onRefresh) await onRefresh();
      await loadMissingData();
    } catch {
      setFetchError("Não foi possível atualizar os dados agora. Tente novamente em instantes.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <section className={styles.dashboard} aria-labelledby="miles-dashboard-title" aria-busy={isBusy}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}><i /> Central de comando</span>
          <h1 id="miles-dashboard-title">O que merece sua atenção hoje</h1>
          <p>Prioridades, viagens e oportunidades organizadas para você decidir com segurança e agir mais rápido.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.secondaryButton} href="/como-funciona">
            <Icon name="route" /> Como funciona
          </Link>
          <button className={styles.secondaryButton} type="button" onClick={() => void handleRefresh()} disabled={isBusy}>
            <Icon name="refresh" /> {isBusy ? "Atualizando…" : "Atualizar"}
          </button>
          {onCreateCase && <button className={styles.primaryButton} type="button" onClick={onCreateCase}>
            <Icon name="plus" /> Novo atendimento
          </button>}
        </div>
        <div className={styles.heroDate}>
          <span>{now ? new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now) : "Visão operacional"}</span>
          <strong>{now ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(now) : "Dados da agência"}</strong>
        </div>
      </header>

      {displayedError && <div className={styles.errorBanner} role="status"><strong>Atenção:</strong> {displayedError}</div>}
      {hasMockData && <div className={styles.mockNotice} role="note">
        <ModeBadge mode="mock" /> Dados demonstrativos estão identificados. Confirme valores e disponibilidade antes de executar qualquer ação.
      </div>}

      <section className={styles.metrics} aria-label="Resumo operacional">
        <article className={styles.metricCard}>
          <span className={styles.metricIcon}><Icon name="spark" /></span>
          <div><span>Oportunidades abertas</span><strong>{formatNumber(openOpportunities.length)}</strong></div>
          <small>{openOpportunities.length ? "Pedem revisão da agência" : "Nenhuma pendência agora"}</small>
        </article>
        <article className={`${styles.metricCard} ${styles.metricHighlight}`}>
          <span className={styles.metricIcon}><Icon name="wallet" /></span>
          <div><span>Economia potencial</span><strong>{formatBRL(potentialSavings)}</strong></div>
          <small>Nas oportunidades abertas</small>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricIcon}><Icon name="route" /></span>
          <div><span>Viagens no radar</span><strong>{formatNumber(futureTrips.length)}</strong></div>
          <small>{futureTrips.length ? "Com embarque futuro" : "Cadastre a próxima viagem"}</small>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricIcon}><Icon name="bell" /></span>
          <div><span>Carteiras para revisar</span><strong>{formatNumber(walletAlerts.length)}</strong></div>
          <small>{walletAlerts.length ? "Dados pedem conferência" : "Saldos em dia"}</small>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.priorityPanel} aria-labelledby="dashboard-actions-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionIcon}><Icon name="spark" /></span>
              <div><span>Fila inteligente</span><h2 id="dashboard-actions-title">Ações do dia</h2></div>
            </div>
            <span className={styles.counter}>{actions.length}</span>
          </div>

          {actions.length > 0 ? <ol className={styles.actionList}>
            {actions.map((item, index) => <li key={item.id} className={`${styles.actionItem} ${styles[`action_${item.tone}`]}`}>
              <span className={styles.actionIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.actionCopy}>
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              {item.run && <button type="button" onClick={item.run} aria-label={`${item.cta}: ${item.title}`}>
                {item.cta}<Icon name="arrow" />
              </button>}
            </li>)}
          </ol> : <div className={styles.successState}>
            <span><Icon name="spark" /></span>
            <div><h3>Operação em dia</h3><p>Não há ação urgente com os dados disponíveis. Você pode cadastrar uma nova viagem ou pesquisar tarifas.</p></div>
            {onCreateCase && <button type="button" onClick={onCreateCase}>Novo atendimento <Icon name="arrow" /></button>}
          </div>}
        </section>

        <aside className={styles.healthPanel} aria-labelledby="dashboard-health-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionIcon}><Icon name="wallet" /></span>
              <div><span>Confiabilidade</span><h2 id="dashboard-health-title">Saúde das carteiras</h2></div>
            </div>
          </div>
          {walletAlerts.length > 0 ? <ul className={styles.healthList}>
            {walletAlerts.slice(0, 4).map((alert) => <li key={alert.id}>
              <span className={`${styles.healthSignal} ${styles[`health_${alert.tone}`]}`} />
              <div><strong>{alert.title}</strong><span>{withoutMockSuffix(alert.caseItem.name)}</span><small>{alert.detail}</small></div>
              {onOpenCase && <button type="button" onClick={() => onOpenCase(alert.caseItem.id)} aria-label={`Abrir carteira de ${withoutMockSuffix(alert.caseItem.name)}`}><Icon name="arrow" /></button>}
            </li>)}
          </ul> : <div className={styles.compactEmpty}><span>✓</span><p><strong>Tudo conferido</strong>Não encontramos saldos vencidos ou desatualizados.</p></div>}
        </aside>
      </div>

      <div className={styles.lowerGrid}>
        <section className={styles.tripsPanel} aria-labelledby="dashboard-trips-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionIcon}><Icon name="route" /></span>
              <div><span>Próximos embarques</span><h2 id="dashboard-trips-title">Viagens no radar</h2></div>
            </div>
            {onOpenFlights && <button className={styles.textButton} type="button" onClick={() => onOpenFlights()}>Abrir Hub de voos <Icon name="arrow" /></button>}
          </div>
          {futureTrips.length > 0 ? <div className={styles.tripList}>
            {futureTrips.slice(0, 4).map((trip) => <article key={trip.id} className={styles.tripCard}>
              <div className={styles.avatar}>{initials(trip.name)}</div>
              <div className={styles.tripMain}>
                <div><strong>{trip.origin}</strong><span><i />→<i /></span><strong>{trip.destination}</strong></div>
                <p>{withoutMockSuffix(trip.name)} · {trip.destinationLabel || `${trip.origin} para ${trip.destination}`}</p>
              </div>
              <div className={styles.tripMeta}>
                <span><Icon name="clock" /> {formatDate(trip.departureDate, true)}</span>
                <small>{formatRelativeDate(trip.departureDate, now)} · {trip.passengers} {trip.passengers === 1 ? "viajante" : "viajantes"}</small>
              </div>
              <ModeBadge mode={trip.mode} />
              {onOpenCase && <button className={styles.iconButton} type="button" onClick={() => onOpenCase(trip.id)} aria-label={`Abrir atendimento de ${withoutMockSuffix(trip.name)}`}><Icon name="arrow" /></button>}
            </article>)}
          </div> : <div className={styles.inlineEmpty}>Nenhuma viagem futura encontrada com os dados disponíveis.</div>}
        </section>

        <aside className={styles.activityPanel} aria-labelledby="dashboard-activity-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionIcon}><Icon name="clock" /></span>
              <div><span>Rastro operacional</span><h2 id="dashboard-activity-title">Atividade recente</h2></div>
            </div>
          </div>
          {recentActivity.length > 0 ? <ul className={styles.activityList}>
            {recentActivity.map((activity) => <li key={activity.id}>
              <span className={styles.timelineDot} />
              <div><strong>{activity.title}</strong><span>{activity.detail}</span><small>{formatDate(activity.date, true)}</small></div>
              <ModeBadge mode={activity.mode} />
            </li>)}
          </ul> : <div className={styles.inlineEmpty}>A atividade aparecerá conforme a agência usar o cockpit.</div>}
        </aside>
      </div>
    </section>
  );
}

export default MilesAIDashboard;
