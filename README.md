# MilesAI

> MilesAI transforma pequenos agentes de viagem em especialistas em pontos, combinando dinheiro, milhas e promoções em uma estratégia simples e acionável para cada cliente.

MVP criado para o desafio **Pequenos Negócios** do OpenAI Hackathon Brasil. O fluxo demonstra como uma mensagem de cliente vira uma recomendação verificável, uma condição monitorada e uma nova decisão quando chega uma promoção simulada.

## Estado atual

Implementado até aqui:

- scaffold do monólito web em Next.js + TypeScript;
- contratos e validação com Zod;
- fixtures JSON do cenário de João;
- motor determinístico com três alternativas;
- replay do evento de promoção;
- 11 testes cobrindo `WAIT`, `EXECUTE` e guardas obrigatórias.

A interface e a integração opcional com a OpenAI estão em construção, seguindo a ordem do P0 definida em `MilesAI_Hackathon_Spec.md`.

## Rodar localmente

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Acesse <http://localhost:3000>.

## Testes

```bash
pnpm test
pnpm lint
pnpm build
```

Os testes verificam os bônus de 30%, 80% e 90%, saldo insuficiente, emissão indisponível, cotação vencida e a economia econômica de R$ 4.200.

## Dados e segurança

Todos os preços, saldos, disponibilidades e promoções do MVP são simulados e devem permanecer identificados na interface. Nenhuma chave é obrigatória para o caso de demo, e nenhuma compra, emissão ou transferência é executada.
