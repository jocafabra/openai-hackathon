import { deleteCase, getCase, updateCase } from "@/server/case-repository";
import { z } from "zod";
import { apiError, notFound, readJson } from "../http";

interface Context {
  params: Promise<{ id: string }>;
}

const idSchema = z.uuid();

export async function GET(_request: Request, context: Context) {
  try {
    const id = idSchema.parse((await context.params).id);
    const item = await getCase(id);
    return item ? Response.json({ data: item }) : notFound();
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = idSchema.parse((await context.params).id);
    const item = await updateCase(id, await readJson(request));
    return item ? Response.json({ data: item }) : notFound();
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const id = idSchema.parse((await context.params).id);
    return await deleteCase(id)
      ? new Response(null, { status: 204 })
      : notFound();
  } catch (error) {
    return apiError(error);
  }
}
