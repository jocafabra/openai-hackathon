import { createHash } from "node:crypto";

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  maxConnections: number;
}

export interface FlightSearchOffer {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  connections: number;
  totalBRL: number;
  currency: "BRL";
  bookingUrl?: string;
  source: string;
  mode: "mock" | "live";
}

export interface FlightSearchResult {
  mode: "mock" | "live";
  provider: string;
  observedAt: string;
  disclaimer: string;
  offers: FlightSearchOffer[];
}

function assertQuery(raw: FlightSearchQuery): FlightSearchQuery {
  const origin = raw.origin?.trim().toUpperCase();
  const destination = raw.destination?.trim().toUpperCase();
  const adults = Number(raw.adults);
  const maxConnections = Number(raw.maxConnections);
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    throw new Error("Informe aeroportos com três letras, como GRU e LIS.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.departureDate)) {
    throw new Error("Informe a data de ida no formato AAAA-MM-DD.");
  }
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) {
    throw new Error("A quantidade de passageiros deve ficar entre 1 e 9.");
  }
  return { ...raw, origin, destination, adults, maxConnections: Math.max(0, Math.min(3, maxConnections || 0)) };
}

function mockSearch(raw: FlightSearchQuery, now = new Date()): FlightSearchResult {
  const query = assertQuery(raw);
  const digest = createHash("sha256")
    .update(`${query.origin}:${query.destination}:${query.departureDate}:${query.adults}`)
    .digest();
  const base = 2_300 + digest.readUInt16BE(0) % 2_400;
  const departure = new Date(`${query.departureDate}T09:20:00.000Z`);
  const carriers = ["LATAM", "TAP", "Azul"];
  const offers = carriers.map((airline, index): FlightSearchOffer => {
    const connections = Math.min(query.maxConnections, index === 0 ? 1 : index % 2);
    const durationMinutes = 510 + index * 75 + connections * 95;
    const departureAt = new Date(departure.getTime() + index * 2 * 60 * 60 * 1_000);
    const arrivalAt = new Date(departureAt.getTime() + durationMinutes * 60 * 1_000);
    return {
      id: `mock_${digest.toString("hex").slice(0, 8)}_${index + 1}`,
      airline,
      flightNumber: `${airline.slice(0, 2).toUpperCase()} ${100 + digest[index]}`,
      origin: query.origin,
      destination: query.destination,
      departureAt: departureAt.toISOString(),
      arrivalAt: arrivalAt.toISOString(),
      durationMinutes,
      connections,
      totalBRL: Math.round((base + index * 420 - (connections ? 280 : 0)) * query.adults),
      currency: "BRL",
      source: "Cenário determinístico MilesAI",
      mode: "mock",
    };
  });
  return {
    mode: "mock",
    provider: "MilesAI MockFlightProvider",
    observedAt: now.toISOString(),
    disclaimer: "Dados simulados e determinísticos. Não representam preço nem disponibilidade real.",
    offers: offers.sort((a, b) => a.totalBRL - b.totalBRL),
  };
}

interface SerpFlight {
  flights?: Array<{
    airline?: string;
    flight_number?: string;
    departure_airport?: { id?: string; time?: string };
    arrival_airport?: { id?: string; time?: string };
    duration?: number;
  }>;
  total_duration?: number;
  price?: number;
  booking_token?: string;
}

function parseSerpTime(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

async function liveSearch(query: FlightSearchQuery, apiKey: string): Promise<FlightSearchResult> {
  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: query.origin,
    arrival_id: query.destination,
    outbound_date: query.departureDate,
    adults: String(query.adults),
    currency: "BRL",
    hl: "pt-br",
    gl: "br",
    type: query.returnDate ? "1" : "2",
  });
  if (query.returnDate) params.set("return_date", query.returnDate);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`SerpApi respondeu ${response.status}`);
    const payload = await response.json() as {
      best_flights?: SerpFlight[];
      other_flights?: SerpFlight[];
      error?: string;
    };
    if (payload.error) throw new Error(payload.error);
    const rawOffers = [...(payload.best_flights ?? []), ...(payload.other_flights ?? [])];
    const observedAt = new Date().toISOString();
    const offers = rawOffers.flatMap((itinerary, index): FlightSearchOffer[] => {
      const segments = itinerary.flights ?? [];
      const first = segments[0];
      const last = segments.at(-1);
      if (!first || !last || typeof itinerary.price !== "number") return [];
      const departureAt = parseSerpTime(first.departure_airport?.time, observedAt);
      const arrivalAt = parseSerpTime(last.arrival_airport?.time, observedAt);
      return [{
        id: `serp_${createHash("sha1").update(JSON.stringify(itinerary)).digest("hex").slice(0, 12)}_${index}`,
        airline: [...new Set(segments.map((segment) => segment.airline).filter(Boolean))].join(" + ") || "Companhia aérea",
        flightNumber: segments.map((segment) => segment.flight_number).filter(Boolean).join(" / ") || "Itinerário",
        origin: first.departure_airport?.id ?? query.origin,
        destination: last.arrival_airport?.id ?? query.destination,
        departureAt,
        arrivalAt,
        durationMinutes: itinerary.total_duration ?? segments.reduce((sum, segment) => sum + (segment.duration ?? 0), 0),
        connections: Math.max(0, segments.length - 1),
        totalBRL: itinerary.price,
        currency: "BRL",
        bookingUrl: itinerary.booking_token ? "https://www.google.com/travel/flights" : undefined,
        source: "SerpApi / Google Flights",
        mode: "live",
      }];
    }).filter((offer) => offer.connections <= query.maxConnections);
    if (offers.length === 0) throw new Error("Nenhuma oferta compatível retornada pela fonte live.");
    return {
      mode: "live",
      provider: "SerpApi / Google Flights",
      observedAt,
      disclaimer: "Cotação real observada agora. Preço e disponibilidade devem ser revalidados antes da compra.",
      offers: offers.sort((a, b) => a.totalBRL - b.totalBRL).slice(0, 8),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function searchFlights(raw: FlightSearchQuery): Promise<FlightSearchResult> {
  const query = assertQuery(raw);
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) return mockSearch(query);
  try {
    return await liveSearch(query, apiKey);
  } catch (error) {
    const fallback = mockSearch(query);
    return {
      ...fallback,
      disclaimer: `Fonte live indisponível (${error instanceof Error ? error.message : "erro desconhecido"}). ${fallback.disclaimer}`,
    };
  }
}

export const flightSearchInternals = { assertQuery, mockSearch };
