import { query } from "@/server/db";

export async function GET() {
  try {
    await query("SELECT 1");
    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MilesAI health check failed", error);
    return Response.json({
      status: "degraded",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
