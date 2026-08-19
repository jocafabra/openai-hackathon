import { processPromotionEvent } from "@/server/case-repository";
import { apiError, readJson } from "../../cases/http";

export async function POST(request: Request) {
  try {
    const result = await processPromotionEvent(await readJson(request));
    return Response.json({ data: result }, { status: result.duplicateEvent ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
