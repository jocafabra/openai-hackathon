import {
  offerSchema,
  strategyResultSchema,
  transferPromotionSchema,
  travelRequestSchema,
  travelerProfileSchema,
  walletSchema,
} from "./schemas";
import { pointsValueBRL, roundBRL, roundPointsUp } from "./money";
import { scoreOption } from "./scoring";
import type {
  AwardOffer,
  CashOffer,
  MilesBrokerOffer,
  OptionResult,
  StrategyInput,
  StrategyResult,
} from "./types";

const beginnerExecutionSteps = [
  "Confirme que a emissão de 220 mil milhas ainda está disponível.",
  "Abra o aplicativo ou site da Livelo.",
  "Procure “Transferir pontos”.",
  "Escolha TAP Miles&Go.",
  "Informe 120 mil pontos.",
  "Confirme que a campanha de 90% está selecionada.",
  "Antes de concluir, confira nome, CPF e número TAP do cliente.",
  "Faça a transferência somente após essa conferência.",
  "Emita o trecho internacional.",
  "Compre o trecho FLN → GRU separadamente.",
];

function validateInput(input: StrategyInput): StrategyInput {
  return {
    traveler: travelerProfileSchema.parse(input.traveler),
    trip: travelRequestSchema.parse(input.trip),
    wallet: walletSchema.parse(input.wallet),
    offers: input.offers.map((offer) => offerSchema.parse(offer)),
    promotion: transferPromotionSchema.parse(input.promotion),
    strategy: input.strategy,
    now: input.now,
  } as StrategyInput;
}

function profileFit(input: StrategyInput, connections: number): number {
  if (connections > input.trip.maxConnections) return 0;
  if (connections > 0 && !input.traveler.acceptsConnections) return 0;
  return input.trip.objective === "economy" ? 100 : 80;
}

function cashOption(input: StrategyInput, offer: CashOffer | undefined): OptionResult {
  const eligible = Boolean(
    offer?.available
    && offer.passengers === input.trip.passengers
    && profileFit(input, offer.connections) > 0,
  );
  const cost = offer?.totalBRL ?? 0;
  const option: OptionResult = {
    id: offer?.id ?? "cash_unavailable",
    kind: "cash",
    label: "Comprar em dinheiro",
    eligible,
    cashOutlayBRL: cost,
    economicCostBRL: cost,
    savingsVsCashBRL: 0,
    complexity: 1,
    risk: "low",
    score: 0,
    reasons: eligible
      ? ["Compra simples e imediata, sem consumir pontos."]
      : ["Não há uma oferta em dinheiro compatível disponível."],
    assumptions: ["Tarifa total para duas pessoas com taxas nos dados simulados."],
    dataSource: offer?.source ?? "mock_hackathon_dataset",
    observedAt: offer?.observedAt ?? input.now,
  };
  option.score = scoreOption(option, cost, eligible ? profileFit(input, offer?.connections ?? 0) : 0);
  return option;
}

