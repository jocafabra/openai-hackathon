import { z } from "zod";
import { promotionEventSchema, runMonitor } from "@/server/case-repository";
import { apiError, readJson } from "../../cases/http";

const monitorRequestSchema = z.object({
  events: z.array(promotionEventSchema).default([]),
});

export async function POST(request: Request) {
  try {
    const payload = monitorRequestSchema.parse(await readJson(request));
    return Response.json({ data: await runMonitor(payload.events) });
  } catch (error) {
    return apiError(error);
  }
}
