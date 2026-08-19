"use client";

import { useMemo, useState } from "react";
import { demoScenario } from "@/data/demo";
import type { OptionResult, PromotionReplayResult, StrategyResult } from "@/domain/types";
import type { AnalysisResult } from "@/server/orchestrator";
import type { StrategyExplanation } from "@/server/fallback";

type Analysis = AnalysisResult;
type ReplayResponse = PromotionReplayResult & { explanation: StrategyExplanation };

const decisionLabels: Record<StrategyResult["decision"], string> = {
  BUY_CASH: "COMPRE EM DINHEIRO",
  USE_POINTS: "EXECUTE A ESTRATÉGIA",
  BUY_MILES: "CONSIDERE A COTAÇÃO",
  WAIT: "ESPERE",
  REVIEW: "REVISE OS DADOS",
};

const optionMeta: Record<OptionResult["kind"], { number: string; eyebrow: string }> = {
  cash: { number: "01", eyebrow: "DINHEIRO" },
  own_points: { number: "02", eyebrow: "SEUS PONTOS" },
  miles_broker: { number: "03", eyebrow: "COTAÇÃO DE MILHAS" },
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><span className="brand-mark__dot" /></span>;
}

function AnalysisSteps() {
  return (
    <div className="analysis-steps" aria-label="Etapas concluídas">
      {["Perfil entendido", "Carteira organizada", "3 caminhos comparados", "Recomendação criada"].map((step) => (
        <span key={step}><b>✓</b>{step}</span>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <section className="loading-card" aria-live="polite">
      <span className="loading-orbit" aria-hidden="true"><BrandMark /></span>
      <div>
        <span className="section-kicker">ANÁLISE EM ANDAMENTO</span>
        <h2>Organizando o cenário de João</h2>
        <p>Estruturando o perfil e calculando os três caminhos com o motor determinístico.</p>
      </div>
      <div className="loading-lines" aria-hidden="true"><i /><i /><i /></div>
    </section>
  );
}

function ComparisonCard({ option, recommended }: { option: OptionResult; recommended: boolean }) {
  const meta = optionMeta[option.kind];
  return (
    <article className={`option-card ${recommended ? "option-card--recommended" : ""} ${!option.eligible ? "option-card--muted" : ""}`}>
      <div className="option-card__top">
        <span className="option-number">{meta.number}</span>
        <span className="option-eyebrow">{meta.eyebrow}</span>
        {recommended && <span className="recommended-chip">RECOMENDADO</span>}
      </div>
      <h4>{option.label}</h4>
      <div className="option-primary-value">{formatBRL(option.cashOutlayBRL)}</div>
      <span className="value-label">desembolso agora</span>
      <dl className="option-metrics">
        <div><dt>Custo econômico</dt><dd>{formatBRL(option.economicCostBRL)}</dd></div>
        <div><dt>Vs. dinheiro</dt><dd className={option.savingsVsCashBRL > 0 ? "positive" : ""}>{option.savingsVsCashBRL > 0 ? `− ${formatBRL(option.savingsVsCashBRL)}` : "referência"}</dd></div>
      </dl>
      <p className="option-reason">{option.reasons[0]}</p>
      <footer>
        <span className={`eligibility ${option.eligible ? "eligibility--yes" : "eligibility--no"}`}>{option.eligible ? "Elegível" : "Inelegível"}</span>
        <span>Fonte mock · {formatDate(option.observedAt)}</span>
      </footer>
    </article>
  );
}

function ProfileEditor({ analysis, onClose, onSave }: { analysis: Analysis; onClose: () => void; onSave: (profile: Analysis["profile"]) => void }) {
  const [draft, setDraft] = useState(analysis.profile);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <span className="section-kicker">PERFIL ESTRUTURADO</span>
        <h2 id="profile-title">Editar perfil do cliente</h2>
        <p className="drawer-intro">Ajuste as informações informadas pelo agente. Saldos e ofertas continuam simulados.</p>
        <label>Nome do cliente<input value={draft.travelerName} onChange={(event) => setDraft({ ...draft, travelerName: event.target.value })} /></label>
        <div className="form-row">
          <label>Origem<input maxLength={3} value={draft.origin} onChange={(event) => setDraft({ ...draft, origin: event.target.value.toUpperCase() })} /></label>
          <label>Destino<input maxLength={3} value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value.toUpperCase() })} /></label>
        </div>
        <div className="form-row">
          <label>Viajantes<input type="number" min="1" value={draft.passengers} onChange={(event) => setDraft({ ...draft, passengers: Number(event.target.value) })} /></label>
          <label>Flexibilidade<input type="number" min="0" value={draft.flexDays} onChange={(event) => setDraft({ ...draft, flexDays: Number(event.target.value) })} /></label>
        </div>
        <label className="check-label"><input type="checkbox" checked={draft.acceptsConnections} onChange={(event) => setDraft({ ...draft, acceptsConnections: event.target.checked })} />Aceita uma conexão</label>
        <button className="primary-button primary-button--wide" type="button" onClick={() => onSave(draft)}>Salvar perfil</button>
      </section>
    </div>
  );
}

