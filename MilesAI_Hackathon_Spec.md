# MilesAI — Especificação Mestre do MVP

> OpenAI Hackathon Brasil · desafio **Pequenos Negócios**  
> Documento de produto, engenharia, demo e pitch para implementação com Codex  
> Idioma do produto: português do Brasil  
> Repositório: `git@github.com:jocafabra/openai-hackathon.git`  
> Status: pronto para iniciar a implementação durante a janela oficial do hackathon

---

## 0. Ordem executiva para o Codex

Construa um MVP funcional, confiável e demonstrável do MilesAI. O produto deve transformar uma solicitação em linguagem natural, a carteira de pontos de um viajante e ofertas mockadas em uma estratégia simples para um pequeno agente de viagens.

O fluxo obrigatório é:

```text
pedido do cliente
→ perfil estruturado
→ carteira de pontos
→ comparação dinheiro × pontos × balcão de milhas
→ recomendação simples
→ monitoramento de uma condição
→ chegada de promoção simulada
→ estratégia reavaliada e ação recomendada
```

Priorize este fluxo ponta a ponta. Não expanda o escopo antes de ele funcionar, estar testado e caber em uma demo de três minutos.

Princípio central:

> **Fácil é fazer difícil. Difícil é fazer fácil.**

Toda a complexidade de milhas, transferências, bônus, taxas, risco e oportunidade deve ficar atrás do produto. Na frente, o agente de viagens precisa enxergar apenas:

- o que fazer;
- quando fazer;
- quanto custa;
- quanto pode economizar;
- por que a recomendação faz sentido;
- qual é o próximo passo.

---

## 1. Resumo executivo

### One-liner

> **MilesAI transforma pequenos agentes de viagem em especialistas em pontos, combinando dinheiro, milhas e promoções em uma estratégia simples e acionável para cada cliente.**

### Pitch em uma frase

> Um copiloto de decisão para pequenos negócios de turismo: o agente descreve a viagem, o MilesAI monta a melhor estratégia e avisa quando a oportunidade certa aparece.

### O produto não é

- um buscador de passagens;
- um comparador de preços genérico;
- um “ChatGPT das milhas”;
- um RAG sobre regulamentos;
- um dashboard de saldos;
- um robô que promete monitorar toda a internet;
- uma plataforma que compra, vende ou transfere pontos no MVP.

### O produto é

> **Um motor de decisão para profissionais de viagem.**

Ele recebe contexto incompleto em linguagem natural, estrutura o perfil do viajante, calcula cenários de forma verificável, cria um plano e reage a eventos relevantes.

---

## 2. Contrato do hackathon

Esta especificação assume como contrato as regras já discutidas e fornecidas para o evento. Antes da submissão, conferir a redação final no guia oficial.

### Restrições obrigatórias

- O repositório da submissão deve ser público.
- O trabalho apresentado deve ser novo e produzido durante o evento.
- A equipe pode ter até quatro pessoas.
- A demo deve deixar evidente o que foi construído durante o hackathon.
- A submissão deve incluir um vídeo de aproximadamente um minuto.
- Não apresentar funcionalidades pré-existentes como trabalho do evento.
- Preservar histórico de commits, README e evidências de execução.

### Tipos de projeto a evitar

- RAG básico como produto principal;
- chatbot genérico;
- tutor educacional genérico;
- analisador de imagem sem inovação clara;
- dashboard como função principal;
- solução que seja apenas uma interface bonita sobre uma chamada de LLM;
- qualquer categoria explicitamente proibida no guia final.

### Como o MilesAI responde à régua de avaliação

| Critério | Evidência no MVP |
|---|---|
| Funcionalidade ponta a ponta | pedido → estratégia → alerta → nova decisão |
| Engenharia | contratos tipados, motor determinístico, testes e saída estruturada |
| Ambição técnica | estado do cliente, ferramentas, planejamento e reação a evento |
| Inovação | decisão contextual contínua, não apenas busca ou chat |
| Utilidade | reduz horas de análise de um pequeno agente de viagens |
| Originalidade | combina carteira, cenários e oportunidade em uma ação operacional |
| Clareza | uma história, um cliente, uma promoção e um momento WOW |

### Enquadramento correto no desafio

O MilesAI deve ser apresentado como uma ferramenta B2B para **pequenos negócios de turismo**.

Usuário operador:

- agente de viagens independente;
- consultor de turismo;
- pequena agência que atende pelo WhatsApp;
- profissional que hoje alterna entre sites, planilhas, programas de fidelidade e mensagens.

Beneficiário final:

- o viajante atendido por esse pequeno negócio.

Comprador potencial:

- o agente ou a agência, em modelo SaaS.

O enquadramento não deve ser “ajudamos consumidores a viajar barato”. Deve ser:

> **Damos a uma pequena agência a capacidade técnica de um especialista em milhas, reduzindo trabalho manual e aumentando sua capacidade de atender e vender.**

---

## 3. Visão, problema e oportunidade

### Visão

Criar o copiloto operacional de agentes de viagem: um sistema que entende o objetivo do cliente, mantém seu contexto, avalia alternativas e transforma decisões complexas em ações simples.

### Problema

Pequenos agentes de viagem perdem tempo e vendas porque precisam:

- entender múltiplos programas de pontos;
- consultar saldos em carteiras diferentes;
- comparar preço em dinheiro com emissão em pontos;
- calcular bônus de transferência;
- considerar taxas e voos de posicionamento;
- avaliar compra de milhas em balcões ou parceiros;
- acompanhar promoções temporárias;
- decidir entre comprar, emitir ou esperar;
- explicar a estratégia de forma compreensível ao cliente.

Esse trabalho costuma exigir várias plataformas desconectadas:

```text
WhatsApp
→ planilha
→ site da companhia
→ programa de pontos
→ buscador de voos
→ grupos de promoções
→ cálculo manual
→ WhatsApp novamente
```

### Consequências para o pequeno negócio

- atendimento lento;
- dependência de conhecimento raro;
- risco de recomendar uma transferência ruim;
- dificuldade de escalar a carteira de clientes;
- pouca clareza para justificar o valor da consultoria;
- competição desigual com especialistas e plataformas maiores.

### Oportunidade

O MilesAI converte esse processo em uma experiência única:

```text
“Meu cliente quer ir para a Itália em maio de 2027, em casal.
Tem 220 mil pontos Livelo, aceita uma conexão e quer economizar.”

→ perfil pronto
→ alternativas calculadas
→ recomendação
→ condição monitorada
→ alerta quando a condição acontece
```

### Resultado de negócio esperado

