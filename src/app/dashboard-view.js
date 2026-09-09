"use client";

import { useMemo, useState } from "react";

const CATEGORY_LABELS = {
  model: "Modelos",
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

const STATUS_LABELS = {
  confirmed: "Verificada",
  announced: "Anunciada",
  rolling_out: "Despliegue",
  pending_validation: "En revisión",
  pending_closure: "Cierre pendiente",
  mitigation_ongoing: "Mitigación activa",
};

const STATUS_TONES = {
  confirmed: "success",
  announced: "info",
  rolling_out: "info",
  pending_validation: "warning",
  pending_closure: "warning",
  mitigation_ongoing: "danger",
};

const PRIORITY_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const PRIORITY_RANKS = { high: 0, medium: 1, low: 2 };
const REVIEW_STATUSES = new Set(["pending_validation", "pending_closure"]);
const EMPTY_SIGNALS = [];

function formatDate(value, options = {}) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: options.compact ? "medium" : "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function confidenceLabel(confidence) {
  return {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  }[confidence] || "Sin dato";
}

function confidenceLevel(confidence) {
  return {
    high: 100,
    medium: 66,
    low: 33,
  }[confidence] || 0;
}

function sourceNames(signal) {
  return signal.source?.map((source) => source.name).join(", ") || "Sin fuentes";
}

function getPriority(signal) {
  return signal.action?.reduce((current, action) => {
    const priority = action.priority || "low";
    return PRIORITY_RANKS[priority] < PRIORITY_RANKS[current] ? priority : current;
  }, "low") || "low";
}

function latestSourceDate(signal) {
  return signal.source?.map((source) => source.published_at).sort().at(-1) || "";
}

function getImpactLabel(signal) {
  return PRIORITY_LABELS[getPriority(signal)] || "Baja";
}

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    activity: <><path d="M3 12h4l2.2-7 4.6 14 2.2-7H21" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /><path d="M8 7h8M8 11h8" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m8 10 4 4 4-4" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    gear: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="m4.9 4.9 1.4 1.4M17.7 17.7l1.4 1.4M4 12H2M22 12h-2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 4V2M12 22v-2" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="3.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M21 20v-1.5a4 4 0 0 0-3-3.8" /></>,
  };

  return <svg {...common}>{paths[name] || paths.activity}</svg>;
}

