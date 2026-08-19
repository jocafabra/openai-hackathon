import { describe, expect, it } from "vitest";
import { flightSearchInternals } from "@/server/flight-search";

describe("MockFlightProvider", () => {
  it("gera as mesmas ofertas para a mesma busca e identifica o modo mock", () => {
    const query = { origin: "REC", destination: "LIS", departureDate: "2027-05-10", adults: 1, maxConnections: 1 };
    const now = new Date("2026-08-19T12:00:00.000Z");
    const first = flightSearchInternals.mockSearch(query, now);
    const second = flightSearchInternals.mockSearch(query, now);
    expect(first).toEqual(second);
    expect(first.mode).toBe("mock");
    expect(first.offers).toHaveLength(3);
    expect(first.offers.every((offer) => offer.origin === "REC" && offer.destination === "LIS")).toBe(true);
    expect(first.disclaimer).toContain("simulados");
  });

  it("rejeita aeroporto e quantidade de passageiros inválidos", () => {
    expect(() => flightSearchInternals.assertQuery({
      origin: "Recife",
      destination: "LIS",
      departureDate: "2027-05-10",
      adults: 0,
      maxConnections: 1,
    })).toThrow(/aeroportos/);
  });
});