Para a narrativa da demo, utilizar metas ilustrativas, sem apresentá-las como métricas validadas:

- análise inicial reduzida de horas para minutos;
- mais clientes atendidos pelo mesmo profissional;
- recomendação mais consistente e explicável;
- nova fonte de receita consultiva para pequenas agências;
- aumento de confiança do cliente.

---

## 4. Público e personas

### Persona principal — Maria, agente independente

- Trabalha sozinha ou com uma equipe pequena.
- Atende clientes principalmente por WhatsApp.
- Entende turismo, mas não domina todos os programas de pontos.
- Usa planilhas e várias abas abertas.
- Precisa responder rápido e parecer segura.
- Não quer estudar “milheiro”, “sweet spot” ou alianças aéreas para usar o produto.

Objetivo:

> Transformar a mensagem do cliente em uma orientação profissional em poucos minutos.

### Persona secundária — João, viajante atendido

- Quer viajar para a Europa em casal.
- Tem pontos, mas não sabe como usá-los.
- Quer economizar sem correr riscos desnecessários.
- Precisa de uma explicação simples e de passos concretos.

### Jobs to be done

1. Quando um cliente me manda uma intenção de viagem, quero estruturar rapidamente as informações que faltam.
2. Quando há dinheiro e pontos disponíveis, quero saber qual combinação gera mais valor.
3. Quando ainda não é hora de agir, quero saber exatamente o que esperar.
4. Quando surge uma promoção, quero identificar quais clientes realmente se beneficiam.
5. Quando recomendo algo, quero explicar a decisão sem jargão.

---

## 5. Tese de simplicidade

### Regra de produto

O usuário não deve precisar aprender milhas para usar o MilesAI.

Não dizer:

- “sweet spot”;
- “tabela fixa”;
- “stopover”;
- “valor nominal do milheiro” sem explicar;
- “transfira para um parceiro da aliança X”;
- “faça arbitragem de pontos”.

Dizer:

- “espere”;
- “faça isso agora”;
- “não transfira ainda”;
- “esta opção custa menos, mas exige uma conexão”;
- “abra o aplicativo Livelo e siga estes passos”;
- “se a promoção chegar a 80% de bônus, reavalie”.

### Hierarquia da resposta

Toda estratégia deve aparecer nesta ordem:

1. **Decisão:** comprar, emitir, esperar ou revisar.
2. **Economia:** valor e premissas.
3. **Motivo:** duas ou três frases simples.
4. **Próximo passo:** ação concreta.
5. **Detalhes:** cálculos e alternativas, somente se o usuário abrir.

### Princípio de confiança

Nunca esconder incerteza. Se os dados forem mockados, antigos ou incompletos, mostrar isso com clareza.

---

## 6. Diferenciais

### 6.1 Decisão, não lista

Buscadores retornam voos. O MilesAI retorna uma decisão com justificativa e próximo passo.

### 6.2 Memória operacional

O sistema mantém o perfil do viajante, sua carteira, a viagem desejada e a condição que deve ser monitorada.

### 6.3 Combinação de três caminhos

O motor compara:

1. dinheiro;
2. pontos próprios ou transferidos;
3. compra de milhas em um balcão/parceiro simulado.

### 6.4 Proatividade

O sistema não termina na resposta. Ele registra uma condição e reavalia a estratégia quando chega um evento de promoção.

### 6.5 Explicação em modo iniciante

A mesma decisão técnica vira um roteiro executável por uma pessoa sem conhecimento de milhas.

### 6.6 Engenharia confiável

- A IA extrai intenção e produz explicações.
- O código calcula valores, verifica elegibilidade e classifica alternativas.
- A recomendação não depende de o modelo “inventar” matemática.

---

## 7. Escopo do MVP

### Deve existir

- uma tela principal com conversa e resumo estruturado;
- um caso de demonstração pronto;
- perfil do viajante editável;
- carteira com pelo menos Livelo e Smiles;
- três alternativas calculadas;
- uma recomendação com decisão `WAIT` na primeira análise;
- uma condição de monitoramento registrada;
- botão para simular a chegada de uma promoção;
- reavaliação automática para `EXECUTE`;
- alerta visual com o momento WOW;
- modo iniciante com passos numerados;
- indicação visível de “dados simulados para demonstração”;
- tratamento de erro da OpenAI API com fallback local;
- testes do motor de decisão.

### Pode existir se o fluxo principal estiver verde

- animação de etapas de análise;
- copiar resumo para WhatsApp;
- alternar visão simples/detalhada;
- histórico de estratégias;
- segundo cliente para mostrar seleção por promoção;
- persistência local.

### Não deve consumir tempo no MVP

- autenticação;
- pagamento;
- integração real com companhias aéreas;
- scraping;
- notificações reais;
- banco de produção;
- painel administrativo;
- múltiplos idiomas;
- design system completo;
- compra ou transferência real de pontos.

---

## 8. Experiência conversacional

### Entrada ideal da demo

> “Meu cliente João quer ir de Florianópolis para Roma em maio de 2027, em casal. Tem 220 mil pontos Livelo e 80 mil Smiles. Quer gastar pouco, aceita uma conexão e tem flexibilidade de alguns dias.”

### Extração automática

O MilesAI deve identificar:

- origem e destino;
- mês ou intervalo de datas;
- número de viajantes;
- objetivo principal;
- orçamento, se informado;
- flexibilidade;
- conforto;
- aceitação de conexões;
- carteira de pontos;
- dados ausentes.

### Perguntas de esclarecimento

Fazer no máximo três perguntas por rodada. Perguntar somente dados que possam mudar a decisão.

Ordem recomendada:

1. número de passageiros;
2. datas/flexibilidade;
3. saldos e programas;
4. orçamento;
5. conexão e aeroporto alternativo;
6. prioridade economia versus conforto.

### Confirmação

Antes de calcular, mostrar um cartão resumido:

```text
Roma · maio/2027 · 2 pessoas
Origem: Florianópolis
Objetivo: economizar
Flexibilidade: ±3 dias
Conexão: aceita
Carteira: 220 mil Livelo + 80 mil Smiles
```

### Estado de análise

Usar etapas curtas para dar clareza, não para fingir processamento:

```text
✓ Entendi o perfil
✓ Organizei a carteira
✓ Comparei 3 caminhos
✓ Criei a recomendação
```

---

## 9. Perfil do viajante

### Campos mínimos