function Sidebar({ data, error, mobileOpen, onClose }) {
  const signalCount = data.total ?? data.signals.length;
  const sourceCount = new Set(data.signals.flatMap((signal) => signal.source?.map((source) => source.name) || [])).size;

  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`} aria-label="Navegación principal">
      <div className="sidebar__topline">
        <a className="brand" href="#dashboard" aria-label="AI Radar, ir al dashboard">
          <span className="brand__mark">AI</span> Radar
        </a>
        <button className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="Cerrar navegación">
          <Icon name="close" size={19} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Secciones del dashboard">
        <a className="sidebar-link sidebar-link--active" href="#dashboard" onClick={onClose}>
          <Icon name="grid" size={19} />
          <span>Dashboard técnico</span>
        </a>
        <a className="sidebar-link" href="#ranking" onClick={onClose}>
          <Icon name="list" size={19} />
          <span>Señales</span>
        </a>
        <a className="sidebar-link" href="#activity" onClick={onClose}>
          <Icon name="database" size={19} />
          <span>Fuentes</span>
        </a>
        <a className="sidebar-link" href="#filters" onClick={onClose}>
          <Icon name="search" size={19} />
          <span>Explorar</span>
        </a>
        <button className="sidebar-link sidebar-link--disabled" type="button" disabled title="Este modo aún no está disponible">
          <Icon name="users" size={19} />
          <span>Modo operador</span>
        </button>
        <button className="sidebar-link sidebar-link--disabled" type="button" disabled title="Este modo aún no está disponible">
          <Icon name="book" size={19} />
          <span>Modo lector</span>
        </button>
        <button className="sidebar-link sidebar-link--disabled" type="button" disabled title="Esta sección aún no está disponible">
          <Icon name="gear" size={19} />
          <span>Configuración</span>
        </button>
      </nav>

      <div className="sidebar__bottom">
        <section className="snapshot-card" aria-labelledby="snapshot-title">
          <div className="snapshot-card__header">
            <h2 id="snapshot-title">Snapshot activo</h2>
            <span className={`status-dot ${error ? "status-dot--warning" : ""}`} aria-label={error ? "Conexión pendiente" : "Activo"} />
          </div>
          <p className="snapshot-card__date">{formatDate(data.snapshot_date, { compact: true })}</p>
          <p>{signalCount.toLocaleString("es-MX")} señales publicadas</p>
          <p>{sourceCount.toLocaleString("es-MX")} fuentes en esta página</p>
          <div className="sparkline" aria-hidden="true">
            <span className="sparkline__line" />
            <span className="sparkline__dot" />
          </div>
        </section>

        <div className={`system-status ${error ? "system-status--warning" : ""}`} role="status">
          <span className="system-status__icon"><Icon name={error ? "activity" : "check"} size={15} /></span>
          <div>
            <strong>{error ? "Conexión pendiente" : "Sistema saludable"}</strong>
            <span>{error ? "Revisa Supabase" : "Datos sincronizados"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ icon, tone, value, label, detail }) {
  return (
    <article className="metric-card">
      <div className={`metric-card__icon metric-card__icon--${tone}`}><Icon name={icon} size={23} /></div>
      <div className="metric-card__copy">
        <strong>{value.toLocaleString("es-MX")}</strong>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const tone = STATUS_TONES[status?.code] || "neutral";
  return <span className={`status-badge status-badge--${tone}`}><span aria-hidden="true">{tone === "success" ? "◆" : tone === "warning" ? "✦" : "●"}</span>{STATUS_LABELS[status?.code] || status?.code || "Sin estado"}</span>;
}

function Confidence({ confidence }) {
  const label = confidenceLabel(confidence);
  return (
    <div className="confidence" role="img" aria-label={`Confianza ${label}`}>
      <span>{label}</span>
      <span className="confidence__track" aria-hidden="true"><span style={{ width: `${confidenceLevel(confidence)}%` }} /></span>
    </div>
  );
}

function EvidenceIcons({ signal }) {
  const evidenceCount = signal.evidence?.length || 0;
  const visibleCount = Math.min(evidenceCount, 3);

  return (
    <span className="evidence-icons" aria-label={`${evidenceCount} elementos de evidencia`}>
      {Array.from({ length: visibleCount }, (_, index) => <Icon key={`${signal.id}-evidence-${index}`} name="book" size={15} />)}
      {evidenceCount > visibleCount ? <span>+{evidenceCount - visibleCount}</span> : null}
    </span>
  );
}

function SignalRow({ signal, index }) {
  const category = CATEGORY_LABELS[signal.category] || signal.category;
  const impact = getImpactLabel(signal);

  return (
    <article className="signal-row" role="listitem">
      <div className="signal-row__rank" aria-label={`Posición ${index + 1}`}>{index + 1}</div>
      <div className="signal-row__signal">
        <h3>{signal.title}</h3>
        <p>{category} · {formatDate(latestSourceDate(signal), { compact: true })}</p>
      </div>
      <div className="signal-row__category"><span className={`category-chip category-chip--${signal.category}`}>{category}</span></div>
      <div className="signal-row__evidence"><EvidenceIcons signal={signal} /></div>
      <div className="signal-row__sources"><span>{signal.source?.length || 0}</span><small>fuentes</small></div>
      <div className="signal-row__confidence"><Confidence confidence={signal.impact?.confidence} /></div>
      <div className="signal-row__status"><StatusBadge status={signal.status} /></div>
      <div className={`impact-badge impact-badge--${getPriority(signal)}`}>{impact}</div>
      <div className="signal-row__action">
        <a href={`/api/signals/${signal.id}`} target="_blank" rel="noreferrer" aria-label={`Ver detalle de ${signal.title}`}>Ver detalle <Icon name="arrow" size={14} /></a>
      </div>
    </article>
  );
}

function ActivityPanel({ signals }) {
  const activities = [...signals].sort((left, right) => latestSourceDate(right).localeCompare(latestSourceDate(left))).slice(0, 7).map((signal) => ({
    signal,
    label: STATUS_LABELS[signal.status?.code] || "Señal procesada",
    tone: STATUS_TONES[signal.status?.code] || "info",
  }));

  return (
    <section className="activity-panel" id="activity" aria-labelledby="activity-title">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">Trazabilidad</p>
          <h2 id="activity-title">Actividad reciente</h2>
        </div>
        <span className="section-link">{signals.length} eventos</span>
      </div>
      {activities.length > 0 ? (
        <ol className="activity-list">
          {activities.map(({ signal, label, tone }) => (
            <li className="activity-item" key={signal.id}>
              <span className={`activity-item__dot activity-item__dot--${tone}`} aria-hidden="true" />
              <div>
                <strong>{label}</strong>
                <p>{signal.title}</p>
                <small>{sourceNames(signal)} · {formatDate(latestSourceDate(signal), { compact: true })}</small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-state empty-state--small">Todavía no hay actividad disponible.</p>
      )}
    </section>
  );
}

function FilterTabs({ activeFilter, counts, onChange }) {
  const tabs = [
    ["all", `Todas (${counts.all})`],
    ["high", `Prioridad alta (${counts.high})`],
    ["review", `En revisión (${counts.review})`],
    ["verified", `Verificadas (${counts.verified})`],
  ];

  return (
    <div className="filter-tabs" role="group" aria-label="Filtrar señales">
      {tabs.map(([value, label]) => (
        <button
          className={`filter-tab ${activeFilter === value ? "filter-tab--active" : ""}`}
          key={value}
          type="button"
          aria-pressed={activeFilter === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function DashboardView({ data, error }) {
  const signals = data?.signals ?? EMPTY_SIGNALS;
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("priority");
  const [mobileOpen, setMobileOpen] = useState(false);

  const stats = useMemo(() => {
    const high = signals.filter((signal) => getPriority(signal) === "high").length;
    const verified = signals.filter((signal) => signal.status?.code === "confirmed").length;
    const review = signals.filter((signal) => REVIEW_STATUSES.has(signal.status?.code)).length;
    const sources = new Set(signals.flatMap((signal) => signal.source?.map((source) => source.name) || []));

    return { high, verified, review, sources: sources.size };
  }, [signals]);

  const counts = {
    all: signals.length,
    high: stats.high,
    review: stats.review,
    verified: stats.verified,
  };

  const visibleSignals = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    const filtered = signals.filter((signal) => {
      const matchesFilter = activeFilter === "all"
        || (activeFilter === "high" && getPriority(signal) === "high")
        || (activeFilter === "review" && REVIEW_STATUSES.has(signal.status?.code))
        || (activeFilter === "verified" && signal.status?.code === "confirmed");
      const searchable = [signal.title, signal.category, signal.impact?.summary, sourceNames(signal)].join(" ").toLocaleLowerCase("es-MX");
      return matchesFilter && (!query || searchable.includes(query));
    });

    return [...filtered].sort((left, right) => {
      if (sort === "newest" || sort === "oldest") {
        const leftDate = latestSourceDate(left);
        const rightDate = latestSourceDate(right);
        return sort === "newest" ? rightDate.localeCompare(leftDate) : leftDate.localeCompare(rightDate);
      }

      return PRIORITY_RANKS[getPriority(left)] - PRIORITY_RANKS[getPriority(right)];
    });
  }, [activeFilter, search, signals, sort]);

  const total = data?.total ?? signals.length;
  const snapshotDate = formatDate(data?.snapshot_date, { compact: true });

  return (
    <div className="app-shell" id="dashboard">
      <Sidebar data={{ ...data, signals }} error={error} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen ? <button className="sidebar-backdrop" type="button" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)} /> : null}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">
            <Icon name="menu" size={21} />
          </button>
          <div className="topbar__heading">
            <p className="eyebrow">Inteligencia técnica en tiempo real</p>
            <h1>Dashboard técnico</h1>
            <p className="topbar__description">Convierte señales de IA en acciones verificables para builders.</p>
          </div>
          <div className="topbar__actions">
            <div className="search-box">
              <label className="sr-only" htmlFor="signal-search">Buscar señales, fuentes o temas</label>
              <Icon name="search" size={18} />
              <input id="signal-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar señales, fuentes, temas..." />
              {search ? <button type="button" className="search-box__clear" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><Icon name="close" size={14} /></button> : <kbd>⌘ K</kbd>}
            </div>
            <div className="snapshot-status" role="status">
              <span className={`status-dot ${error ? "status-dot--warning" : ""}`} aria-hidden="true" />
              <div><strong>{error ? "Conexión pendiente" : "Snapshot activo"}</strong><span>{snapshotDate}</span><small>{total.toLocaleString("es-MX")} señales publicadas</small></div>
            </div>
          </div>
        </header>

        {error ? (
          <section className="connection-alert" role="alert">
            <div className="connection-alert__icon"><Icon name="activity" size={20} /></div>
            <div><h2>Conexión pendiente</h2><p>{error} Configura las variables server-side de Supabase para cargar las señales publicadas.</p></div>
            <a href="/api/health" target="_blank" rel="noreferrer">Comprobar API <Icon name="arrow" size={15} /></a>
          </section>
        ) : null}

        <section className="metrics-grid" aria-label="Resumen del snapshot">
          <MetricCard icon="activity" tone="blue" value={total} label="Señales totales" detail="Publicadas en el snapshot" />
          <MetricCard icon="trend" tone="red" value={stats.high} label="Prioridad alta" detail="Según acciones registradas" />
          <MetricCard icon="check" tone="green" value={stats.verified} label="Verificadas" detail="Estado confirmado" />
          <MetricCard icon="database" tone="violet" value={stats.sources} label="Fuentes activas" detail="Fuentes en la página cargada" />
        </section>

        <div className="dashboard-grid">
          <section className="ranking-panel" id="ranking" aria-labelledby="ranking-title">
            <div className="section-heading ranking-panel__heading">
              <div><p className="eyebrow">Radar publicado</p><h2 id="ranking-title">Ranking de señales</h2></div>
              <div className="ranking-panel__tools" id="filters">
                <label className="sort-select"><span className="sr-only">Ordenar señales</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Más relevantes</option><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option></select><Icon name="chevron" size={15} /></label>
                <button className="filter-button" type="button" disabled title="Los filtros adicionales aún no están disponibles"><Icon name="filter" size={16} /> Filtros</button>
              </div>
            </div>
            <FilterTabs activeFilter={activeFilter} counts={counts} onChange={setActiveFilter} />
            <div className="ranking-meta" aria-live="polite"><span>{visibleSignals.length} de {signals.length} señales cargadas</span><span>Snapshot: {snapshotDate}</span></div>
            {visibleSignals.length > 0 ? (
              <div className="signal-list" role="list" aria-label="Señales publicadas">
                <div className="signal-list__header" role="presentation" aria-hidden="true">
                  <span>#</span><span>Señal</span><span>Tema</span><span>Evidencia</span><span>Fuentes</span><span>Confianza</span><span>Estado</span><span>Impacto</span><span>Detalle</span>
                </div>
                {visibleSignals.map((signal, index) => <SignalRow key={signal.id} signal={signal} index={index} />)}
              </div>
            ) : (
              <p className="empty-state">No hay señales que coincidan con la búsqueda o el filtro seleccionado.</p>
            )}
          </section>

          <ActivityPanel signals={signals} />
        </div>
      </main>
    </div>
  );
}
