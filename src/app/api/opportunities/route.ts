import { z } from "zod";
import { listOpportunities } from "@/server/case-repository";
import { apiError } from "../cases/http";

const statusSchema = z.enum(["OPEN", "DISMISSED", "COMPLETED"]);

export async function GET(request: Request) {
  try {
    const rawStatus = new URL(request.url).searchParams.get("status");
    const status = rawStatus ? statusSchema.parse(rawStatus) : undefined;
    return Response.json({ data: await listOpportunities(status) });
  } catch (error) {
    return apiError(error);
  }
}