| Campo | Tipo | Exemplo |
|---|---|---|
| `name` | string | João |
| `travel_style` | enum | `economy` |
| `comfort_level` | 1–10 | 6 |
| `flexibility` | enum | `low`, `medium`, `high` |
| `flex_days` | number | 3 |
| `accepts_connections` | boolean | true |
| `preferred_airports` | string[] | `FLN`, `GRU` |
| `max_connections` | number | 1 |
| `beginner_mode` | boolean | true |

### JSON de exemplo

```json
{
  "id": "traveler_joao",
  "name": "João",
  "travel_style": "economy",
  "comfort_level": 6,
  "flexibility": "medium",
  "flex_days": 3,
  "accepts_connections": true,
  "preferred_airports": ["FLN", "GRU"],
  "max_connections": 1,
  "beginner_mode": true
}
```

---

## 10. Carteira de pontos

### Comportamento

O agente cadastra manualmente os saldos do cliente. No MVP, não conectar contas reais.

### Campos

| Campo | Tipo | Observação |
|---|---|---|
| `program` | string | Livelo, Smiles etc. |
| `balance` | integer | saldo informado pelo agente |
| `expires_at` | date/null | opcional |
| `reference_value_per_1000` | number | valor econômico mockado |
| `updated_at` | datetime | origem da informação |

### JSON de exemplo

```json
{
  "traveler_id": "traveler_joao",
  "balances": [
    {
      "program": "Livelo",
      "balance": 220000,
      "expires_at": null,
      "reference_value_per_1000": 20,
      "updated_at": "2026-08-19T10:00:00-03:00"
    },
    {
      "program": "Smiles",
      "balance": 80000,
      "expires_at": "2027-02-01",
      "reference_value_per_1000": 16,
      "updated_at": "2026-08-19T10:00:00-03:00"
    }
  ],
  "source": "manual_demo_input"
}
```

---

## 11. Motor estratégico

### 11.1 Princípio de arquitetura

Separar entendimento, cálculo e explicação:

```text
linguagem natural
→ IA extrai TravelRequest estruturado
→ motor determinístico calcula StrategyResult
→ IA transforma o resultado em explicação simples
```

A IA não deve criar preços, bônus, saldos ou resultados matemáticos. Ela só pode usar valores fornecidos pelas ferramentas/dados.

### 11.2 Caminhos comparados

#### A. Dinheiro

```text
custo total = tarifa + bagagem + taxas + trechos adicionais
```

#### B. Pontos próprios/transferidos

```text
pontos recebidos = pontos transferidos × (1 + bônus)
pontos de origem necessários = arredondar para cima(
  milhas da emissão ÷ (1 + bônus),
  em blocos de 5.000 pontos
)
custo desembolsado = taxas + trechos adicionais + pontos comprados para completar
custo econômico = custo desembolsado + valor de oportunidade dos pontos consumidos
```

No cenário da demo:

- bônus de 80% exige 125 mil pontos de origem e gera 225 mil milhas;
- bônus de 90% exige 120 mil pontos de origem e gera 228 mil milhas.

#### C. Balcão de milhas

No MVP, “balcão” é somente uma cotação mockada de compra de milhas por meio de parceiro hipotético. Não executar transação.

```text
custo das milhas = milhas necessárias ÷ 1.000 × preço por milheiro
custo total = custo das milhas + taxas + trechos adicionais
```

### 11.3 Duas economias diferentes

Para evitar uma comparação enganosa, exibir:

- **desembolso agora:** dinheiro que sai do caixa;
- **custo econômico estimado:** desembolso + valor atribuído aos pontos usados;
- **economia econômica:** preço em dinheiro − custo econômico estimado.

Nunca chamar somente a diferença de desembolso de “economia real”.

### 11.4 Exemplo numérico principal

Todos os valores abaixo são mockados para a demo.

| Opção | Desembolso | Custo econômico | Observação |
|---|---:|---:|---|
| Comprar em dinheiro | R$ 8.350 | R$ 8.350 | simples e imediato |
| Transferir 120 mil Livelo com bônus de 90% | R$ 1.750 | R$ 4.150 | gera 228 mil milhas; inclui taxas e trecho FLN–GRU |
| Comprar 220 mil milhas no balcão | R$ 5.710 | R$ 5.710 | preço de R$ 18/milheiro; inclui taxas e trecho |

Economia econômica da estratégia com promoção:

```text
R$ 8.350 − R$ 4.150 = R$ 4.200
```

### 11.5 Ranking

Eliminar primeiro opções inelegíveis. Depois calcular uma nota de 0 a 100:

```text
score =
  45% economia econômica
  25% aderência ao perfil
  15% risco temporal
  15% simplicidade operacional
```

Para o MVP, pesos e normalização podem ser constantes no código.

### 11.6 Decisões possíveis

| Código | Texto para o usuário |
|---|---|
| `BUY_CASH` | Compre em dinheiro |
| `USE_POINTS` | Emita com seus pontos |
| `BUY_MILES` | Considere comprar as milhas desta cotação |
| `WAIT` | Espere pela condição recomendada |
| `REVIEW` | Faltam dados para decidir com segurança |

### 11.7 Regras obrigatórias

1. Nunca transferir pontos sem uma emissão-alvo mockada disponível.
2. Se o bônus atual estiver abaixo do mínimo da estratégia e houver margem de tempo, retornar `WAIT`.
3. Se o bônus atingir o mínimo, o saldo cobrir os pontos de origem calculados e a emissão estiver disponível, retornar `USE_POINTS` com ação `EXECUTE`.
4. Se faltarem dados que mudam materialmente a decisão, retornar `REVIEW`.
5. Se a viagem estiver próxima e a disponibilidade for baixa, penalizar espera.
6. Se a alternativa com pontos tiver custo econômico maior que dinheiro, não recomendá-la apenas por reduzir desembolso.
7. Se o balcão tiver cotação vencida, torná-lo inelegível.
8. Respeitar número máximo de conexões e aeroportos aceitos.
9. Exibir a origem e a data de cada dado relevante.
10. Toda recomendação deve trazer confiança e premissas.

### 11.8 Regra da demo antes da promoção

```text
promoção atual Livelo → TAP: 30%
meta definida: pelo menos 80%
resultado com 120 mil Livelo: 156 mil milhas
necessidade da emissão: 220 mil milhas
decisão: WAIT
condição: bônus Livelo → TAP >= 80%
```

### 11.9 Regra da demo após a promoção

```text
novo evento: Livelo → TAP com 90% de bônus
resultado com 120 mil Livelo: 228 mil milhas
necessidade da emissão: 220 mil milhas
decisão: USE_POINTS
ação: EXECUTE
economia econômica estimada: R$ 4.200
```