function pointsOption(
  input: StrategyInput,
  offer: AwardOffer | undefined,
  cashBaselineBRL: number,
): OptionResult {
  const wallet = input.wallet.balances.find(
    (balance) => balance.program === input.strategy.sourceProgram,
  );
  const bonusMultiplier = 1 + input.promotion.bonusPercent / 100;
  const sourcePoints = offer ? roundPointsUp(offer.miles / bonusMultiplier) : 0;
  const resultingMiles = Math.round(sourcePoints * bonusMultiplier);
  const plannedResultingMiles = Math.round(input.strategy.plannedSourcePoints * bonusMultiplier);
  const cashOutlay = offer ? offer.taxesBRL + offer.positioningFlightBRL : 0;
  const economicCost = wallet
    ? cashOutlay + pointsValueBRL(sourcePoints, wallet.referenceValuePer1000BRL)
    : cashOutlay;
  const compatibleRoute = Boolean(
    offer
    && offer.program === input.strategy.targetProgram
    && offer.passengers === input.trip.passengers
    && profileFit(input, offer.connections) > 0,
  );
  const promotionCompatible = (
    input.promotion.sourceProgram === input.strategy.sourceProgram
    && input.promotion.targetProgram === input.strategy.targetProgram
    && new Date(input.promotion.endsAt).getTime() >= new Date(input.now).getTime()
  );
  const hasBalance = Boolean(wallet && wallet.balance >= sourcePoints);
  const targetAvailable = Boolean(offer?.available);
  const economicallySound = economicCost <= cashBaselineBRL;
  const eligible = Boolean(
    compatibleRoute && promotionCompatible && hasBalance && targetAvailable && economicallySound,
  );

  const reasons: string[] = [];
  if (!targetAvailable) reasons.push("A emissão-alvo está indisponível; não transfira pontos.");
  if (!hasBalance) reasons.push("O saldo Livelo não cobre os pontos de origem necessários.");
  if (!economicallySound) reasons.push("O custo econômico dos pontos supera a compra em dinheiro.");
  if (eligible && input.promotion.bonusPercent < input.strategy.minimumBonusPercent) {
    reasons.push(`O bônus atual de ${input.promotion.bonusPercent}% está abaixo da meta de ${input.strategy.minimumBonusPercent}%.`);
  }
  if (eligible && input.promotion.bonusPercent >= input.strategy.minimumBonusPercent) {
    reasons.push(`A promoção de ${input.promotion.bonusPercent}% atingiu a condição monitorada.`);
  }
  reasons.push(`A transferência planejada de 120 mil pontos geraria ${plannedResultingMiles.toLocaleString("pt-BR")} milhas.`);

  const option: OptionResult = {
    id: "transfer_livelo_tap",
    kind: "own_points",
    label: "Transferir Livelo para TAP",
    eligible,
    cashOutlayBRL: roundBRL(cashOutlay),
    economicCostBRL: roundBRL(economicCost),
    savingsVsCashBRL: roundBRL(cashBaselineBRL - economicCost),
    complexity: 3,
    risk: "medium",
    score: 0,
    reasons,
    assumptions: [
      `${offer?.miles ?? 0} milhas para duas pessoas na emissão-alvo simulada.`,
      `Pontos Livelo avaliados em R$ ${wallet?.referenceValuePer1000BRL ?? 0} por mil.`,
    ],
    dataSource: offer?.source ?? "mock_hackathon_dataset",
    observedAt: offer?.observedAt ?? input.now,
    transfer: {
      sourceProgram: input.strategy.sourceProgram,
      targetProgram: input.strategy.targetProgram,
      sourcePoints,
      bonusPercent: input.promotion.bonusPercent,
      resultingMiles,
      plannedSourcePoints: input.strategy.plannedSourcePoints,
      plannedResultingMiles,
    },
  };
  option.score = scoreOption(
    option,
    cashBaselineBRL,
    compatibleRoute ? profileFit(input, offer?.connections ?? 0) : 0,
  );
  return option;
}

function brokerOption(
  input: StrategyInput,
  offer: MilesBrokerOffer | undefined,
  award: AwardOffer | undefined,
  cashBaselineBRL: number,
): OptionResult {
  const quoteActive = Boolean(offer && new Date(offer.expiresAt).getTime() >= new Date(input.now).getTime());
  const targetAvailable = Boolean(award?.available);
  const compatibleRoute = Boolean(offer && profileFit(input, offer.connections) > 0);
  const cost = offer
    ? (offer.miles / 1_000) * offer.pricePer1000BRL + offer.taxesBRL + offer.positioningFlightBRL
    : 0;
  const eligible = Boolean(offer?.available && quoteActive && targetAvailable && compatibleRoute);
  const option: OptionResult = {
    id: offer?.id ?? "broker_unavailable",
    kind: "miles_broker",
    label: "Comprar milhas na cotação",
    eligible,
    cashOutlayBRL: roundBRL(cost),
    economicCostBRL: roundBRL(cost),
    savingsVsCashBRL: roundBRL(cashBaselineBRL - cost),
    complexity: 3,
    risk: "medium",
    score: 0,
    reasons: eligible
      ? ["Cotação mockada reduz o custo, mas exige compra das milhas."]
      : [quoteActive ? "A emissão-alvo não está disponível." : "A cotação mockada está vencida."],
    assumptions: [
      `Cotação de R$ ${offer?.pricePer1000BRL ?? 0} por milheiro, sem executar transação.`,
    ],
    dataSource: offer?.source ?? "mock_hackathon_dataset",
    observedAt: offer?.observedAt ?? input.now,
  };
  option.score = scoreOption(
    option,
    cashBaselineBRL,
    compatibleRoute ? profileFit(input, offer?.connections ?? 0) : 0,
  );
  return option;
}