function BeginnerDrawer({ strategy, onClose }: { strategy: StrategyResult; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="drawer drawer--steps" role="dialog" aria-modal="true" aria-labelledby="steps-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <span className="section-kicker section-kicker--green">MODO INICIANTE</span>
        <h2 id="steps-title">Faça assim, passo a passo</h2>
        <p className="drawer-intro">Um roteiro simples para o agente executar com segurança.</p>
        <ol className="beginner-list">{strategy.beginnerSteps.map((step) => <li key={step}><span>{step}</span></li>)}</ol>
        <div className="guardrail"><b>Antes de transferir</b><p>As condições e a disponibilidade podem mudar. Confirme os dados no programa antes de transferir; transferências de pontos podem ser irreversíveis.</p></div>
      </section>
    </div>
  );
}

function PromotionAlert({ replay, onOpenSteps }: { replay: ReplayResponse; onOpenSteps: () => void }) {
  const points = replay.updated.options.find((option) => option.kind === "own_points");
  const transfer = points?.transfer;
  return (
    <section className="wow-alert" role="alert">
      <div className="wow-signal" aria-hidden="true"><span>!</span></div>
      <div className="wow-copy">
        <span className="section-kicker section-kicker--light">OPORTUNIDADE ENCONTRADA</span>
        <h2>Chegou a condição que estávamos esperando.</h2>
        <p>Livelo → TAP com <b>{replay.event.bonusPercent}% de bônus</b>. A estratégia de João foi recalculada automaticamente.</p>
      </div>
      <div className="wow-metric"><span>economia econômica estimada</span><strong>{formatBRL(points?.savingsVsCashBRL ?? 0)}</strong><small>Dados simulados</small></div>
      <div className="wow-transfer">
        <div><span>Transfira</span><b>{formatPoints(transfer?.sourcePoints ?? 0)} Livelo</b></div><span className="wow-arrow">→</span><div><span>Resultado</span><b>{formatPoints(transfer?.resultingMiles ?? 0)} milhas</b></div>
      </div>
      <button className="light-button" type="button" onClick={onOpenSteps}>Ver ação recomendada <span>→</span></button>
    </section>
  );
}

function Header() {
  return (
    <header className="app-header">
      <a className="brand" href="#top" aria-label="MilesAI, início"><BrandMark /><b>MilesAI</b></a>
      <div className="header-context"><span>OPENAI HACKATHON BRASIL</span><i />PEQUENOS NEGÓCIOS</div>
      <span className="persistent-mock"><i /> DADOS SIMULADOS</span>
    </header>
  );
}

