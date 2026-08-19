"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import MilesAIDashboard from "@/components/MilesAIDashboard";
import { formatAirportCode, formatBrazilPhone, isValidBrazilPhone, isValidEmail } from "@/domain/field-formatters";
import { replaceWalletBalances } from "@/domain/wallet";
import type { Wallet } from "@/domain/types";

type JsonObject = Record<string, unknown>;
type View = "dashboard" | "clients" | "opportunities" | "flights";
type DataMode = "live" | "mock" | "manual";

type CaseRecord = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  origin: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  passengers: number;
  program: string;
  balance: number;
  budgetBRL?: number;
  source: string;
  updatedAt?: string;
  raw: unknown;
};

type Opportunity = {
  id: string;
  caseId?: string;
  clientName: string;
  title: string;
  description: string;
  savingsBRL?: number;
  bonusPercent?: number;
  urgency: "high" | "medium" | "low";
  source: string;
  mode: DataMode;
  observedAt?: string;
  raw: unknown;
};

type FlightOffer = {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  connections: number;
  totalBRL: number;
  currency: string;
  bookingUrl?: string;
  source: string;
  mode: "live" | "mock";
};

type FlightSearchResult = {
  mode: "live" | "mock";
  provider: string;
  observedAt: string;
  disclaimer: string;
  offers: FlightOffer[];
};

type Evaluation = {
  decision?: string;
  action?: string;
  summary?: string;
  nextStep?: string;
  generatedAt?: string;
  dataMode?: string;
  recommendedOptionId?: string;
  options?: Array<{
    id?: string;
    kind?: string;
    label?: string;
    eligible?: boolean;
    cashOutlayBRL?: number;
    economicCostBRL?: number;
    savingsVsCashBRL?: number;
    reasons?: string[];
    dataSource?: string;
    observedAt?: string;
  }>;
};

type CaseDraft = {
  name: string;
  email: string;
  phone: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  maxConnections: number;
  budgetBRL: string;
  program: string;
  balance: string;
  referenceValue: string;
};

type WalletBalanceDraft = {
  id: string;
  program: string;
  balance: string;
  referenceValue: string;
  expiresAt: string;
  source: string;
  updatedAt: string;
};

const walletPrograms = ["Livelo", "Esfera", "Smiles", "LATAM Pass", "Azul Fidelidade", "TAP Miles&Go", "Flying Blue", "Iberia Plus"];

const emptyDraft: CaseDraft = {
  name: "",
  email: "",
  phone: "",
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  passengers: 1,
  maxConnections: 1,
  budgetBRL: "",
  program: "Livelo",
  balance: "",
  referenceValue: "20",
};

const decisionLabel: Record<string, string> = {
  BUY_CASH: "Comprar em dinheiro",
  USE_POINTS: "Usar pontos",
  BUY_MILES: "Cotar milhas",
  WAIT: "Aguardar oportunidade",
  REVIEW: "Revisar dados",
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickObject(value: unknown, keys: string[]): JsonObject {
  if (!isObject(value)) return {};
  for (const key of keys) if (isObject(value[key])) return value[key] as JsonObject;
  return {};
}

function textValue(...values: unknown[]) {
  const value = values.find((item) => typeof item === "string" && item.trim());
  return typeof value === "string" ? value : "";
}

function numberValue(...values: unknown[]) {
  const value = values.find((item) => typeof item === "number" && Number.isFinite(item));
  return typeof value === "number" ? value : 0;
}

function unwrapList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];
  for (const key of keys) if (Array.isArray(payload[key])) return payload[key] as unknown[];
  return [];
}

function normalizeCase(value: unknown, index: number): CaseRecord {
  const root = isObject(value) ? value : {};
  const input = pickObject(root, ["input"]);
  const client = pickObject(input, ["traveler", "client", "profile"]);
  const trip = pickObject(input, ["trip", "travelRequest", "request"]);
  const wallet = pickObject(input, ["wallet"]);
  const strategy = pickObject(input, ["strategy"]);
  const departureWindow = pickObject(trip, ["departureWindow"]);
  const balances = Array.isArray(wallet.balances) ? wallet.balances : Array.isArray(root.balances) ? root.balances : [];
  const primaryProgram = textValue(strategy.sourceProgram);
  const primaryBalance = balances.find((balance) => isObject(balance) && textValue(balance.program) === primaryProgram);
  const firstBalance = isObject(primaryBalance) ? primaryBalance : isObject(balances[0]) ? balances[0] : {};
  return {
    id: textValue(root.id, root.caseId, root.slug) || `case-${index}`,
    name: textValue(root.name, root.clientName, client.name, client.travelerName) || "Cliente sem nome",
    email: textValue(root.email, client.email) || undefined,
    phone: textValue(root.phone, client.phone) || undefined,
    origin: textValue(root.origin, trip.origin).toUpperCase() || "—",
    destination: textValue(root.destination, trip.destination).toUpperCase() || "—",
    departureDate: textValue(root.departureDate, trip.departureDate, departureWindow.start) || undefined,
    returnDate: textValue(root.returnDate, trip.returnDate) || undefined,
    passengers: numberValue(root.passengers, root.adults, trip.passengers, trip.adults) || 1,
    program: textValue(root.program, firstBalance.program, wallet.program) || "Carteira não informada",
    balance: numberValue(root.balance, firstBalance.balance, wallet.balance),
    budgetBRL: numberValue(root.budgetBRL, trip.budgetBRL) || undefined,
    source: textValue(root.source, wallet.source) || (root.dataMode === "live" ? "Fonte live" : "Dado mock/manual"),
    updatedAt: textValue(root.updatedAt, root.createdAt, firstBalance.updatedAt) || undefined,
    raw: value,
  };
}

function normalizeOpportunity(value: unknown, index: number): Opportunity {
  const root = isObject(value) ? value : {};
  const event = pickObject(root, ["event", "promotion"]);
  const rawUrgency = textValue(root.urgency, root.priority).toLowerCase();
  const rawMode = textValue(root.mode, root.dataMode).toLowerCase();
  const source = textValue(root.source, event.source) || "Monitor MilesAI";
  return {
    id: textValue(root.id, root.opportunityId) || `opportunity-${index}`,
    caseId: textValue(root.caseId, root.tripId) || undefined,
    clientName: textValue(root.clientName, root.caseName, root.travelerName, root.name) || "Cliente",
    title: textValue(root.title, root.summary, event.title) || "Nova condição detectada",
    description: textValue(root.description, root.summary, root.nextStep, root.reason) || "Revise a condição e recalcule a estratégia antes de executar.",
    savingsBRL: numberValue(root.savingsBRL, root.savingsVsCashBRL) || undefined,
    bonusPercent: numberValue(root.bonusPercent, event.bonusPercent) || undefined,
    urgency: rawUrgency === "high" || rawUrgency === "alta" ? "high" : rawUrgency === "low" || rawUrgency === "baixa" ? "low" : "medium",
    source,
    mode: rawMode === "live" ? "live" : rawMode === "manual" || /manual|agente/i.test(source) ? "manual" : "mock",
    observedAt: textValue(root.observedAt, root.createdAt, event.observedAt, event.startsAt) || undefined,
    raw: value,
  };
}

