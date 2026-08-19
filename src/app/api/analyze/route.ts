import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeMessage } from "@/server/orchestrator";

const requestSchema = z.object({ message: z.string().trim().min(10).max(4_000) });

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return NextResponse.json(await analyzeMessage(body.message));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Descreva a viagem em pelo menos 10 caracteres.", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível analisar a mensagem. O caso de demo continua disponível." },
      { status: 500 },
    );
  }
}