---

## 12. Monitoramento proativo

### O que é no MVP

Um simulador de eventos de promoção. Um botão injeta um evento conhecido; o sistema encontra estratégias monitoradas, reexecuta o motor e mostra quais clientes foram impactados.

### O que não é no MVP

- monitoramento real de todas as companhias;
- scraping;
- promessa de preço em tempo real;
- notificação por WhatsApp ou e-mail;
- execução automática de transferência.

### Evento de promoção

```json
{
  "id": "promo_livelo_tap_90",
  "type": "TRANSFER_BONUS",
  "source_program": "Livelo",
  "target_program": "TAP Miles&Go",
  "bonus_percent": 90,
  "starts_at": "2026-08-19T15:00:00-03:00",
  "ends_at": "2026-08-21T23:59:59-03:00",
  "source": "mock_hackathon_event"
}
```

### Condição monitorada

```json
{
  "id": "watch_italy_2027",
  "traveler_id": "traveler_joao",
  "trip_id": "trip_italy_2027",
  "condition": {
    "type": "TRANSFER_BONUS_AT_LEAST",
    "source_program": "Livelo",
    "target_program": "TAP Miles&Go",
    "threshold_percent": 80
  },
  "status": "WATCHING"
}
```

### Alerta WOW

```text
🚨 Encontramos a oportunidade que estávamos esperando

Cliente: João
Viagem: Itália · maio/2027 · 2 pessoas
Evento: Livelo → TAP com 90% de bônus

Recomendação atualizada: executar etapa 1
Transfira: 120 mil pontos Livelo
Resultado estimado: 228 mil milhas
Economia econômica estimada: R$ 4.200
Prazo da promoção: até 21/08
```

---

## 13. Modo iniciante passo a passo

### Objetivo

Traduzir a recomendação em um checklist. O sistema não deve presumir que o agente domina o programa.

### Exemplo

```text
1. Confirme que a emissão de 220 mil milhas ainda está disponível.
2. Abra o aplicativo ou site da Livelo.
3. Procure “Transferir pontos”.
4. Escolha TAP Miles&Go.
5. Informe 120 mil pontos.
6. Confirme que a campanha de 90% está selecionada.
7. Antes de concluir, confira nome, CPF e número TAP do cliente.
8. Faça a transferência somente após essa conferência.
9. Emita o trecho internacional.
10. Compre o trecho FLN → GRU separadamente.
```

### Guardrail obrigatório

Antes de uma ação irreversível, mostrar:

> “As condições e a disponibilidade podem mudar. Confirme os dados no programa antes de transferir; transferências de pontos podem ser irreversíveis.”

---

## 14. Arquitetura sugerida

### Estratégia para 3h15

Construir um monólito web simples. Evitar microserviços e integrações reais.

```text
┌─────────────────────────────────────────┐
│ Web app                                 │
│ conversa · perfil · estratégia · alerta │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│ API do MilesAI                          │
│ orquestração · validação · fallback     │
└─────────────┬─────────────────┬─────────┘
              │                 │
┌─────────────▼──────────┐  ┌───▼─────────────────┐
│ OpenAI Responses API   │  │ Motor determinístico│
│ extração + explicação  │  │ cálculo + ranking   │
└────────────────────────┘  └───┬─────────────────┘
                                │
                        ┌───────▼────────┐
                        │ Fixtures JSON  │
                        │ ofertas/eventos│
                        └────────────────┘
```

### Stack recomendada

- **Aplicação:** Next.js com TypeScript, ou React/Vite + Node se o time já tiver um template conhecido.
- **UI:** Tailwind CSS; componentes simples e acessíveis.
- **IA:** OpenAI Responses API.
- **Contrato da IA:** Structured Outputs com JSON Schema.
- **Estado MVP:** memória do servidor + `localStorage`, ou SQLite se já estiver pronto.
- **Validação:** Zod.
- **Testes:** Vitest.
- **Deploy:** plataforma já conhecida pelo time; não sacrificar a demo por deploy.

O modelo da OpenAI deve ser configurável por `OPENAI_MODEL`. Não fixar no domínio uma versão que o time talvez não tenha disponível.

Referência técnica: a documentação oficial da OpenAI recomenda JSON Schema para saídas estruturadas em vez do modo JSON antigo: <https://developers.openai.com/api/docs/guides/structured-outputs>.

### Estrutura de pastas sugerida

```text
src/
  app/
  components/
    ChatPanel.tsx
    TravelerSummary.tsx
    WalletCard.tsx
    StrategyCard.tsx
    ComparisonTable.tsx
    PromotionAlert.tsx
    BeginnerSteps.tsx
  domain/
    types.ts
    schemas.ts
    strategy-engine.ts
    scoring.ts
    money.ts
  server/
    openai.ts
    orchestrator.ts
    fallback.ts
  data/
    programs.json
    offers.json
    promotions.json
    demo-scenario.json
  prompts/
    extract-profile.ts
    explain-strategy.ts
  tests/
    strategy-engine.test.ts
    promotion-replay.test.ts
```

### Variáveis de ambiente

```text
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_DEMO_MODE=true
```

Não versionar chaves. Fornecer `.env.example`.

### Fallback obrigatório

Se a API estiver indisponível:

- o caso de demo ainda deve carregar;
- o motor de decisão deve continuar funcionando;
- uma explicação local predefinida deve ser exibida;
- mostrar “modo de demonstração” discretamente;
- nunca deixar a tela travada.

---

## 15. Modelos de dados

### TypeScript de referência

```ts
type Decision = 'BUY_CASH' | 'USE_POINTS' | 'BUY_MILES' | 'WAIT' | 'REVIEW';

type Confidence = 'low' | 'medium' | 'high';

interface TravelRequest {
  id: string;
  travelerId: string;
  origin: string;
  destination: string;
  departureWindow: {
    start: string;
    end: string;
  };
  passengers: number;
  objective: 'economy' | 'balance' | 'comfort';
  budgetBRL?: number;
  maxConnections: number;
  missingFields: string[];
}

interface OptionResult {
  id: string;
  kind: 'cash' | 'own_points' | 'miles_broker';
  eligible: boolean;
  cashOutlayBRL: number;
  economicCostBRL: number;
  savingsVsCashBRL: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  risk: 'low' | 'medium' | 'high';
  score: number;
  reasons: string[];
  assumptions: string[];
}

interface StrategyResult {
  decision: Decision;
  action: 'EXECUTE' | 'WAIT' | 'ASK_USER' | 'NONE';
  confidence: Confidence;
  recommendedOptionId?: string;
  options: OptionResult[];
  nextStep: string;
  watchCondition?: WatchCondition;
  beginnerSteps: string[];
  generatedAt: string;
  dataMode: 'mock';
}
```

