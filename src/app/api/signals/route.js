import { createReadClient } from "@/supabase";
import { listPublishedSignals } from "@/radar";

export const runtime = "nodejs";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  try {
    const data = await listPublishedSignals(createReadClient(), {
      limit: params.get("limit"),
      order: params.get("order"),
      date: params.get("date"),
      variant: params.get("variant"),
      category: params.get("category"),
      offset: Number(params.get("offset") || 0),
    });
    return Response.json(data);
  } catch (error) {
    const status = error?.code || error?.name === "ConfigError" ? 503 : 400;
    return Response.json({ error: status === 503 ? "signals_unavailable" : error.message }, { status });
  }
}