function formatBRL(value?: number) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatDate(value?: string, includeTime = false) {
  if (!value) return "não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", includeTime
    ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${String(remainder).padStart(2, "0")}`;
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = isObject(payload) && isObject(payload.error) ? payload.error : {};
    const message = isObject(payload) ? textValue(error.message, payload.message) : "";
    throw new Error(message || "Não foi possível concluir esta operação.");
  }
  return isObject(payload) && "data" in payload ? payload.data : payload;
}

function caseInputOf(item: CaseRecord): JsonObject | null {
  if (!isObject(item.raw) || !isObject(item.raw.input)) return null;
  return item.raw.input;
}

function dateInputValue(value: unknown) {
  return textValue(value).slice(0, 10);
}

function walletDraftsOf(wallet: JsonObject): WalletBalanceDraft[] {
  const balances = Array.isArray(wallet.balances) ? wallet.balances.filter(isObject) : [];
  return balances.map((balance, index) => ({
    id: `${index}-${textValue(balance.program) || "programa"}`,
    program: textValue(balance.program),
    balance: String(numberValue(balance.balance)),
    referenceValue: String(numberValue(balance.referenceValuePer1000BRL)),
    expiresAt: dateInputValue(balance.expiresAt),
    source: textValue(balance.source, wallet.source) || "Cadastro manual pelo agente",
    updatedAt: dateInputValue(balance.updatedAt) || new Date().toISOString().slice(0, 10),
  }));
}

function Brand() {
  return <span className="cockpit-brandmark" aria-hidden="true"><Image src="/brand/milesai-mark-light.png" width={48} height={48} alt="" priority /></span>;
}

function ModeBadge({ mode }: { mode: DataMode }) {
  return <span className={`cockpit-mode cockpit-mode--${mode}`}><i />{mode === "live" ? "Dado live" : mode === "manual" ? "Dado manual" : "Dado mock"}</span>;
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="cockpit-loading" role="status"><i /><span>{label}</span></div>;
}

function EmptyState({ icon, title, copy, action }: { icon: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="cockpit-empty"><span>{icon}</span><h3>{title}</h3><p>{copy}</p>{action}</div>;
}

function Navigation({ view, setView, counts }: { view: View; setView: (view: View) => void; counts: { clients: number; opportunities: number } }) {
  return (
    <aside className="cockpit-sidebar">
      <div className="cockpit-logo"><Brand /><div><strong>MilesAI</strong><span>travel intelligence</span></div></div>
      <nav aria-label="Navegação principal">
        <button type="button" className={view === "dashboard" ? "is-active" : ""} onClick={() => setView("dashboard")}><span>◈</span><b>Visão geral</b></button>
        <button type="button" className={view === "clients" ? "is-active" : ""} onClick={() => setView("clients")}><span>⌂</span><b>Clientes</b><em>{counts.clients}</em></button>
        <button type="button" className={view === "opportunities" ? "is-active" : ""} onClick={() => setView("opportunities")}><span>✦</span><b>Oportunidades</b><em>{counts.opportunities}</em></button>
        <button type="button" className={view === "flights" ? "is-active" : ""} onClick={() => setView("flights")}><span>↗</span><b>Hub de voos</b></button>
        <a href="/como-funciona"><span>?</span><b>Como funciona</b></a>
      </nav>
      <div className="cockpit-sidebar__note"><i /><div><b>Motor operacional</b><span>Pronto com fallback inteligente</span></div></div>
      <footer><span>AMBIENTE DE DEMO</span><b><i /> Operação local</b></footer>
    </aside>
  );
}

function Topbar({ view, onNew, onRefresh, refreshing }: { view: View; onNew: () => void; onRefresh: () => void; refreshing: boolean }) {
  const titles = { dashboard: ["Visão geral", "O que merece atenção hoje"], clients: ["Carteira de clientes", "Organize viagens e decida o melhor caminho"], opportunities: ["Radar de oportunidades", "O que pede ação agora, em uma única fila"], flights: ["Hub de voos", "Pesquise, compare e leve uma oferta à simulação"] };
  return <header className="cockpit-topbar"><div><span><i /> OPERAÇÃO MILESAI</span><h1>{titles[view][0]}</h1><p>{titles[view][1]}</p></div><div className="cockpit-topbar__actions"><button type="button" className="cockpit-icon-button" onClick={onRefresh} disabled={refreshing} aria-label={refreshing ? "Atualizando dados" : "Atualizar dados"}>↻</button><button type="button" className="cockpit-primary" onClick={onNew}><span>＋</span>Novo atendimento</button></div></header>;
}

function SummaryCards({ cases, opportunities }: { cases: CaseRecord[]; opportunities: Opportunity[] }) {
  const monitored = cases.filter((item) => item.origin !== "—" && item.destination !== "—").length;
  const potential = opportunities.reduce((sum, item) => sum + (item.savingsBRL ?? 0), 0);
  return <section className="cockpit-metrics" aria-label="Resumo da operação">
    <article><span>CLIENTES ATIVOS</span><strong>{cases.length}</strong><small><i className="is-green" />{monitored} viagens cadastradas</small></article>
    <article><span>OPORTUNIDADES</span><strong>{opportunities.length}</strong><small><i className={opportunities.length ? "is-amber" : ""} />{opportunities.length ? "pedem sua atenção" : "radar tranquilo"}</small></article>
    <article><span>ECONOMIA POTENCIAL</span><strong>{formatBRL(potential)}</strong><small><i className="is-green" />estimativa do motor</small></article>
  </section>;
}

function ClientCard({ item, selected, onEvaluate, onWallet, evaluating }: { item: CaseRecord; selected: boolean; onEvaluate: () => void; onWallet: () => void; evaluating: boolean }) {
  return <article className={`cockpit-client-card ${selected ? "is-selected" : ""}`}>
    <div className="cockpit-client-card__identity"><span>{item.name.slice(0, 1).toUpperCase()}</span><div><h3>{item.name}</h3><p>{item.email || item.phone || "Contato não informado"}</p></div><i className="cockpit-health" title="Cadastro ativo" /></div>
    <div className="cockpit-route"><div><small>ORIGEM</small><b>{item.origin}</b></div><span><i />→<i /></span><div><small>DESTINO</small><b>{item.destination}</b></div></div>
    <dl><div><dt>Embarque</dt><dd>{formatDate(item.departureDate)}</dd></div><div><dt>Viajantes</dt><dd>{item.passengers}</dd></div><div><dt>Carteira</dt><dd>{formatNumber(item.balance)} {item.program}</dd></div></dl>
    <footer><span><i />{item.source} · {formatDate(item.updatedAt, true)}</span><div className="cockpit-client-card__actions"><button type="button" className="is-wallet" onClick={onWallet}>Editar carteira</button><button type="button" onClick={onEvaluate} disabled={evaluating}>{evaluating ? "Calculando…" : "Simular estratégia"}<b>→</b></button></div></footer>
  </article>;
}

function EvaluationPanel({ evaluation, caseRecord, loading, onClose, onEdit, onWallet }: { evaluation: Evaluation | null; caseRecord?: CaseRecord; loading: boolean; onClose: () => void; onEdit: () => void; onWallet: () => void }) {
  if (!loading && !evaluation) return null;
  const options = evaluation?.options ?? [];
  return <section className="cockpit-evaluation" aria-live="polite">
    <header><div><span>SIMULAÇÃO INSTANTÂNEA</span><h2>{caseRecord?.name || "Estratégia do cliente"}</h2></div><button onClick={onClose} aria-label="Fechar simulação">×</button></header>
    {loading ? <LoadingBlock label="Comparando dinheiro, pontos e milhas…" /> : <>
      <div className="cockpit-decision"><div><small>DECISÃO DO MOTOR</small><strong>{decisionLabel[evaluation?.decision || ""] || evaluation?.decision || "Estratégia calculada"}</strong><p>{evaluation?.summary || "Cenário recalculado com os dados atuais."}</p></div><ModeBadge mode={evaluation?.dataMode === "live" ? "live" : "mock"} /></div>
      {options.length > 0 && <div className="cockpit-option-grid">{options.map((option, index) => <article key={option.id || `${option.kind}-${index}`} className={option.id && option.id === evaluation?.recommendedOptionId ? "is-best" : ""}><span>{option.label || option.kind || `Opção ${index + 1}`}</span><strong>{formatBRL(option.cashOutlayBRL)}</strong><small>desembolso agora</small><dl><div><dt>Custo econômico</dt><dd>{formatBRL(option.economicCostBRL)}</dd></div><div><dt>Economia</dt><dd>{formatBRL(option.savingsVsCashBRL)}</dd></div></dl><p>{option.reasons?.[0] || "Calculado pelo motor determinístico."}</p><footer>{option.dataSource || "Motor MilesAI"} · {formatDate(option.observedAt, true)}</footer></article>)}</div>}
      <div className="cockpit-next-step"><span>PRÓXIMO PASSO</span><p>{evaluation?.nextStep || "Revise os dados antes de executar qualquer transferência."}</p><small>Gerado em {formatDate(evaluation?.generatedAt, true)}</small><div className="cockpit-next-step__actions"><button onClick={onWallet}>Editar carteira e milheiro</button><button onClick={onEdit}>Ajustar oferta, taxas e bônus <b>→</b></button></div></div>
    </>}
  </section>;
}

function ClientsView({ cases, opportunities, loading, selectedId, onEvaluate, onWallet, evaluatingId, onNew }: { cases: CaseRecord[]; opportunities: Opportunity[]; loading: boolean; selectedId?: string; onEvaluate: (item: CaseRecord) => void; onWallet: (item: CaseRecord) => void; evaluatingId?: string; onNew: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = cases.filter((item) => `${item.name} ${item.origin} ${item.destination} ${item.program}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <SummaryCards cases={cases} opportunities={opportunities} />
    <section className="cockpit-section-heading"><div><span>CARTEIRA</span><h2>Atendimentos em andamento</h2></div><label className="cockpit-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, rota ou programa" /></label></section>
    {loading ? <LoadingBlock label="Carregando sua carteira…" /> : filtered.length === 0 ? <EmptyState icon="◎" title={query ? "Nenhum cliente encontrado" : "Comece pelo primeiro cliente"} copy={query ? "Tente outro nome, aeroporto ou programa." : "Cadastre cliente, viagem e carteira em menos de dois minutos."} action={!query && <button type="button" className="cockpit-primary" onClick={onNew}>Cadastrar cliente</button>} /> : <div className="cockpit-client-grid">{filtered.map((item) => <ClientCard key={item.id} item={item} selected={selectedId === item.id} onEvaluate={() => onEvaluate(item)} onWallet={() => onWallet(item)} evaluating={evaluatingId === item.id} />)}</div>}
  </>;
}