### Requisição completa de exemplo

```json
{
  "trip": {
    "id": "trip_italy_2027",
    "traveler_id": "traveler_joao",
    "origin": "FLN",
    "destination": "FCO",
    "departure_window": {
      "start": "2027-05-10",
      "end": "2027-05-16"
    },
    "passengers": 2,
    "objective": "economy",
    "budget_brl": 10000,
    "max_connections": 1
  },
  "wallet": {
    "Livelo": 220000,
    "Smiles": 80000
  },
  "preferences": {
    "flexibility": "medium",
    "accepts_positioning_flight": true,
    "beginner_mode": true
  }
}
```

### Saída antes da promoção

```json
{
  "decision": "WAIT",
  "action": "WAIT",
  "confidence": "high",
  "recommended_option_id": "transfer_livelo_tap",
  "summary": "Não transfira os pontos agora. O bônus atual não gera saldo suficiente para a emissão-alvo.",
  "next_step": "Monitorar bônus Livelo para TAP de pelo menos 80%.",
  "watch_condition": {
    "type": "TRANSFER_BONUS_AT_LEAST",
    "source_program": "Livelo",
    "target_program": "TAP Miles&Go",
    "threshold_percent": 80
  },
  "assumptions": [
    "Emissão-alvo de 220000 milhas para duas pessoas",
    "Valores e disponibilidade são simulados"
  ],
  "data_mode": "mock"
}
```

### Saída após a promoção

```json
{
  "decision": "USE_POINTS",
  "action": "EXECUTE",
  "confidence": "high",
  "recommended_option_id": "transfer_livelo_tap",
  "summary": "A promoção de 90% atingiu a condição da estratégia.",
  "transfer": {
    "source_program": "Livelo",
    "target_program": "TAP Miles&Go",
    "source_points": 120000,
    "bonus_percent": 90,
    "resulting_miles": 228000
  },
  "cash_outlay_brl": 1750,
  "economic_cost_brl": 4150,
  "savings_vs_cash_brl": 4200,
  "next_step": "Confirme a disponibilidade da emissão e execute a transferência antes do prazo.",
  "data_mode": "mock"
}
```

---

## 16. Dados mockados

### Programas

```json
{
  "programs": [
    {
      "id": "livelo",
      "name": "Livelo",
      "type": "bank_points",
      "reference_value_per_1000_brl": 20,
      "transfer_partners": ["tap", "latam", "azul"]
    },
    {
      "id": "smiles",
      "name": "Smiles",
      "type": "airline_miles",
      "reference_value_per_1000_brl": 16,
      "transfer_partners": []
    },
    {
      "id": "tap",
      "name": "TAP Miles&Go",
      "type": "airline_miles",
      "reference_value_per_1000_brl": 22,
      "transfer_partners": []
    }
  ],
  "source": "mock_hackathon_dataset"
}
```

### Ofertas do cenário

```json
{
  "offers": [
    {
      "id": "cash_fln_fco",
      "kind": "cash",
      "passengers": 2,
      "total_brl": 8350,
      "connections": 1,
      "available": true
    },
    {
      "id": "tap_award_gru_fco",
      "kind": "award",
      "program": "TAP Miles&Go",
      "miles": 220000,
      "taxes_brl": 850,
      "positioning_flight_brl": 900,
      "passengers": 2,
      "available": true
    },
    {
      "id": "broker_tap_220k",
      "kind": "miles_broker",
      "program": "TAP Miles&Go",
      "miles": 220000,
      "price_per_1000_brl": 18,
      "taxes_brl": 850,
      "positioning_flight_brl": 900,
      "expires_at": "2026-08-21T23:59:59-03:00",
      "available": true
    }
  ],
  "source": "mock_hackathon_dataset"
}
```

### Promoção inicial e promoção WOW

```json
{
  "initial_promotion": {
    "source_program": "Livelo",
    "target_program": "TAP Miles&Go",
    "bonus_percent": 30
  },
  "wow_promotion": {
    "source_program": "Livelo",
    "target_program": "TAP Miles&Go",
    "bonus_percent": 90,
    "ends_at": "2026-08-21T23:59:59-03:00"
  }
}
```

### Segundo cliente opcional

Usar apenas se houver tempo. Deve demonstrar que a promoção é contextual: ela serve para João, mas não necessariamente para todos.

```json
{
  "id": "traveler_ana",
  "name": "Ana",
  "trip": "Recife em outubro",
  "wallet": {
    "Livelo": 15000,
    "Smiles": 120000
  },
  "promotion_match": false,
  "reason": "A estratégia ativa usa Smiles e não se beneficia da transferência Livelo para TAP."
}
```

---

## 17. Agentes, ferramentas e prompts

### Decisão de implementação

Para o MVP, implementar **um orquestrador** com duas chamadas estruturadas e ferramentas determinísticas. Apresentar os papéis abaixo como responsabilidades especializadas, não como a obrigação de criar quatro serviços autônomos.

```text
Orquestrador MilesAI
├── interpretar perfil
├── chamar motor de estratégia
├── registrar condição
├── reavaliar promoção
└── explicar em modo simples
```

### Ferramentas locais

- `get_wallet(traveler_id)`
- `get_offers(trip_id)`
- `get_transfer_promotion(source, target)`
- `calculate_strategy(input)`
- `save_watch_condition(input)`
- `replay_promotion_event(event)`

As ferramentas não devem executar ações externas.

### Papel 1 — Profile Interpreter

Responsabilidade: transformar a conversa em `TravelRequest` e apontar campos ausentes.

Prompt-base:

```text
Você é o intérprete de perfil do MilesAI, um copiloto para pequenos agentes de viagem.
Extraia somente informações presentes na mensagem ou fornecidas no contexto.
Não invente datas, saldos, preços, programas ou preferências.
Se algo importante estiver ausente, adicione o nome do campo em missing_fields.
Retorne estritamente o schema TravelRequest.
Faça no máximo três perguntas e apenas se a ausência puder mudar a decisão.
```

### Papel 2 — Strategy Engine

Responsabilidade: código determinístico. Não é um prompt.

Entradas:

- pedido estruturado;
- perfil;
- carteira;
- ofertas;
- promoções;
- regras.

Saída:

- opções elegíveis;
- custos;
- score;
- decisão;
- condição de monitoramento;
- premissas.

### Papel 3 — Strategy Explainer

