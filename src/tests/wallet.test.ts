import { describe, expect, it } from "vitest";
import { walletSchema } from "@/domain/schemas";
import { replaceWalletBalances } from "@/domain/wallet";
import { createDemoInput } from "@/data/demo";
import { casePatchSchema } from "@/server/case-repository";

const OBSERVED_AT = "2026-08-19T15:30:00.000Z";

describe("carteira de pontos e milhas", () => {
  it("aceita múltiplos programas com preço, fonte e data por saldo", () => {
    const wallet = walletSchema.parse({
      travelerId: "traveler_ana",
      source: "Carteira atualizada pelo agente",
      balances: [
        {
          program: "Livelo",
          balance: 120_000,
          expiresAt: null,
          referenceValuePer1000BRL: 18.5,
          source: "Extrato enviado pelo cliente",
          updatedAt: OBSERVED_AT,
        },
        {
          program: "Smiles",
          balance: 42_000,
          expiresAt: "2027-02-01",
          referenceValuePer1000BRL: 16,
          source: "Consulta manual no aplicativo",
          updatedAt: OBSERVED_AT,
        },
      ],
    });

    expect(wallet.balances).toHaveLength(2);
    expect(wallet.balances[0]?.source).toBe("Extrato enviado pelo cliente");
    expect(wallet.balances[1]?.referenceValuePer1000BRL).toBe(16);
  });

  it("recusa programas duplicados ignorando maiúsculas e espaços", () => {
    const result = walletSchema.safeParse({
      travelerId: "traveler_ana",
      source: "Cadastro manual",
      balances: [
        { program: "Livelo", balance: 10, expiresAt: null, referenceValuePer1000BRL: 20, updatedAt: OBSERVED_AT },
        { program: "  LIVELO ", balance: 20, expiresAt: null, referenceValuePer1000BRL: 21, updatedAt: OBSERVED_AT },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("substitui a carteira normalizando valores manuais e preservando a identidade", () => {
    const wallet = replaceWalletBalances(
      {
        travelerId: "traveler_ana",
        source: "Importação antiga",
        balances: [{
          program: "Livelo",
          balance: 10,
          expiresAt: null,
          referenceValuePer1000BRL: 20,
          updatedAt: "2026-01-01",
        }],
      },
      [
        {
          program: "  Livelo ",
          balance: 123_456,
          expiresAt: "",
          referenceValuePer1000BRL: 18.75,
          source: "  Extrato do cliente  ",
          updatedAt: "2026-08-18",
        },
        {
          program: "Smiles",
          balance: 40_000,
          expiresAt: "2027-01-31",
          referenceValuePer1000BRL: 15,
          source: "",
          updatedAt: "",
        },
      ],
      { source: "Edição manual pelo agente", observedAt: OBSERVED_AT },
    );

    expect(wallet.travelerId).toBe("traveler_ana");
    expect(wallet.source).toBe("Edição manual pelo agente");
    expect(wallet.balances).toEqual([
      {
        program: "Livelo",
        balance: 123_456,
        expiresAt: null,
        referenceValuePer1000BRL: 18.75,
        source: "Extrato do cliente",
        updatedAt: "2026-08-18",
      },
      {
        program: "Smiles",
        balance: 40_000,
        expiresAt: "2027-01-31",
        referenceValuePer1000BRL: 15,
        source: "Edição manual pelo agente",
        updatedAt: OBSERVED_AT,
      },
    ]);
  });

  it("aceita a carteira completa no contrato de atualização do caso", () => {
    const input = createDemoInput();
    input.wallet.balances = [
      { ...input.wallet.balances[0], source: "Extrato Livelo" },
      {
        program: "Smiles",
        balance: 50_000,
        expiresAt: null,
        referenceValuePer1000BRL: 15,
        source: "Extrato Smiles",
        updatedAt: OBSERVED_AT,
      },
    ];

    const patch = casePatchSchema.parse({ input });

    expect(patch.input?.wallet.balances.map((balance) => balance.program)).toEqual(["Livelo", "Smiles"]);
    expect(patch.input?.wallet.balances[1]?.source).toBe("Extrato Smiles");
  });
});
