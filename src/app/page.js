import { createReadClient } from "@/supabase";
import { listPublishedSignals } from "@/radar";
import { connection } from "next/server";

export const dynamic = "force-dynamic";

const categoryLabels = {
  model: "Modelo",
  research: "Investigación",
  company: "Empresa",
  infrastructure: "Infraestructura",
  security: "Seguridad",
  policy: "Política",
  tool: "Herramienta",
  paper: "Paper",
  repository: "Repositorio",
  launch: "Lanzamiento",
};

const priorityStyles = {
  high: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  low: "border-sky-400/40 bg-sky-400/10 text-sky-200",
};

async function loadRadar() {
  try {
    const data = await listPublishedSignals(createReadClient(), { limit: 20, order: "priority" });
    return { data, error: null };
  } catch {
    return { data: null, error: "No se pudo conectar con Supabase." };
  }
}

export default async function Home() {
  await connection();
  const { data, error } = await loadRadar();
  const signals = data?.signals || [];

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">AI Radar / desarrollo</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Señales útiles en medio del ruido.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Noticias, papers, repositorios y lanzamientos convertidos en evidencia verificable y acciones concretas para builders.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm text-cyan-100">
            <p className="font-semibold">Snapshot activo</p>
            <p className="mt-1 text-cyan-200/80">{data?.snapshot_date || "Sin datos publicados"}</p>
          </div>
        </header>

        {error ? (
          <section className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6 text-amber-100">
            <h2 className="font-semibold">Conexión pendiente</h2>
            <p className="mt-2 text-sm text-amber-100/80">{error} Configura las variables server-side de Supabase para ver las señales.</p>
          </section>
        ) : (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Radar publicado</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{data?.total || 0} señales para revisar</h2>
              </div>
              <a className="hidden rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200 md:inline-flex" href="/api/health">Estado de API</a>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {signals.map((signal) => {
                const priority = signal.action[0]?.priority || "low";
                return (
                  <article key={signal.id} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-300/30">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-200">{categoryLabels[signal.category] || signal.category}</span>
                      <span className={`rounded-full border px-3 py-1 font-medium ${priorityStyles[priority]}`}>Prioridad {priority}</span>
                      <span className="ml-auto text-slate-500">{signal.id}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold leading-tight text-white">{signal.title}</h3>
                    <p className="mt-4 leading-7 text-slate-300">{signal.impact.summary}</p>
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qué hacer</p>
                      <p className="mt-2 leading-7 text-slate-200">{signal.action[0]?.recommendation}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {signal.source.slice(0, 3).map((source) => (
                        <a key={source.url} className="truncate rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 hover:border-cyan-300/40 hover:text-cyan-200" href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
            {signals.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">Todavía no hay señales publicadas.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