Responsabilidade: explicar o `StrategyResult`, sem recalcular.

Prompt-base:

```text
Você é o explicador do MilesAI.
Use exclusivamente os números e fatos do StrategyResult.
Não refaça cálculos e não crie ofertas.
Escreva em português do Brasil, sem jargão de milhas.
Comece pela decisão, depois economia, motivo e próximo passo.
Diferencie desembolso de custo econômico.
Se data_mode for mock, diga que os dados são simulados.
Se confidence não for high, explicite a incerteza.
Retorne estritamente o schema StrategyExplanation.
```

### Papel 4 — Promotion Matcher

Responsabilidade: ao receber um evento, filtrar condições compatíveis e chamar novamente o motor.

Pseudocódigo:

```ts
for (const watch of activeWatches) {
  if (matches(event, watch.condition)) {
    const updated = calculateStrategy({ ...context, event });
    if (updated.action === 'EXECUTE') notify(updated);
  }
}
```

### Guardrails de prompt

- não prometer disponibilidade real;
- não mandar transferir sem confirmar emissão;
- não tratar mock como dado atual;
- não ocultar taxas;
- não inventar economia;
- não sugerir violação de termos de programas;
- não executar compra, venda ou transferência;
- não transformar recomendação em garantia financeira.

---

## 18. Telas

### Tela 1 — Copiloto

Layout desktop de demo:

```text
┌──────────────────────────────┬──────────────────────────────┐
│ Conversa                     │ Cliente e viagem             │
│                              │ João · Itália · maio/2027    │
│ “Meu cliente quer...”        │ 2 pessoas · economia         │
│                              │                              │
│ [campo de mensagem]          │ Carteira                     │
│ [Analisar viagem]            │ 220k Livelo · 80k Smiles     │
└──────────────────────────────┴──────────────────────────────┘
```

### Tela 2 — Estratégia

Ordem visual:

1. badge de decisão `ESPERE`;
2. frase principal;
3. economia potencial;
4. comparação das três opções;
5. próximo passo;
6. condição monitorada;
7. detalhes dos cálculos recolhidos.

### Tela 3 — Central de oportunidades

No MVP pode ser um painel lateral ou modal, não uma rota completa.

Conteúdo:

- promoção recebida;
- condições avaliadas;
- clientes compatíveis;
- estratégia anterior versus atual;
- botão “Ver ação recomendada”.

### Tela 4 — Modo iniciante

Drawer ou modal com checklist numerado e aviso antes de ação irreversível.

### Estados obrigatórios

- vazio;
- analisando;
- estratégia `WAIT`;
- promoção recebida;
- estratégia `EXECUTE`;
- erro de API com fallback;
- dados insuficientes.

### Direção visual

- visual profissional, leve e confiável;
- prioridade para legibilidade durante apresentação;
- decisão em destaque, cálculos secundários;
- verde para oportunidade, âmbar para espera, vermelho somente para risco/erro;
- números alinhados e formatados em BRL;
- selo persistente “Dados simulados”.

---

## 19. Fluxo completo da demo

### Preparação

- aplicação aberta e carregada;
- cenário de João disponível em um clique;
- API e fallback testados;
- botão de promoção escondido o suficiente para não antecipar o WOW, mas acessível;
- zoom e resolução já ajustados;
- nenhuma dependência de internet além da chamada opcional à OpenAI.

### Passo a passo

1. Maria recebe a mensagem de João no WhatsApp.
2. Cola a mensagem no MilesAI.
3. O sistema extrai perfil, viagem e carteira.
4. A tela mostra três caminhos: dinheiro, pontos e balcão.
5. O MilesAI recomenda: **não transfira agora**.
6. Mostra o motivo: bônus de 30% é insuficiente.
7. Registra a condição: Livelo → TAP com bônus mínimo de 80%.
8. O apresentador explica que o trabalho não termina no chat.
9. Clica em “Simular nova promoção”.
10. Entra a promoção de 90%.
11. O sistema encontra João, reexecuta o motor e muda a decisão.
12. Aparece o alerta WOW com `EXECUTAR`.
13. Abre o modo iniciante e mostra os próximos passos.
14. Fecha com economia econômica estimada de R$ 4.200 e aviso de dados simulados.

### Momento WOW

O WOW não é gerar texto. É demonstrar uma mudança de estado útil:

```text
ANTES
Decisão: ESPERAR
Motivo: bônus insuficiente
Monitorando: Livelo → TAP >= 80%

EVENTO
Livelo → TAP = 90%

DEPOIS
Decisão: EXECUTAR
Cliente impactado: João
Ação: transferir 120 mil pontos após confirmar a emissão
Economia econômica estimada: R$ 4.200
```

---

## 20. Backlog priorizado para 3h15

Tempo total: **195 minutos**. O relógio é parte do escopo.

### P0 — obrigatório

| Janela | Entrega | Critério de saída |
|---:|---|---|
| 0–15 min | repo público, scaffold, README mínimo, `.env.example` | aplicação abre e primeiro commit existe |
| 15–35 min | tipos, schemas e fixtures do cenário | JSON válido e importável |
| 35–70 min | motor de cálculo + regras + testes | cenários `WAIT` e `EXECUTE` verdes |
| 70–100 min | endpoint de análise e integração OpenAI estruturada | extrai perfil ou usa fallback |
| 100–135 min | tela principal e cartão de estratégia | fluxo inicial visível |
| 135–160 min | evento de promoção + replay + alerta WOW | decisão muda na UI |
| 160–175 min | modo iniciante + selo mock + erros | demo não trava sem API |
| 175–185 min | ensaio, correções críticas e deploy/local backup | fluxo executado duas vezes |
| 185–195 min | gravação do vídeo ou margem de contingência | vídeo/submissão encaminhados |

### P1 — somente após P0

- copiar resumo para WhatsApp;
- animações leves;
- segundo cliente não impactado;
- persistência no navegador;
- visão detalhada dos cálculos.

### P2 — cortar sem remorso

- login;
- banco remoto;
- scraping;
- notificações reais;
- múltiplas viagens;
- importação automática de carteiras;
- personalização avançada.

### Divisão opcional para quatro pessoas

| Pessoa | Responsabilidade |
|---|---|
| 1 | motor, regras e testes |
| 2 | OpenAI, schemas e prompts |
| 3 | UI e estados da demo |
| 4 | integração, QA, pitch, vídeo e submissão |

Se a equipe for menor, manter a mesma ordem de prioridade e reduzir paralelismo, não confiabilidade.

---

## 21. Critérios de pronto

### Produto

