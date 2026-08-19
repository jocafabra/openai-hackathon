import { evaluateCase } from "@/server/case-repository";
import { z } from "zod";
import { apiError, notFound } from "../../http";

interface Context {
  params: Promise<{ id: string }>;
}

const idSchema = z.uuid();

export async function POST(_request: Request, context: Context) {
  try {
    const id = idSchema.parse((await context.params).id);
    const evaluation = await evaluateCase(id);
    return evaluation ? Response.json({ data: evaluation }) : notFound();
  } catch (error) {
    return apiError(error);
  }
}
