import { ZodError } from "zod";

export function apiError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Os dados enviados são inválidos.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    }, { status: 400 });
  }
  if (error instanceof SyntaxError) {
    return Response.json({
      error: { code: "INVALID_JSON", message: "O corpo da requisição não contém JSON válido." },
    }, { status: 400 });
  }
  console.error("MilesAI API error", error);
  return Response.json({
    error: { code: "INTERNAL_ERROR", message: "Não foi possível concluir a operação." },
  }, { status: 500 });
}

export function notFound(resource = "Caso"): Response {
  return Response.json({
    error: { code: "NOT_FOUND", message: `${resource} não encontrado.` },
  }, { status: 404 });
}

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}