- [ ] A mensagem de João gera ou carrega um perfil estruturado.
- [ ] A carteira mostra 220 mil Livelo e 80 mil Smiles.
- [ ] A comparação exibe dinheiro, pontos e balcão.
- [ ] O resultado inicial é `WAIT`.
- [ ] Uma condição de bônus mínimo de 80% fica registrada.
- [ ] O evento de 90% reavalia a estratégia.
- [ ] O resultado muda para `USE_POINTS` + `EXECUTE`.
- [ ] A economia de R$ 4.200 é reproduzível pelo código.
- [ ] O modo iniciante traz passos concretos.
- [ ] Dados mockados estão claramente identificados.

### Engenharia

- [ ] Cálculos monetários não são feitos pelo LLM.
- [ ] Entradas e saídas são validadas.
- [ ] Testes cobrem bônus de 30%, 80% e 90%.
- [ ] Teste cobre saldo insuficiente.
- [ ] Teste cobre oferta indisponível.
- [ ] Teste cobre cotação de balcão vencida.
- [ ] A aplicação funciona sem chave da OpenAI em modo demo.
- [ ] Segredos não estão no repositório.
- [ ] O README explica como rodar e demonstrar.

### Hackathon

- [ ] Repositório público.
- [ ] Histórico evidencia trabalho novo do evento.
- [ ] Apenas funcionalidades realmente construídas são apresentadas.
- [ ] Demo completa em até três minutos.
- [ ] Vídeo de aproximadamente um minuto gravado.
- [ ] Link e instruções de execução conferidos.
- [ ] Um backup local da demo está pronto.

### Testes mínimos do motor

```text
✓ bônus 30% → WAIT
✓ bônus 80% → calcular 125k de origem → 225k de destino → EXECUTE
✓ bônus 90% → 120k vira 228k
✓ economia econômica → 8350 - 4150 = 4200
✓ emissão indisponível → não transferir
✓ cotação vencida → balcão inelegível
✓ custo econômico de pontos maior que dinheiro → não recomendar pontos
```

---

## 22. Roteiro de pitch — 3 minutos

### 0:00–0:25 — Problema

> “Pequenos agentes de viagem atendem pelo WhatsApp, mas para responder uma pergunta simples eles abrem programas de pontos, sites de companhias, planilhas e grupos de promoções. Uma boa estratégia pode levar horas e depende de conhecimento especializado.”

### 0:25–0:40 — Solução

> “MilesAI dá a qualquer pequeno agente de viagens a capacidade de um especialista em milhas. Ele não retorna uma lista de voos. Ele diz o que fazer, quando fazer e por quê.”

### 0:40–1:25 — Primeira decisão

Colar a mensagem de João.

> “O MilesAI entende o cliente, organiza sua carteira e compara três caminhos: comprar em dinheiro, usar pontos ou recorrer a uma cotação de milhas.”

Mostrar `WAIT`.

> “Hoje ele recomenda não transferir. Com o bônus atual de 30%, o saldo não paga a emissão. Em vez de dar uma resposta genérica, ele registra a condição certa: esperar pelo menos 80%.”

### 1:25–2:15 — Momento WOW

> “E aqui está a diferença entre um chatbot e um agente que acompanha uma estratégia.”

Clicar em “Simular nova promoção”.

> “Chegou uma promoção Livelo para TAP com 90%. O MilesAI encontra automaticamente os clientes afetados, reexecuta o plano e muda a recomendação.”

Mostrar alerta.

> “Para João, agora é o momento. Transferindo 120 mil pontos, ele chega a 228 mil milhas e a estratégia estima R$ 4.200 de economia econômica.”

### 2:15–2:40 — Simplicidade e engenharia

Abrir modo iniciante.

> “Toda a complexidade fica atrás. Na frente, o agente recebe passos simples. A IA entende e explica; nosso motor calcula custos, valida regras e torna a decisão reproduzível. Nesta demo, todos os preços e promoções estão claramente marcados como simulados.”

### 2:40–3:00 — Fechamento

> “MilesAI transforma agentes de viagem comuns em especialistas em pontos. Assim, um pequeno negócio atende mais clientes, responde mais rápido e compete com conhecimento que antes estava concentrado em poucos especialistas.”

Fecho em inglês opcional:

> **“MilesAI gives every small travel agent the expertise of a miles specialist.”**

---

## 23. Roteiro de vídeo — aproximadamente 1 minuto

### 0–8s

Visual: várias abas e planilha, corte para MilesAI.

Narração:

> “Para montar uma viagem com pontos, pequenos agentes gastam horas comparando programas, preços e promoções.”

### 8–18s

Visual: colar mensagem do cliente.

> “No MilesAI, eles apenas descrevem o cliente.”

### 18–31s

Visual: perfil + três alternativas + decisão `ESPERE`.

> “A IA organiza o perfil, e nosso motor compara dinheiro, pontos e compra de milhas. Hoje, a recomendação é esperar por um bônus de pelo menos 80%.”

### 31–47s

Visual: promoção de 90% entra; alerta WOW.

> “Quando a promoção certa aparece, o MilesAI encontra quem se beneficia e atualiza a estratégia. Para João, agora é hora de agir.”

### 47–56s

Visual: passos e R$ 4.200.

> “O agente recebe passos simples e uma economia econômica estimada de R$ 4.200.”

### 56–60s

Visual: logo e one-liner.

> “MilesAI: o especialista em pontos de todo pequeno agente de viagens.”

Legenda fixa pequena:

> “Protótipo do hackathon · dados simulados.”

---

## 24. Perguntas prováveis dos jurados

### “Isso não é apenas um chatbot de milhas?”

Não. O chat é a entrada. O núcleo mantém estado, chama ferramentas, calcula cenários de forma determinística, registra uma condição e reage a um evento. A demo mostra uma decisão que muda quando o mundo muda.

### “De onde vêm os preços e promoções?”

No MVP, de um conjunto mockado e explicitamente identificado. Fizemos isso para provar o motor e o fluxo durante o tempo do hackathon. Em produção, usaríamos integrações autorizadas, parceiros e fontes contratadas.

### “Por que um agente de viagens pagaria?”

Porque o produto reduz tempo de pesquisa, aumenta a capacidade de atendimento e ajuda o profissional a oferecer uma consultoria de maior valor sem precisar dominar todos os programas.

### “Onde está a OpenAI?”

A OpenAI interpreta a mensagem não estruturada, identifica dados ausentes e transforma o resultado técnico em uma orientação simples. Usamos saída estruturada para conectar linguagem a um motor verificável. Os cálculos permanecem em código.