function OpportunityCard({ item, onEvaluate, busy }: { item: Opportunity; onEvaluate: () => void; busy: boolean }) {
  return <article className={`cockpit-opportunity cockpit-opportunity--${item.urgency}`}>
    <div className="cockpit-opportunity__signal">{item.urgency === "high" ? "!" : "✦"}</div>
    <div className="cockpit-opportunity__copy"><div><ModeBadge mode={item.mode} /><span className="cockpit-timestamp">Observado {formatDate(item.observedAt, true)}</span></div><h3>{item.title}</h3><p><b>{item.clientName}</b> · {item.description}</p><small>Fonte: {item.source}</small></div>
    <div className="cockpit-opportunity__value">{item.bonusPercent ? <><small>BÔNUS</small><strong>{item.bonusPercent}%</strong></> : <><small>ECONOMIA POTENCIAL</small><strong>{formatBRL(item.savingsBRL)}</strong></>}<button onClick={onEvaluate} disabled={busy}>{busy ? "Recalculando…" : item.caseId ? "Recalcular caso" : "Ver detalhes"}<span>→</span></button></div>
  </article>;
}

function OpportunitiesView({ items, loading, onEvaluate, busyId, onPromo }: { items: Opportunity[]; loading: boolean; onEvaluate: (item: Opportunity) => void; busyId?: string; onPromo: () => void }) {
  return <>
    <section className="cockpit-radar-hero"><div><span className="cockpit-radar-icon">✦</span><div><span>RADAR PROATIVO</span><h2>{items.length ? `${items.length} ${items.length === 1 ? "oportunidade pede" : "oportunidades pedem"} ação` : "Tudo monitorado por aqui"}</h2><p>Condições novas entram nesta fila com origem e horário para o agente decidir com segurança.</p></div></div><button onClick={onPromo}>＋ Registrar promoção</button></section>
    {loading ? <LoadingBlock label="Consultando o radar…" /> : items.length === 0 ? <EmptyState icon="✓" title="Nenhuma oportunidade pendente" copy="O monitor continua acompanhando as condições cadastradas." action={<button className="cockpit-secondary" onClick={onPromo}>Simular uma promoção</button>} /> : <div className="cockpit-opportunity-list">{items.map((item) => <OpportunityCard key={item.id} item={item} onEvaluate={() => onEvaluate(item)} busy={busyId === item.id} />)}</div>}
  </>;
}

