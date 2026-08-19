import { NextResponse } from "next/server";
import { searchFlights } from "@/server/flight-search";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await searchFlights(body));
  } catch (error) {
    return NextResponse.json({
      code: "INVALID_FLIGHT_SEARCH",
      message: error instanceof Error ? error.message : "Não foi possível pesquisar os voos.",
    }, { status: 400 });
  }
}
