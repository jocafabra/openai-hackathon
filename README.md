# MilesAI

> MilesAI transforma pequenos agentes de viagem em especialistas em pontos, combinando dinheiro, milhas e promoções em uma estratégia simples e acionável para cada cliente.

MVP criado para o desafio **Pequenos Negócios** do OpenAI Hackathon Brasil. O fluxo demonstra como uma mensagem de cliente vira uma recomendação verificável, uma condição monitorada e uma nova decisão quando chega uma promoção simulada.

## Estado atual

Scaffold inicial do monólito web em Next.js + TypeScript. A implementação do P0 seguirá a ordem definida em `MilesAI_Hackathon_Spec.md`.

## Rodar localmente

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Acesse <http://localhost:3000>.

## Dados e segurança

Todos os preços, saldos, disponibilidades e promoções do MVP são simulados e devem permanecer identificados na interface. Nenhuma chave é obrigatória para o caso de demo, e nenhuma compra, emissão ou transferência é executada.

