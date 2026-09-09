import { connection } from "next/server";

import { listPublishedSignals } from "@/radar";
import { createReadClient } from "@/supabase";
import DashboardView from "./dashboard-view";

export const dynamic = "force-dynamic";

async function loadRadar() {
  try {
    const data = await listPublishedSignals(createReadClient(), {
      limit: 50,
      order: "priority",
    });

    return { data, error: null };
  } catch {
    return {
      data: { snapshot_date: null, total: 0, signals: [] },
      error: "No se pudo conectar con Supabase.",
    };
  }
}

export default async function Home() {
  await connection();
  const { data, error } = await loadRadar();

  return <DashboardView data={data} error={error} />;
}
