import { describe, expect, it } from "vitest";
import {
  formatAirportCode,
  formatBrazilPhone,
  isValidBrazilPhone,
  isValidEmail,
} from "@/domain/field-formatters";

describe("formatadores de cadastro", () => {
  it("formata celular brasileiro enquanto o agente digita", () => {
    expect(formatBrazilPhone("1")).toBe("(1");
    expect(formatBrazilPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatBrazilPhone("(11) 3456-7890")).toBe("(11) 3456-7890");
    expect(formatBrazilPhone("+55 11 98765-4321")).toBe("(11) 98765-4321");
  });

  it("valida telefone com DDD e e-mail completo", () => {
    expect(isValidBrazilPhone("(11) 98765-4321")).toBe(true);
    expect(isValidBrazilPhone("1198765")).toBe(false);
    expect(isValidEmail("agente@empresa.com.br")).toBe(true);
    expect(isValidEmail("email-invalido")).toBe(false);
  });

  it("normaliza códigos IATA para três letras", () => {
    expect(formatAirportCode("g-r_u99")).toBe("GRU");
    expect(formatAirportCode("lisboa")).toBe("LIS");
  });
});
