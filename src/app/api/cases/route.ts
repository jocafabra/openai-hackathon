import { z } from "zod";
import { createCase, listCases } from "@/server/case-repository";
import { apiError, readJson } from "./http";

const statusSchema = z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]);

export async function GET(request: Request) {
  try {
    const rawStatus = new URL(request.url).searchParams.get("status");
    const status = rawStatus ? statusSchema.parse(rawStatus) : undefined;
    return Response.json({ data: await listCases({ status }) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const created = await createCase(await readJson(request));
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