function FlightsView({ cases, onUseOffer }: { cases: CaseRecord[]; onUseOffer: (offer: FlightOffer, caseId?: string) => void }) {
  const selected = cases[0];
  const [form, setForm] = useState({ origin: selected?.origin !== "—" ? selected?.origin : "", destination: selected?.destination !== "—" ? selected?.destination : "", departureDate: selected?.departureDate?.slice(0, 10) || "", returnDate: selected?.returnDate?.slice(0, 10) || "", adults: selected?.passengers || 1, maxConnections: 1 });
  const [caseId, setCaseId] = useState(selected?.id || "");
  const [result, setResult] = useState<FlightSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseCase(id: string) {
    setCaseId(id);
    const item = cases.find((candidate) => candidate.id === id);
    if (item) setForm((current) => ({ ...current, origin: item.origin === "—" ? "" : item.origin, destination: item.destination === "—" ? "" : item.destination, departureDate: item.departureDate?.slice(0, 10) || "", returnDate: item.returnDate?.slice(0, 10) || "", adults: item.passengers }));
  }

  async function search(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const payload = await readJson(await fetch("/api/flights/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }));
      if (!isObject(payload)) throw new Error("Resposta de pesquisa inválida.");
      const offers: FlightOffer[] = unwrapList(payload.offers, []).filter(isObject).map((offer, index): FlightOffer => ({ id: textValue(offer.id) || `offer-${index}`, airline: textValue(offer.airline) || "Companhia aérea", flightNumber: textValue(offer.flightNumber) || "—", origin: textValue(offer.origin) || form.origin, destination: textValue(offer.destination) || form.destination, departureAt: textValue(offer.departureAt), arrivalAt: textValue(offer.arrivalAt), durationMinutes: numberValue(offer.durationMinutes), connections: numberValue(offer.connections), totalBRL: numberValue(offer.totalBRL), currency: textValue(offer.currency) || "BRL", bookingUrl: textValue(offer.bookingUrl) || undefined, source: textValue(offer.source) || textValue(payload.provider) || "Pesquisa MilesAI", mode: textValue(offer.mode, payload.mode) === "live" ? "live" : "mock" }));
      setResult({ mode: textValue(payload.mode) === "live" ? "live" : "mock", provider: textValue(payload.provider) || "Provedor mock MilesAI", observedAt: textValue(payload.observedAt) || new Date().toISOString(), disclaimer: textValue(payload.disclaimer) || "Preços e disponibilidade devem ser confirmados antes da emissão.", offers });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível pesquisar voos."); }
    finally { setLoading(false); }
  }

  return <div className="cockpit-flight-layout">
    <form className="cockpit-flight-search" onSubmit={search}><header><span>BUSCA OPERACIONAL</span><h2>Encontre uma referência de tarifa</h2><p>Quando não houver credencial de provedor, a resposta usa dados mock claramente identificados.</p></header>
      <label>Vincular ao cliente<select value={caseId} onChange={(event) => chooseCase(event.target.value)}><option value="">Pesquisa avulsa</option>{cases.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.origin} → {item.destination}</option>)}</select></label>
      <div className="cockpit-airports"><label>Origem<input required maxLength={3} value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value.toUpperCase() })} placeholder="GRU" /></label><span>→</span><label>Destino<input required maxLength={3} value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value.toUpperCase() })} placeholder="LIS" /></label></div>
      <div className="cockpit-form-pair"><label>Ida<input required type="date" value={form.departureDate} onInput={(event) => setForm((current) => ({ ...current, departureDate: event.currentTarget.value }))} onChange={(event) => setForm((current) => ({ ...current, departureDate: event.target.value }))} /></label><label>Volta (opcional)<input type="date" value={form.returnDate} onInput={(event) => setForm((current) => ({ ...current, returnDate: event.currentTarget.value }))} onChange={(event) => setForm((current) => ({ ...current, returnDate: event.target.value }))} /></label></div>
      <div className="cockpit-form-pair"><label>Adultos<input min="1" max="9" type="number" value={form.adults} onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })} /></label><label>Máximo de conexões<select value={form.maxConnections} onChange={(event) => setForm({ ...form, maxConnections: Number(event.target.value) })}><option value={0}>Somente direto</option><option value={1}>Até 1 conexão</option><option value={2}>Até 2 conexões</option></select></label></div>
      {error && <div className="cockpit-inline-error"><b>Ops.</b> {error}</div>}
      <button className="cockpit-primary" disabled={loading}>{loading ? "Pesquisando…" : "Pesquisar voos"}<span>↗</span></button>
    </form>
    <section className="cockpit-flight-results">
      {!result && !loading && <EmptyState icon="↗" title="Sua pesquisa aparece aqui" copy="Informe a rota para comparar horários, conexões e valor total." />}
      {loading && <LoadingBlock label="Consultando disponibilidade…" />}
      {result && !loading && <><header className="cockpit-result-meta"><div><ModeBadge mode={result.mode} /><h2>{result.offers.length} {result.offers.length === 1 ? "oferta encontrada" : "ofertas encontradas"}</h2><p>Fonte: {result.provider} · Observado {formatDate(result.observedAt, true)}</p></div></header>
        {result.offers.length === 0 ? <EmptyState icon="∅" title="Nenhum voo encontrado" copy="Tente ampliar as datas ou permitir uma conexão." /> : <div className="cockpit-offer-list">{result.offers.map((offer) => <article key={offer.id}><header><div><span className="cockpit-airline-mark">{offer.airline.slice(0, 2).toUpperCase()}</span><div><b>{offer.airline}</b><small>{offer.flightNumber}</small></div></div><ModeBadge mode={offer.mode} /></header><div className="cockpit-flight-time"><div><strong>{formatDate(offer.departureAt, true).split(", ").at(-1)}</strong><span>{offer.origin}</span></div><div><small>{durationLabel(offer.durationMinutes)}</small><i /><span>{offer.connections ? `${offer.connections} conexão` : "direto"}</span></div><div><strong>{formatDate(offer.arrivalAt, true).split(", ").at(-1)}</strong><span>{offer.destination}</span></div></div><footer><div><small>Total para {form.adults} {form.adults === 1 ? "adulto" : "adultos"}</small><strong>{formatBRL(offer.totalBRL)}</strong><span>{offer.currency}</span></div><button onClick={() => onUseOffer(offer, caseId || undefined)}>{caseId ? "Usar na simulação" : "Selecionar oferta"}<b>→</b></button></footer><p>Fonte: {offer.source} · coletado {formatDate(result.observedAt, true)}</p></article>)}</div>}
        <div className="cockpit-disclaimer"><span>i</span><p>{result.disclaimer}</p></div>
      </>}
    </section>
  </div>;
}

function NewCaseDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (item: CaseRecord) => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (patch: Partial<CaseDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function save() {
    setLoading(true); setError(null);
    const now = new Date().toISOString();
    const travelerId = crypto.randomUUID();
    const tripId = crypto.randomUUID();
    const targetProgram = ["Livelo", "Esfera"].includes(draft.program) ? "TAP Miles&Go" : draft.program;
    const cashTotal = draft.budgetBRL ? Number(draft.budgetBRL) : 6_000;
    const awardMiles = 80_000 * draft.passengers;
    const input = {
      traveler: { id: travelerId, name: draft.name, ...(draft.email ? { email: draft.email } : {}), ...(draft.phone ? { phone: draft.phone } : {}), beginnerMode: true, travelStyle: "balance", comfortLevel: 3, flexibility: "medium", flexDays: 2, acceptsConnections: draft.maxConnections > 0, preferredAirports: [draft.origin], maxConnections: draft.maxConnections },
      trip: { id: tripId, travelerId, origin: draft.origin, destination: draft.destination, destinationLabel: draft.destination, departureWindow: { start: draft.departureDate, end: draft.departureDate }, ...(draft.returnDate ? { returnDate: draft.returnDate } : {}), passengers: draft.passengers, objective: "balance", ...(draft.budgetBRL ? { budgetBRL: Number(draft.budgetBRL) } : {}), maxConnections: draft.maxConnections, missingFields: [] },
      wallet: { travelerId, balances: [{ program: draft.program, balance: Number(draft.balance || 0), referenceValuePer1000BRL: Number(draft.referenceValue || 0), expiresAt: null, updatedAt: now }], source: "Cadastro manual pelo agente" },
      offers: [
        { id: crypto.randomUUID(), kind: "cash", totalBRL: cashTotal, passengers: draft.passengers, connections: draft.maxConnections, available: true, source: "Referência mock inicial", observedAt: now },
        { id: crypto.randomUUID(), kind: "award", program: targetProgram, miles: awardMiles, taxesBRL: 450, positioningFlightBRL: 0, passengers: draft.passengers, connections: draft.maxConnections, available: true, source: "Oferta award mock editável", observedAt: now },
        { id: crypto.randomUUID(), kind: "miles_broker", program: targetProgram, miles: awardMiles, pricePer1000BRL: 24, taxesBRL: 450, positioningFlightBRL: 0, expiresAt: new Date(Date.now() + 86400000).toISOString(), passengers: draft.passengers, connections: draft.maxConnections, available: true, source: "Cotação de milhas mock editável", observedAt: now },
      ],
      promotion: { id: crypto.randomUUID(), type: "TRANSFER_BONUS", sourceProgram: draft.program, targetProgram, bonusPercent: 0, startsAt: now, endsAt: new Date(Date.now() + 7 * 86400000).toISOString(), source: "Sem promoção ativa · cadastro manual" },
      strategy: { sourceProgram: draft.program, targetProgram, minimumBonusPercent: 70, plannedSourcePoints: Number(draft.balance || 0), hasTimeToWait: true },
      now,
    };
    const payload = { name: draft.name, status: "ACTIVE", dataMode: "mock", isMock: true, input };
    try {
      const response = await readJson(await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
      onCreated(normalizeCase(response, Date.now()));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível cadastrar o atendimento."); }
    finally { setLoading(false); }
  }

  const emailValid = !draft.email || isValidEmail(draft.email);
  const phoneValid = !draft.phone || isValidBrazilPhone(draft.phone);
  const validStep = step === 1 ? draft.name.trim().length >= 2 && emailValid && phoneValid : step === 2 ? draft.origin.length === 3 && draft.destination.length === 3 && Boolean(draft.departureDate) : true;
  return <div className="cockpit-overlay" onMouseDown={onClose}><section className="cockpit-drawer" role="dialog" aria-modal="true" aria-labelledby="new-case-title" onMouseDown={(event) => event.stopPropagation()}><button className="cockpit-drawer__close" onClick={onClose} aria-label="Fechar">×</button>
    <header><span>NOVO ATENDIMENTO</span><h2 id="new-case-title">{step === 1 ? "Quem vai viajar?" : step === 2 ? "Qual é a viagem?" : "Como está a carteira?"}</h2><p>{step === 1 ? "Comece pelo essencial. Os demais dados podem ser completados depois." : step === 2 ? "A rota e a data alimentam a busca e o monitoramento." : "Informe pontos e milhas para comparar os caminhos."}</p></header>
    <div className="cockpit-progress">{[1, 2, 3].map((item) => <span key={item} className={item <= step ? "is-done" : ""}><i>{item < step ? "✓" : item}</i><b>{item === 1 ? "Cliente" : item === 2 ? "Viagem" : "Carteira"}</b></span>)}</div>
    <div className="cockpit-drawer__form">
      {step === 1 && <><label>Nome completo<input autoFocus autoComplete="name" value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ex.: Ana Oliveira" /></label><div className="cockpit-form-pair"><label>E-mail (opcional)<input type="email" autoComplete="email" aria-invalid={!emailValid} value={draft.email} onChange={(event) => update({ email: event.target.value.trimStart() })} placeholder="ana@email.com" />{!emailValid && <small className="cockpit-field-error">Informe um e-mail completo, como nome@empresa.com.br.</small>}</label><label>WhatsApp (opcional)<input inputMode="tel" autoComplete="tel-national" maxLength={15} aria-invalid={!phoneValid} value={draft.phone} onChange={(event) => update({ phone: formatBrazilPhone(event.target.value) })} placeholder="(11) 99999-0000" />{!phoneValid && <small className="cockpit-field-error">Informe DDD + telefone com 10 ou 11 dígitos.</small>}</label></div></>}
      {step === 2 && <><div className="cockpit-airports"><label>Origem<input autoFocus inputMode="text" autoCapitalize="characters" maxLength={3} value={draft.origin} onChange={(event) => update({ origin: formatAirportCode(event.target.value) })} placeholder="GRU" /></label><span>→</span><label>Destino<input inputMode="text" autoCapitalize="characters" maxLength={3} value={draft.destination} onChange={(event) => update({ destination: formatAirportCode(event.target.value) })} placeholder="LIS" /></label></div><div className="cockpit-form-pair"><label>Data de ida<input type="date" value={draft.departureDate} onInput={(event) => update({ departureDate: event.currentTarget.value })} onChange={(event) => update({ departureDate: event.target.value })} /></label><label>Data de volta<input type="date" value={draft.returnDate} onInput={(event) => update({ returnDate: event.currentTarget.value })} onChange={(event) => update({ returnDate: event.target.value })} /></label></div><div className="cockpit-form-pair"><label>Viajantes<input min="1" max="9" inputMode="numeric" type="number" value={draft.passengers} onChange={(event) => update({ passengers: Number(event.target.value) })} /></label><label>Conexões aceitas<select value={draft.maxConnections} onChange={(event) => update({ maxConnections: Number(event.target.value) })}><option value={0}>Nenhuma</option><option value={1}>Até 1</option><option value={2}>Até 2</option></select></label></div><label>Orçamento total (opcional)<div className="cockpit-money-input"><span>R$</span><input type="number" inputMode="decimal" min="0" value={draft.budgetBRL} onChange={(event) => update({ budgetBRL: event.target.value })} placeholder="8.000" /></div></label></>}
      {step === 3 && <><label>Programa principal<select autoFocus value={draft.program} onChange={(event) => update({ program: event.target.value })}><option>Livelo</option><option>Smiles</option><option>LATAM Pass</option><option>Azul Fidelidade</option><option>Esfera</option><option>TAP Miles&amp;Go</option><option>Outro</option></select></label><div className="cockpit-form-pair"><label>Saldo disponível<input type="number" min="0" value={draft.balance} onChange={(event) => update({ balance: event.target.value })} placeholder="120000" /></label><label>Valor de referência / 1.000<input type="number" min="0" step="0.01" value={draft.referenceValue} onChange={(event) => update({ referenceValue: event.target.value })} placeholder="20" /></label></div><div className="cockpit-source-note"><ModeBadge mode="manual" /><p>Este saldo foi informado pelo agente e ficará identificado como dado manual.</p></div></>}
    </div>
    {error && <div className="cockpit-inline-error"><b>Não salvou.</b> {error}</div>}
    <footer className="cockpit-drawer__actions"><button className="cockpit-secondary" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Cancelar" : "Voltar"}</button><button className="cockpit-primary" disabled={!validStep || loading} onClick={step === 3 ? save : () => setStep(step + 1)}>{loading ? "Salvando…" : step === 3 ? "Criar e simular" : "Continuar"}<span>→</span></button></footer>
  </section></div>;
}

function PromotionDrawer({ cases, onClose, onSaved }: { cases: CaseRecord[]; onClose: () => void; onSaved: () => void }) {
  const [caseId, setCaseId] = useState(cases[0]?.id || "");
  const [sourceProgram, setSourceProgram] = useState("Livelo");
  const [targetProgram, setTargetProgram] = useState("TAP Miles&Go");
  const [bonusPercent, setBonusPercent] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function chooseCase(id: string) {
    setCaseId(id);
    const selected = cases.find((item) => item.id === id);
    const input = selected ? caseInputOf(selected) : null;
    const strategy = input ? pickObject(input, ["strategy"]) : {};
    if (textValue(strategy.sourceProgram)) setSourceProgram(textValue(strategy.sourceProgram));
    if (textValue(strategy.targetProgram)) setTargetProgram(textValue(strategy.targetProgram));
  }
  async function save() {
    setLoading(true); setError(null);
    const observedAt = new Date().toISOString();
    try {
      await readJson(await fetch("/api/opportunities/promotion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: crypto.randomUUID(), type: "TRANSFER_BONUS", sourceProgram, targetProgram, bonusPercent, startsAt: observedAt, endsAt: new Date(Date.now() + 7 * 86400000).toISOString(), source: `Cadastro manual pelo agente${caseId ? ` · referência ${caseId}` : ""}` }) }));
      onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível registrar a promoção."); }
    finally { setLoading(false); }
  }
  return <div className="cockpit-overlay" onMouseDown={onClose}><section className="cockpit-drawer cockpit-drawer--compact" role="dialog" aria-modal="true" aria-labelledby="promotion-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="cockpit-drawer__close" onClick={onClose} aria-label="Fechar promoção">×</button><header><span>EVENTO DE MONITORAMENTO</span><h2 id="promotion-title">Registrar promoção</h2><p>O motor recalcula os casos afetados e cria oportunidades quando a condição fizer sentido.</p></header><div className="cockpit-drawer__form"><label>Preencher programas a partir de<select value={caseId} onChange={(event) => chooseCase(event.target.value)}><option value="">Informar manualmente</option>{cases.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="cockpit-form-pair"><label>Programa de origem<input value={sourceProgram} onChange={(event) => setSourceProgram(event.target.value)} /></label><label>Programa de destino<input value={targetProgram} onChange={(event) => setTargetProgram(event.target.value)} /></label></div><label>Bônus de transferência<div className="cockpit-percent-input"><input type="number" min="0" max="300" value={bonusPercent} onChange={(event) => setBonusPercent(Number(event.target.value))} /><span>%</span></div></label><div className="cockpit-source-note"><ModeBadge mode="manual" /><p>Origem: cadastro manual · o evento será cruzado com todos os casos compatíveis.</p></div></div>{error && <div className="cockpit-inline-error"><b>Ops.</b> {error}</div>}<footer className="cockpit-drawer__actions"><button type="button" className="cockpit-secondary" onClick={onClose}>Cancelar</button><button type="button" className="cockpit-primary" onClick={save} disabled={loading || bonusPercent <= 0}>{loading ? "Processando…" : "Registrar e recalcular"}<span>✦</span></button></footer></section></div>;
}

function WalletDrawer({ item, onClose, onSaved }: { item: CaseRecord; onClose: () => void; onSaved: (updated: CaseRecord) => void }) {
  const input = caseInputOf(item);
  const wallet = input ? pickObject(input, ["wallet"]) : {};
  const strategy = input ? pickObject(input, ["strategy"]) : {};
  const promotion = input ? pickObject(input, ["promotion"]) : {};
  const initialRows = walletDraftsOf(wallet);
  const [rows, setRows] = useState<WalletBalanceDraft[]>(initialRows.length ? initialRows : [{
    id: "new-program",
    program: "Livelo",
    balance: "0",
    referenceValue: "20",
    expiresAt: "",
    source: "Cadastro manual pelo agente",
    updatedAt: new Date().toISOString().slice(0, 10),
  }]);
  const [primaryProgram, setPrimaryProgram] = useState(textValue(strategy.sourceProgram) || initialRows[0]?.program || "Livelo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(id: string, patch: Partial<WalletBalanceDraft>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function addRow() {
    const program = walletPrograms.find((candidate) => !rows.some((row) => row.program.toLocaleLowerCase("pt-BR") === candidate.toLocaleLowerCase("pt-BR"))) || "Outro programa";
    setRows((current) => [...current, {
      id: crypto.randomUUID(),
      program,
      balance: "0",
      referenceValue: "20",
      expiresAt: "",
      source: "Cadastro manual pelo agente",
      updatedAt: new Date().toISOString().slice(0, 10),
    }]);
  }

  function removeRow(id: string) {
    if (rows.length === 1) return;
    const removing = rows.find((row) => row.id === id);
    const remaining = rows.filter((row) => row.id !== id);
    setRows(remaining);
    if (removing?.program === primaryProgram) setPrimaryProgram(remaining[0]?.program || "");
  }

  async function save() {
    if (!input) { setError("Este caso não possui uma carteira editável."); return; }
    const normalizedPrograms = rows.map((row) => row.program.trim().toLocaleLowerCase("pt-BR"));
    if (rows.some((row) => !row.program.trim())) { setError("Informe o nome de todos os programas."); return; }
    if (new Set(normalizedPrograms).size !== normalizedPrograms.length) { setError("Cada programa pode aparecer apenas uma vez na carteira."); return; }
    if (rows.some((row) => !Number.isInteger(Number(row.balance)) || Number(row.balance) < 0)) { setError("Os saldos precisam ser números inteiros maiores ou iguais a zero."); return; }
    if (rows.some((row) => !Number.isFinite(Number(row.referenceValue)) || Number(row.referenceValue) <= 0)) { setError("Informe um preço de milheiro maior que zero para cada programa."); return; }
    if (!rows.some((row) => row.program === primaryProgram)) { setError("Escolha qual programa será usado como origem no cálculo."); return; }

    setLoading(true); setError(null);
    const observedAt = new Date().toISOString();
    const currentWallet: Wallet = {
      travelerId: textValue(wallet.travelerId),
      source: textValue(wallet.source) || "Cadastro manual pelo agente",
      balances: [],
    };
    const nextWallet = replaceWalletBalances(currentWallet, rows.map((row) => ({
      program: row.program,
      balance: Number(row.balance),
      referenceValuePer1000BRL: Number(row.referenceValue),
      expiresAt: row.expiresAt || null,
      source: row.source,
      updatedAt: row.updatedAt || observedAt,
    })), { source: "Carteira editada manualmente pelo agente", observedAt });
    const previousPrimary = textValue(strategy.sourceProgram);
    const nextStrategy = { ...strategy, sourceProgram: primaryProgram };
    const nextPromotion = textValue(promotion.sourceProgram) === previousPrimary
      ? { ...promotion, sourceProgram: primaryProgram }
      : promotion;
    const nextInput = { ...input, wallet: nextWallet, strategy: nextStrategy, promotion: nextPromotion, now: observedAt };
    try {
      const updated = normalizeCase(await readJson(await fetch(`/api/cases/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: nextInput }) })), Date.now());
      onSaved(updated);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar a carteira."); }
    finally { setLoading(false); }
  }

  return <div className="cockpit-overlay" onMouseDown={onClose}><section className="cockpit-drawer cockpit-drawer--wallet" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="cockpit-drawer__close" onClick={onClose} aria-label="Fechar carteira">×</button><header><span>CARTEIRA DO CLIENTE</span><h2 id="wallet-title">Saldos e preço do milheiro</h2><p>Cadastre cada programa com o custo de referência usado pelo motor. A fonte e a data ficam visíveis para conferência.</p></header><div className="cockpit-drawer__form"><label>Programa usado na estratégia<select value={primaryProgram} onChange={(event) => setPrimaryProgram(event.target.value)}>{rows.map((row) => <option value={row.program} key={row.id}>{row.program || "Programa sem nome"}</option>)}</select><small className="cockpit-field-help">O motor usa o saldo e o preço deste programa para calcular o custo econômico.</small></label><div className="cockpit-wallet-list">{rows.map((row, index) => <article className="cockpit-wallet-row" key={row.id}><header><div><span>PROGRAMA {index + 1}</span><b>{row.program || "Novo programa"}</b></div><button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={`Remover ${row.program || `programa ${index + 1}`}`}>Remover</button></header><label>Programa<input list="milesai-wallet-programs" value={row.program} onChange={(event) => { const program = event.target.value; updateRow(row.id, { program }); if (primaryProgram === row.program) setPrimaryProgram(program); }} placeholder="Ex.: Livelo" /></label><div className="cockpit-form-pair"><label>Saldo disponível<input type="number" min="0" step="1" value={row.balance} onChange={(event) => updateRow(row.id, { balance: event.target.value })} /></label><label>Preço do milheiro (R$)<input type="number" min="0.01" step="0.01" value={row.referenceValue} onChange={(event) => updateRow(row.id, { referenceValue: event.target.value })} /></label></div><div className="cockpit-form-pair"><label>Atualizado em<input type="date" value={row.updatedAt} onInput={(event) => updateRow(row.id, { updatedAt: event.currentTarget.value })} onChange={(event) => updateRow(row.id, { updatedAt: event.target.value })} /></label><label>Validade dos pontos (opcional)<input type="date" value={row.expiresAt} onInput={(event) => updateRow(row.id, { expiresAt: event.currentTarget.value })} onChange={(event) => updateRow(row.id, { expiresAt: event.target.value })} /></label></div><label>Fonte do saldo e do preço<input value={row.source} onChange={(event) => updateRow(row.id, { source: event.target.value })} placeholder="Ex.: extrato enviado pelo cliente" /></label></article>)}</div><datalist id="milesai-wallet-programs">{walletPrograms.map((program) => <option value={program} key={program} />)}</datalist><button type="button" className="cockpit-wallet-add" onClick={addRow}>＋ Adicionar outro programa</button><div className="cockpit-source-note"><ModeBadge mode="manual" /><p>A edição salva um novo snapshot da carteira e recalcula a recomendação sem realizar transferências.</p></div></div>{error && <div className="cockpit-inline-error" role="alert"><b>Não salvou.</b> {error}</div>}<footer className="cockpit-drawer__actions"><button type="button" className="cockpit-secondary" onClick={onClose}>Cancelar</button><button type="button" className="cockpit-primary" disabled={loading} onClick={save}>{loading ? "Salvando…" : "Salvar e recalcular"}<span>→</span></button></footer></section></div>;
}

function ScenarioDrawer({ item, onClose, onSaved }: { item: CaseRecord; onClose: () => void; onSaved: (updated: CaseRecord) => void }) {
  const input = caseInputOf(item);
  const offers = input && Array.isArray(input.offers) ? input.offers.filter(isObject) : [];
  const initialAward = offers.find((offer) => offer.kind === "award") || {};
  const initialCash = offers.find((offer) => offer.kind === "cash") || {};
  const promotion = input ? pickObject(input, ["promotion"]) : {};
  const wallet = input ? pickObject(input, ["wallet"]) : {};
  const strategy = input ? pickObject(input, ["strategy"]) : {};
  const balances = Array.isArray(wallet.balances) ? wallet.balances.filter(isObject) : [];
  const activeProgram = textValue(strategy.sourceProgram, balances[0]?.program) || "programa principal";
  const activeBalanceIndex = Math.max(0, balances.findIndex((balance) => textValue(balance.program) === activeProgram));
  const activeBalance = balances[activeBalanceIndex] || {};
  const [cashTotal, setCashTotal] = useState(numberValue(initialCash.totalBRL));
  const [awardMiles, setAwardMiles] = useState(numberValue(initialAward.miles));
  const [taxesBRL, setTaxesBRL] = useState(numberValue(initialAward.taxesBRL));
  const [available, setAvailable] = useState(initialAward.available !== false);
  const [bonusPercent, setBonusPercent] = useState(numberValue(promotion.bonusPercent));
  const [walletBalance, setWalletBalance] = useState(numberValue(activeBalance.balance));
  const [referenceValue, setReferenceValue] = useState(numberValue(activeBalance.referenceValuePer1000BRL));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!input) { setError("Este caso não possui um cenário editável."); return; }
    setLoading(true); setError(null);
    const observedAt = new Date().toISOString();
    const nextOffers = offers.map((offer) => offer.kind === "cash"
      ? { ...offer, totalBRL: cashTotal, observedAt, source: "Valor manual do simulador" }
      : offer.kind === "award"
        ? { ...offer, miles: awardMiles, taxesBRL, available, observedAt, source: "Oferta award manual do simulador" }
        : offer);
    const nextPromotion = { ...promotion, bonusPercent, startsAt: observedAt, source: "Bônus manual do simulador" };
    const nextBalances = balances.length ? balances.map((balance, index) => index === activeBalanceIndex ? { ...balance, balance: walletBalance, referenceValuePer1000BRL: referenceValue, source: "Laboratório de cenário", updatedAt: observedAt } : balance) : [];
    const nextWallet = { ...wallet, balances: nextBalances, source: "Carteira manual do simulador" };
    const nextInput = { ...input, wallet: nextWallet, offers: nextOffers, promotion: nextPromotion, now: observedAt };
    try {
      const updated = normalizeCase(await readJson(await fetch(`/api/cases/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: nextInput }) })), Date.now());
      onSaved(updated);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar o cenário."); }
    finally { setLoading(false); }
  }

  return <div className="cockpit-overlay" onMouseDown={onClose}><section className="cockpit-drawer cockpit-drawer--compact" role="dialog" aria-modal="true" aria-labelledby="scenario-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="cockpit-drawer__close" onClick={onClose} aria-label="Fechar laboratório">×</button><header><span>LABORATÓRIO DE CENÁRIO</span><h2 id="scenario-title">Ajustar e recalcular</h2><p>Altere os dados observados. O caso será salvo e o motor rodará novamente com os novos valores.</p></header><div className="cockpit-drawer__form"><div className="cockpit-scenario-wallet"><header><span>CARTEIRA USADA NO CÁLCULO</span><b>{activeProgram}</b></header><div className="cockpit-form-pair"><label>Saldo disponível<input type="number" min="0" value={walletBalance} onChange={(event) => setWalletBalance(Number(event.target.value))} /></label><label>Preço do milheiro (R$)<input type="number" min="0.01" step="0.01" value={referenceValue} onChange={(event) => setReferenceValue(Number(event.target.value))} /></label></div><small>O preço do milheiro representa o valor econômico de cada 1.000 pontos.</small></div><div className="cockpit-form-pair"><label>Preço total em dinheiro<input type="number" min="0" value={cashTotal} onChange={(event) => setCashTotal(Number(event.target.value))} /></label><label>Milhas da emissão award<input type="number" min="0" value={awardMiles} onChange={(event) => setAwardMiles(Number(event.target.value))} /></label></div><div className="cockpit-form-pair"><label>Taxas da emissão (R$)<input type="number" min="0" value={taxesBRL} onChange={(event) => setTaxesBRL(Number(event.target.value))} /></label><label>Bônus de transferência<div className="cockpit-percent-input"><input type="number" min="0" max="300" value={bonusPercent} onChange={(event) => setBonusPercent(Number(event.target.value))} /><span>%</span></div></label></div><label className="cockpit-check"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /><span>Oferta award disponível para emissão</span></label><div className="cockpit-source-note"><ModeBadge mode="manual" /><p>Esses valores substituem o cenário atual e ficam identificados como entrada manual.</p></div></div>{error && <div className="cockpit-inline-error"><b>Não salvou.</b> {error}</div>}<footer className="cockpit-drawer__actions"><button type="button" className="cockpit-secondary" onClick={onClose}>Cancelar</button><button type="button" className="cockpit-primary" disabled={loading || referenceValue <= 0} onClick={save}>{loading ? "Salvando…" : "Salvar e recalcular"}<span>→</span></button></footer></section></div>;
}

export default function MilesAICockpit() {
  const [view, setView] = useState<View>("dashboard");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string>();

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError(null);
    const results = await Promise.allSettled([fetch("/api/cases", { cache: "no-store" }).then(readJson), fetch("/api/opportunities", { cache: "no-store" }).then(readJson)]);
    if (results[0].status === "fulfilled") setCases(unwrapList(results[0].value, ["cases", "data", "items", "clients"]).map(normalizeCase));
    if (results[1].status === "fulfilled") setOpportunities(unwrapList(results[1].value, ["opportunities", "data", "items"]).map(normalizeOpportunity));
    if (results.every((result) => result.status === "rejected")) setError("A operação ainda não respondeu. Verifique o servidor e tente atualizar.");
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const hasOverlay = newOpen || promoOpen || walletOpen || scenarioOpen;
    if (hasOverlay) document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (scenarioOpen) setScenarioOpen(false);
      else if (walletOpen) setWalletOpen(false);
      else if (promoOpen) setPromoOpen(false);
      else if (newOpen) setNewOpen(false);
      else if (evaluation || evaluatingId) { setEvaluation(null); setEvaluatingId(undefined); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [evaluation, evaluatingId, newOpen, promoOpen, scenarioOpen, walletOpen]);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedId), [cases, selectedId]);

  async function evaluateCase(item: CaseRecord, extra?: JsonObject) {
    setEvaluatingId(item.id); setSelectedId(item.id); setEvaluation(null); setError(null);
    try {
      const payload = await readJson(await fetch(`/api/cases/${encodeURIComponent(item.id)}/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(extra || {}) }));
      const root = isObject(payload) ? payload : {};
      const strategy = isObject(root.result) ? root.result : isObject(root.strategy) ? root.strategy : isObject(root.evaluation) ? root.evaluation : root;
      setEvaluation(strategy as Evaluation);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível calcular a estratégia."); }
    finally { setEvaluatingId(undefined); }
  }

  async function handleOpportunity(item: Opportunity) {
    const linked = cases.find((candidate) => candidate.id === item.caseId);
    if (linked) await evaluateCase(linked, { opportunity: item.raw });
    else setView("clients");
  }

  async function applyFlightOffer(offer: FlightOffer, caseId?: string) {
    const linked = cases.find((item) => item.id === caseId);
    if (!linked) { setNewOpen(true); return; }
    const input = caseInputOf(linked);
    if (!input) { setError("O caso selecionado não possui dados suficientes para receber a oferta."); return; }
    const observedAt = new Date().toISOString();
    const existingOffers = Array.isArray(input.offers) ? input.offers.filter(isObject) : [];
    const cashOffer = { id: offer.id, kind: "cash", totalBRL: offer.totalBRL, passengers: linked.passengers, connections: offer.connections, available: true, source: offer.source, observedAt };
    const nextOffers = existingOffers.some((item) => item.kind === "cash") ? existingOffers.map((item) => item.kind === "cash" ? cashOffer : item) : [cashOffer, ...existingOffers];
    try {
      const updated = normalizeCase(await readJson(await fetch(`/api/cases/${encodeURIComponent(linked.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: { ...input, offers: nextOffers, now: observedAt } }) })), Date.now());
      setCases((current) => current.map((item) => item.id === updated.id ? updated : item));
      setView("clients");
      await evaluateCase(updated);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível aplicar esta tarifa ao caso."); }
  }

  return <div className="cockpit-shell">
    <Navigation view={view} setView={setView} counts={{ clients: cases.length, opportunities: opportunities.length }} />
    <main className="cockpit-main">{view !== "dashboard" && <Topbar view={view} onNew={() => setNewOpen(true)} onRefresh={() => void loadData(true)} refreshing={refreshing} />}
      <div className="cockpit-content">{error && <div className="cockpit-error" role="alert"><span>!</span><p><b>Não foi possível concluir.</b>{error}</p><button onClick={() => void loadData(true)}>Tentar novamente</button></div>}
        {view === "dashboard" && <MilesAIDashboard cases={cases.map((item) => item.raw)} opportunities={opportunities.map((item) => item.raw)} loading={loading} error={error} onCreateCase={() => setNewOpen(true)} onOpenCase={(caseId) => { setSelectedId(caseId); setView("clients"); setWalletOpen(true); }} onOpenOpportunities={() => setView("opportunities")} onOpenFlights={() => setView("flights")} onRefresh={() => loadData(true)} />}
        {view === "clients" && <ClientsView cases={cases} opportunities={opportunities} loading={loading} selectedId={selectedId} onEvaluate={(item) => void evaluateCase(item)} onWallet={(item) => { setSelectedId(item.id); setWalletOpen(true); }} evaluatingId={evaluatingId} onNew={() => setNewOpen(true)} />}
        {view === "opportunities" && <OpportunitiesView items={opportunities} loading={loading} onEvaluate={(item) => void handleOpportunity(item)} busyId={evaluatingId} onPromo={() => setPromoOpen(true)} />}
        {view === "flights" && <FlightsView cases={cases} onUseOffer={(offer, caseId) => void applyFlightOffer(offer, caseId)} />}
        <EvaluationPanel evaluation={evaluation} caseRecord={selectedCase} loading={Boolean(evaluatingId)} onClose={() => { setEvaluation(null); setEvaluatingId(undefined); }} onEdit={() => setScenarioOpen(true)} onWallet={() => setWalletOpen(true)} />
      </div>
    </main>
    {newOpen && <NewCaseDrawer onClose={() => setNewOpen(false)} onCreated={(item) => { setCases((current) => [item, ...current.filter((candidate) => candidate.id !== item.id)]); setNewOpen(false); setSelectedId(item.id); void evaluateCase(item); }} />}
    {promoOpen && <PromotionDrawer cases={cases} onClose={() => setPromoOpen(false)} onSaved={() => { setPromoOpen(false); setView("opportunities"); void loadData(true); }} />}
    {walletOpen && selectedCase && <WalletDrawer item={selectedCase} onClose={() => setWalletOpen(false)} onSaved={(updated) => { setCases((current) => current.map((item) => item.id === updated.id ? updated : item)); setWalletOpen(false); void evaluateCase(updated); }} />}
    {scenarioOpen && selectedCase && <ScenarioDrawer item={selectedCase} onClose={() => setScenarioOpen(false)} onSaved={(updated) => { setCases((current) => current.map((item) => item.id === updated.id ? updated : item)); setScenarioOpen(false); void evaluateCase(updated); }} />}
  </div>;
}
