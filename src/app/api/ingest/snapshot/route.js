import { getConfig } from "@/config";
import { ingestSnapshot } from "@/ingestion";
import { isAuthorized } from "@/http";
import { createWriteClient } from "@/supabase";
import { ValidationError } from "@/validation";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const config = getConfig({ requireSecret: true });
    if (!isAuthorized(request, config)) return Response.json({ error: "unauthorized" }, { status: 401 });
    const snapshot = await request.json();
    const variant = new URL(request.url).searchParams.get("variant") || "primary";
    const result = await ingestSnapshot({ client: createWriteClient(), snapshot, variant });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) return Response.json({ error: error.message, details: error.errors }, { status: 422 });
    if (error.message?.includes("variant")) return Response.json({ error: error.message }, { status: 422 });
    return Response.json({ error: "snapshot_ingestion_failed" }, { status: 500 });
  }
}