function watchCondition(input: StrategyInput) {
  return {
    id: "watch_italy_2027",
    travelerId: input.traveler.id,
    tripId: input.trip.id,
    condition: {
      type: "TRANSFER_BONUS_AT_LEAST" as const,
      sourceProgram: input.strategy.sourceProgram,
      targetProgram: input.strategy.targetProgram,
      thresholdPercent: input.strategy.minimumBonusPercent,
    },
    status: "WATCHING" as const,
  };
}

export function calculateStrategy(rawInput: StrategyInput): StrategyResult {
  const input = validateInput(rawInput);
  const cashOffer = input.offers.find((offer): offer is CashOffer => offer.kind === "cash");
  const awardOffer = input.offers.find((offer): offer is AwardOffer => offer.kind === "award");
  const brokerOffer = input.offers.find((offer): offer is MilesBrokerOffer => offer.kind === "miles_broker");
  const cash = cashOption(input, cashOffer);
  const points = pointsOption(input, awardOffer, cash.economicCostBRL);
  const broker = brokerOption(input, brokerOffer, awardOffer, cash.economicCostBRL);
  const options = [cash, points, broker];
  const assumptions = [
    "Preços, disponibilidade, saldos e promoções são simulados para demonstração.",
    "Custos econômicos incluem o valor de oportunidade dos pontos utilizados.",
  ];

  if (input.trip.missingFields.length > 0) {
    return strategyResultSchema.parse({
      decision: "REVIEW",
      action: "ASK_USER",
      confidence: "low",
      summary: "Faltam dados que podem mudar a recomendação.",
      options,
      nextStep: `Confirme: ${input.trip.missingFields.join(", ")}.`,
      beginnerSteps: [],
      assumptions,
      generatedAt: input.now,
      dataMode: "mock",
    });
  }

  const atTargetBonus = input.promotion.bonusPercent >= input.strategy.minimumBonusPercent;
  const shouldWait = (
    input.strategy.hasTimeToWait
    && !atTargetBonus
    && Boolean(awardOffer?.available)
  );

  if (shouldWait) {
    return strategyResultSchema.parse({
      decision: "WAIT",
      action: "WAIT",
      confidence: "high",
      recommendedOptionId: points.id,
      summary: `Não transfira agora. O bônus atual de ${input.promotion.bonusPercent}% está abaixo da meta e a transferência planejada não gera as 220 mil milhas.`,
      options,
      nextStep: `Monitorar bônus Livelo para TAP de pelo menos ${input.strategy.minimumBonusPercent}%.`,
      watchCondition: watchCondition(input),
      beginnerSteps: [
        "Não transfira pontos agora.",
        `Aguarde uma promoção Livelo → TAP de pelo menos ${input.strategy.minimumBonusPercent}%.`,
        "Confirme a emissão antes de qualquer transferência.",
      ],
      assumptions,
      generatedAt: input.now,
      dataMode: "mock",
    });
  }

  if (atTargetBonus && points.eligible) {
    return strategyResultSchema.parse({
      decision: "USE_POINTS",
      action: "EXECUTE",
      confidence: "high",
      recommendedOptionId: points.id,
      summary: `A promoção de ${input.promotion.bonusPercent}% atingiu a condição. Confirme a emissão e execute a primeira etapa.`,
      options,
      nextStep: "Confirme a disponibilidade da emissão e execute a transferência antes do prazo.",
      beginnerSteps: beginnerExecutionSteps,
      assumptions,
      generatedAt: input.now,
      dataMode: "mock",
    });
  }

  const best = options
    .filter((option) => option.eligible)
    .sort((a, b) => b.score - a.score)[0];
  const awardUnavailable = !awardOffer?.available;
  const decision = best?.kind === "miles_broker" ? "BUY_MILES" : "BUY_CASH";

  return strategyResultSchema.parse({
    decision,
    action: best ? "EXECUTE" : "NONE",
    confidence: best ? "medium" : "low",
    recommendedOptionId: best?.id,
    summary: awardUnavailable
      ? "A emissão-alvo está indisponível. Não transfira pontos."
      : "A estratégia com pontos não atende às regras de segurança desta análise.",
    options,
    nextStep: awardUnavailable
      ? "Atualize a disponibilidade da emissão antes de considerar pontos ou milhas."
      : "Revise o saldo, a promoção e os custos antes de agir.",
    beginnerSteps: [],
    assumptions,
    generatedAt: input.now,
    dataMode: "mock",
  });
}