export default function MilesAIApp() {
  const [message, setMessage] = useState(demoScenario.inputMessage);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);

  const strategy = replay?.updated ?? analysis?.strategy;
  const pointsOption = useMemo(() => strategy?.options.find((option) => option.kind === "own_points"), [strategy]);

  async function analyze() {
    setLoading(true); setError(null); setReplay(null);
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível analisar a viagem.");
      setAnalysis(payload as Analysis);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível analisar a viagem.");
    } finally { setLoading(false); }
  }

  async function simulatePromotion() {
    setPromotionLoading(true); setError(null);
    try {
      const response = await fetch("/api/promotion", { method: "POST" });
      if (!response.ok) throw new Error("Não foi possível simular a promoção.");
      setReplay(await response.json() as ReplayResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível simular a promoção.");
    } finally { setPromotionLoading(false); }
  }

  function resetDemo() { setMessage(demoScenario.inputMessage); setAnalysis(null); setReplay(null); setError(null); }
  function saveProfile(profile: Analysis["profile"]) { if (analysis) setAnalysis({ ...analysis, profile }); setProfileOpen(false); }

  return (
    <div id="top" className={`app-shell ${replay ? "app-shell--execute" : ""}`}>
      <Header />
      <main className="app-main">
        <section className="intro-row">
          <div><span className="section-kicker">COPILOTO DE DECISÃO</span><h1>Uma estratégia clara para cada viagem.</h1></div>
          <p>Transforme a mensagem do cliente em uma decisão verificável sobre dinheiro, pontos e promoções.</p>
        </section>

        <div className="workspace-grid">
          <aside className="conversation-panel">
            <div className="panel-heading"><div><span className="panel-index">01</span><h2>Pedido do cliente</h2></div><button type="button" className="text-button" onClick={resetDemo}>Recomeçar</button></div>
            <div className="client-message"><div className="client-avatar">J</div><div><b>Mensagem recebida</b><span>WhatsApp · agora</span></div></div>
            <label className="message-box"><span className="sr-only">Descrição da viagem</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={8} /><span className="message-count">{message.length}/4000</span></label>
            <button className="primary-button" type="button" onClick={analyze} disabled={loading}>{loading ? "Analisando…" : analysis ? "Analisar novamente" : "Analisar viagem"}<span aria-hidden="true">→</span></button>
            <p className="privacy-note"><span>◆</span> Nenhuma compra ou transferência será executada.</p>
            {analysis && <div className="ai-mode-card"><span className={`ai-dot ${analysis.aiMode === "openai" ? "ai-dot--online" : ""}`} /><div><b>{analysis.aiMode === "openai" ? "OpenAI ativa" : "Modo de demonstração"}</b><span>{analysis.aiMode === "openai" ? "Perfil extraído com saída estruturada" : "Fallback local, sem dependência de API"}</span></div></div>}
          </aside>

          <section className="decision-panel">
            {error && <div className="error-banner" role="alert"><b>Precisamos revisar</b><span>{error}</span></div>}
            {loading && <LoadingState />}
            {!loading && !analysis && (
              <div className="empty-state"><div className="empty-compass"><BrandMark /></div><span className="section-kicker">CASO DE DEMONSTRAÇÃO PRONTO</span><h2>Da intenção à ação, sem planilha.</h2><p>O caso de João já está carregado. Clique em “Analisar viagem” para estruturar o perfil, comparar três caminhos e registrar a condição certa.</p><div className="empty-flow"><span>Mensagem</span><i>→</i><span>Estratégia</span><i>→</i><span>Oportunidade</span></div></div>
            )}

            {!loading && analysis && strategy && (
              <>
                <AnalysisSteps />
                <section className="profile-strip">
                  <div className="profile-main"><div className="profile-avatar">{analysis.profile.travelerName.slice(0, 1)}</div><div><span className="section-kicker">CLIENTE E VIAGEM</span><h3>{analysis.profile.travelerName} <i /> Roma, Itália</h3><p>{analysis.profile.origin} → {analysis.profile.destination} · maio/2027 · {analysis.profile.passengers} pessoas · ±{analysis.profile.flexDays} dias</p></div></div>
                  <button className="edit-button" type="button" onClick={() => setProfileOpen(true)}>Editar perfil</button>
                  <div className="wallet-inline"><span className="section-kicker">CARTEIRA INFORMADA</span>{analysis.profile.walletBalances.map((wallet) => <div className="wallet-balance" key={wallet.program}><b>{formatPoints(wallet.balance)}</b><span>{wallet.program}</span></div>)}</div>
                </section>

                {replay && <PromotionAlert replay={replay} onOpenSteps={() => setStepsOpen(true)} />}

                <section className={`strategy-hero strategy-hero--${strategy.action.toLowerCase()}`}>
                  <div className="decision-badge"><span>{replay ? "AGORA" : "DECISÃO"}</span><b>{decisionLabels[strategy.decision]}</b></div>
                  <div className="strategy-copy"><span className="section-kicker">RECOMENDAÇÃO MILESAI</span><h2>{replay ? "A promoção atingiu a meta. É hora de agir." : "Não transfira os pontos agora."}</h2><p>{replay ? replay.explanation.reason : analysis.explanation.reason}</p></div>
                  <div className="strategy-metric"><span>{replay ? "economia econômica" : "bônus atual"}</span><strong>{replay ? formatBRL(pointsOption?.savingsVsCashBRL ?? 0) : `${analysis.scenario.initialPromotion.bonusPercent}%`}</strong><small>{replay ? "estimada · dados simulados" : `meta: ${analysis.scenario.strategy.minimumBonusPercent}%`}</small></div>
                </section>

                <section className="comparison-section">
                  <div className="section-heading"><div><span className="panel-index">02</span><h2>Três caminhos, uma decisão</h2></div><p>Desembolso e custo econômico não são a mesma coisa.</p></div>
                  <div className="comparison-grid">{strategy.options.map((option) => <ComparisonCard key={option.id} option={option} recommended={strategy.action === "EXECUTE" && strategy.recommendedOptionId === option.id} />)}</div>
                </section>

                {!replay && strategy.watchCondition && (
                  <section className="watch-card"><div className="watch-icon"><span /></div><div className="watch-copy"><span className="section-kicker">CONDIÇÃO REGISTRADA</span><h3>Livelo → TAP com bônus de pelo menos 80%</h3><p>Quando um evento compatível chegar, o motor reavalia esta estratégia.</p></div><div className="watch-status"><span><i /> MONITORANDO</span><small>Cliente: João</small></div><button className="promotion-button" type="button" onClick={simulatePromotion} disabled={promotionLoading}>{promotionLoading ? "Reavaliando…" : "Simular nova promoção"}<span>90%</span></button></section>
                )}

                {replay && (
                  <section className="next-step-card"><div><span className="panel-index">03</span><div><span className="section-kicker">PRÓXIMO PASSO</span><h3>Confirme a emissão antes de transferir.</h3><p>{strategy.nextStep}</p></div></div><button className="primary-button" type="button" onClick={() => setStepsOpen(true)}>Abrir modo iniciante <span>→</span></button></section>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <footer className="app-footer"><span>MilesAI · protótipo do hackathon</span><span>Preços, saldos e promoções são simulados. Confirme tudo antes de agir.</span></footer>
      {profileOpen && analysis && <ProfileEditor analysis={analysis} onClose={() => setProfileOpen(false)} onSave={saveProfile} />}
      {stepsOpen && strategy && <BeginnerDrawer strategy={strategy} onClose={() => setStepsOpen(false)} />}
    </div>
  );
}

