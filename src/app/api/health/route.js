import { createReadClient } from "@/supabase";
import { getConfig } from "@/config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = getConfig({ requirePublishable: true });
    const { error } = await createReadClient().from("snapshots").select("id", { head: true, count: "exact" });
    if (error) throw error;
    return Response.json({ ok: true, database: "available", environment: config.appEnv });
  } catch {
    return Response.json({ ok: false, database: "unavailable", error: "supabase_unavailable" }, { status: 503 });
  }
}