### “Por que não deixar o modelo fazer tudo?”

Porque dinheiro, pontos e bônus exigem consistência. O modelo lida com ambiguidade e comunicação; o motor determinístico lida com matemática, regras e ranking.

### “Vocês realmente monitoram promoções?”

No hackathon, demonstramos o mecanismo com um evento simulado. Não afirmamos cobertura do mercado real. A contribuição técnica é casar uma nova oportunidade com estratégias e clientes já registrados.

### “Como vocês evitam uma recomendação ruim?”

Com dados identificados por origem e data, regras determinísticas, confirmação de emissão antes de transferência, distinção entre desembolso e custo econômico, nível de confiança e ação humana para passos irreversíveis.

### “Isso compra ou transfere pontos sozinho?”

Não no MVP. O sistema recomenda e orienta. Transferências podem ser irreversíveis, portanto exigem confirmação humana.

### “Qual é o diferencial para comparadores?”

Comparadores listam alternativas do momento. O MilesAI cria uma estratégia baseada na carteira e nas preferências do cliente, sabe quando esperar e reavalia quando a condição certa acontece.

### “O que foi feito no evento?”

Responder somente com fatos verificáveis do repositório: interface, motor, schemas, integração OpenAI, fixtures, replay de promoção e testes. Não mencionar roadmap como funcionalidade pronta.

### “Como isso vira negócio?”

SaaS por agente ou por agência, com planos baseados em número de clientes/estratégias monitoradas. Futuramente, integrações e white-label para redes de agências.

---

## 25. Riscos e mitigação

| Risco | Mitigação no MVP |
|---|---|
| Parecer chatbot genérico | mostrar cálculo, estado, condição e replay de evento |
| IA inventar números | números vêm apenas de fixtures e motor determinístico |
| Promoção parecer falsa | selo “simulada” e explicação honesta do mecanismo |
| Demo depender da internet | fallback local e cenário pré-carregado |
| Escopo estourar | P0 rígido; cortar login, banco e integrações |
| Economia enganosa | separar desembolso e custo econômico |
| Transferência irreversível | confirmação de emissão + aprovação humana |
| Dados desatualizados | mostrar fonte, horário e nível de confiança |
| Balcão de milhas gerar dúvida jurídica | tratar apenas como cotação mockada, sem transação |
| Promoção não servir a todos | matching contextual; segundo cliente opcional |
| Interface bonita sem engenharia | exibir detalhes calculados e ter testes no repo |
| Engenharia forte sem clareza | uma história, um cliente, uma promoção |
| API lenta durante o pitch | resposta pré-estruturada de fallback |
| Alegar mais do que foi feito | checklist de claims antes da apresentação |

---

## 26. Não-objetivos

Não faz parte do hackathon:

- ser agência de viagens;
- emitir bilhetes;
- custodiar pontos;
- comprar ou vender milhas;
- garantir preço, disponibilidade ou economia;
- oferecer aconselhamento financeiro;
- cobrir todos os programas do Brasil;
- substituir a confirmação humana;
- criar um marketplace;
- monitorar a internet inteira;
- construir um CRM completo;
- treinar um modelo próprio;
- implementar RAG apenas para dizer que existe RAG.

---

## 27. Roadmap pós-hackathon

### Fase 1 — Validação com agentes

- entrevistas com 10–20 agentes independentes;
- medir tempo do fluxo atual;
- validar linguagem, disposição a pagar e confiança;
- ampliar cenários sem integrar transações.

### Fase 2 — Dados autorizados

- integrações com parceiros de disponibilidade e tarifas;
- ingestão autorizada de promoções;
- atualização e proveniência de dados;
- regras por programa versionadas.

### Fase 3 — Operação do pequeno negócio

- múltiplos clientes e viagens;
- colaboração de equipe;
- alertas por e-mail/WhatsApp com consentimento;
- copiar proposta para o cliente;
- CRM leve e histórico de decisões.

### Fase 4 — Confiança e escala

- avaliações offline com cenários históricos;
- trilha de auditoria;
- monitoramento de qualidade;
- explicação das mudanças de estratégia;
- controles de privacidade e retenção.

### Fase 5 — Plataforma

- white-label para agências;
- APIs para parceiros;
- marketplace somente após análise jurídica e contratual;
- execução assistida com aprovações explícitas.

---

## 28. README mínimo esperado no repositório

O README da implementação deve conter:

1. one-liner;
2. problema e público;
3. fluxo da demo;
4. arquitetura;
5. como instalar e rodar;
6. variáveis de ambiente;
7. como rodar testes;
8. como ativar o caso de demo;
9. quais dados são mockados;
10. o que foi construído durante o evento;
11. limitações e próximos passos;
12. link do vídeo e deploy, quando existirem.

---

## 29. Checklist de apresentação honesta

Antes de apresentar, conferir cada frase do pitch:

- “construímos” → existe no repositório e funciona;
- “calculamos” → existe teste reproduzível;
- “monitoramos” → dizer “simulamos um evento” se não houver fonte real;
- “economizamos” → dizer “economia econômica estimada com dados mockados”;
- “agente” → demonstrar estado, ferramenta e reação, não apenas resposta;
- “OpenAI” → apontar concretamente extração estruturada e explicação;
- “pronto” → fluxo executado ponta a ponta sem intervenção manual indevida.

---

## 30. Instrução final explícita para o Codex

> **Codex, comece agora pelo MVP P0 do MilesAI.**

Siga esta ordem:

1. leia esta especificação inteira;
2. confirme que está no repositório público criado para o hackathon;
3. não reutilize código proibido ou trabalho anterior ao evento;
4. crie o scaffold e o primeiro commit;
5. implemente tipos, schemas, fixtures e o motor determinístico;
6. escreva e rode os testes de `WAIT`, `EXECUTE` e economia de R$ 4.200;
7. implemente a integração OpenAI com saída estruturada e fallback;
8. construa a interface do fluxo principal;
9. implemente o replay da promoção de 90% e o alerta WOW;
10. adicione modo iniciante, selo de dados simulados e tratamento de erros;
11. execute o fluxo completo pelo menos duas vezes;
12. atualize o README com comandos, escopo real e limitações;
13. pare de adicionar funcionalidades quando o P0 estiver pronto;
14. preserve os minutos finais para ensaio, vídeo e submissão.

Definição de sucesso:

> Em menos de três minutos, um jurado entende o problema, vê uma recomendação `ESPERE`, presencia uma promoção mudar a decisão para `EXECUTE` e entende por que isso dá superpoderes a um pequeno agente de viagens.
