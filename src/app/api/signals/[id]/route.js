import { createReadClient } from "@/supabase";
import { getPublishedSignal } from "@/radar";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  try {
    const signal = await getPublishedSignal(createReadClient(), id);
    if (!signal) return Response.json({ error: "signal_not_found" }, { status: 404 });
    return Response.json(signal);
  } catch {
    return Response.json({ error: "signal_lookup_failed" }, { status: 503 });
  }
}
