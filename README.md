# MilesAI

> MilesAI transforma pequenos agentes de viagem em especialistas em pontos, combinando dinheiro, milhas e promoções em uma estratégia simples e acionável para cada cliente.

MVP criado durante o **OpenAI Hackathon Brasil** para o desafio **Pequenos Negócios**.

## Problema e público

Agentes de viagem independentes e pequenas agências perdem horas alternando entre WhatsApp, programas de fidelidade, sites e planilhas para decidir se um cliente deve comprar, emitir com pontos ou esperar uma promoção.

O MilesAI é um copiloto B2B de decisão. Ele estrutura o pedido do viajante, compara três caminhos com código determinístico, registra uma condição relevante e reavalia a estratégia quando chega um evento simulado.

## Fluxo da demo

1. O caso de João já vem preenchido na tela inicial.
2. Clique em **Analisar viagem**.
3. Confira o perfil, a carteira de 220 mil Livelo + 80 mil Smiles e as três alternativas.
4. A primeira recomendação é **ESPERE**, pois o bônus atual de 30% está abaixo da meta de 80%.
5. Clique em **Simular nova promoção**.
6. O evento Livelo → TAP com bônus de 90% reexecuta o motor.
7. A recomendação muda para **EXECUTE A ESTRATÉGIA**.
8. Confira 120 mil pontos → 228 mil milhas e economia econômica estimada de R$ 4.200.
9. Abra o **modo iniciante** para ver os 10 passos e o aviso antes da transferência.

O fluxo foi desenhado para caber em uma apresentação de até três minutos e funciona sem conexão com a OpenAI.

## Arquitetura

```text
Next.js App Router
├── interface React responsiva
├── POST /api/analyze
│   ├── Responses API + Structured Outputs (opcional)
│   └── fallback local da demo
├── POST /api/promotion
│   └── matching + replay determinístico
└── domínio TypeScript
    ├── schemas Zod
    ├── fixtures JSON mockadas
    ├── cálculo de dinheiro, pontos e balcão
    └── ranking, regras e guardrails
```

A OpenAI interpreta a linguagem natural e explica um resultado já calculado. Preços, pontos, elegibilidade, custos e ranking nunca são calculados pelo modelo. A integração segue o padrão oficial de [Structured Outputs na Responses API](https://developers.openai.com/api/docs/guides/structured-outputs).

## Stack

- Next.js 16 + React 19 + TypeScript;
- Zod para validar entradas, fixtures e saídas do motor;
- OpenAI SDK com `responses.parse` e `zodTextFormat`;
- Vitest para testes determinísticos;
- CSS responsivo sem dependência de assets externos.

## Instalar e rodar

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Acesse <http://localhost:3000>. Se a porta estiver ocupada, o Next.js indicará a porta alternativa no terminal.

Para validar o mesmo artefato que será usado em produção local:

```bash
pnpm build
pnpm start
```

## Variáveis de ambiente

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_DEMO_MODE=true
```

- `OPENAI_API_KEY`: opcional; nunca é enviada ao navegador.
- `OPENAI_MODEL`: obrigatório apenas quando a chamada OpenAI estiver ativa; não há modelo fixado no domínio.
- `NEXT_PUBLIC_DEMO_MODE`: identifica a execução como demonstração.

Se a chave, o modelo ou a API estiverem indisponíveis, `/api/analyze` responde com o perfil e a explicação locais, informa **Modo de demonstração** e mantém todo o fluxo operacional.

## Testes e verificação

Execute tudo de uma vez:

```bash
pnpm check
```

Ou separadamente:

```bash
pnpm test
pnpm lint
pnpm build
```

A suíte cobre:

- bônus de 30% → `WAIT`;
- bônus de 80% → 125 mil de origem → 225 mil de destino → `EXECUTE`;
- bônus de 90% → 120 mil → 228 mil;
- custo econômico de R$ 4.150 e economia de R$ 4.200;
- saldo insuficiente;
- emissão indisponível;
- cotação de balcão vencida;
- custo econômico dos pontos maior que dinheiro;
- dados materiais ausentes → `REVIEW`;
- replay compatível e evento não compatível;
- análise com fallback sem chave.

Além da suíte automatizada, o fluxo completo foi executado duas vezes no navegador, em desktop (1440×1000) e mobile (390×844), incluindo edição do perfil, promoção, alerta e checklist. Nenhum erro de console foi observado.

## Dados mockados

Todos estes dados são simulados e identificados na interface:

- saldos Livelo e Smiles;
- preço em dinheiro de R$ 8.350;
- emissão-alvo de 220 mil milhas;
- taxas e trecho de posicionamento;
- cotação hipotética de balcão;
- bônus inicial de 30% e evento de 90%;
- disponibilidade e datas de observação.

As fixtures estão em [`src/data`](src/data). O produto não consulta companhias, não faz scraping e não executa compra, emissão ou transferência.

## O que foi construído no evento

- scaffold e interface responsiva do caso de demonstração;
- perfil editável e carteira estruturada;
- schemas, fixtures e contratos tipados;
- motor determinístico com três alternativas, custo econômico e score;
- condição monitorada e replay do evento de promoção;
- alerta visual do momento WOW;
- modo iniciante com 10 passos e guardrail de irreversibilidade;
- integração opcional com a OpenAI e fallback local;
- testes automatizados e documentação de execução.

O histórico de commits preserva essas etapas na ordem do backlog P0.

## Limitações e próximos passos

Este é um protótipo de hackathon. Ele não oferece autenticação, banco de produção, preços reais, scraping, notificações, múltiplas viagens ou transações. A recomendação não é garantia de disponibilidade ou economia; a emissão deve ser confirmada antes de qualquer transferência.

Próximos passos, fora do P0: validar o fluxo com agentes independentes, contratar fontes autorizadas de dados e somente depois evoluir persistência, múltiplos clientes e alertas consentidos.

## Vídeo e deploy

- Vídeo: a gravar antes da submissão.
- Deploy público: a publicar; a demo local de produção é o backup oficial por enquanto.

## Especificação

O escopo, critérios de pronto, roteiro de pitch e roteiro do vídeo estão em [`MilesAI_Hackathon_Spec.md`](MilesAI_Hackathon_Spec.md).
