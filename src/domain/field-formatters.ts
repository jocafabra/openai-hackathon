export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatBrazilPhone(value: string): string {
  const rawDigits = digitsOnly(value);
  const digits = (rawDigits.startsWith("55") && rawDigits.length > 11 ? rawDigits.slice(2) : rawDigits).slice(0, 11);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;

  const area = digits.slice(0, 2);
  const local = digits.slice(2);
  const splitAt = digits.length > 10 ? 5 : 4;
  const first = local.slice(0, splitAt);
  const second = local.slice(splitAt);
  return `(${area}) ${first}${second ? `-${second}` : ""}`;
}

export function isValidBrazilPhone(value: string): boolean {
  const rawDigits = digitsOnly(value);
  const digits = rawDigits.startsWith("55") && rawDigits.length > 11 ? rawDigits.slice(2) : rawDigits;
  return digits.length === 10 || digits.length === 11;
}

export function isValidEmail(value: string): boolean {
  const normalized = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function formatAirportCode(value: string): string {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3);
}
