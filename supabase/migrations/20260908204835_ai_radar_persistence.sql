create extension if not exists pgcrypto;

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  variant text not null default 'primary',
  schema_version text not null,
  search jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null,
  signal_count integer not null default 0 check (signal_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint snapshots_variant_format check (variant ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint snapshots_search_object check (jsonb_typeof(search) = 'object'),
  constraint snapshots_payload_object check (jsonb_typeof(raw_payload) = 'object'),
  constraint snapshots_date_variant_unique unique (snapshot_date, variant)
);

create table public.signals (
  id text primary key,
  snapshot_id uuid not null references public.snapshots(id) on delete cascade,
  title text not null,
  category text not null check (category in (
    'model', 'research', 'company', 'infrastructure', 'security',
    'policy', 'tool', 'paper', 'repository', 'launch'
  )),
  fingerprint text not null,
  impact jsonb not null,
  status jsonb not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  priority_rank smallint not null check (priority_rank between 0 and 2),
  latest_source_date date not null,
  earliest_source_date date not null,
  rank_score numeric,
  is_published boolean not null default false,
  raw_payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint signals_impact_object check (jsonb_typeof(impact) = 'object'),
  constraint signals_status_object check (jsonb_typeof(status) = 'object'),
  constraint signals_payload_object check (jsonb_typeof(raw_payload) = 'object'),
  constraint signals_id_format check (id ~ '^air-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}$')
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null unique,
  name text not null,
  published_at date not null,
  kind text not null check (kind in (
    'company_announcement', 'public_institution', 'court_or_government',
    'research_lab', 'independent_report', 'reputable_media'
  )),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.signal_sources (
  signal_id text not null references public.signals(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (signal_id, source_id)
);

create table public.signal_evidence (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null references public.signals(id) on delete cascade,
  statement text not null,
  source_urls jsonb not null default '[]'::jsonb,
  evidence_type text not null check (evidence_type in (
    'announcement', 'company_report', 'independent_report',
    'corroboration', 'benchmark', 'court_filing'
  )),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint evidence_source_urls_array check (jsonb_typeof(source_urls) = 'array')
);

create table public.signal_actions (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null references public.signals(id) on delete cascade,
  recommendation text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default timezone('utc', now())
);

create index snapshots_date_idx on public.snapshots (snapshot_date desc, variant);
create index signals_snapshot_idx on public.signals (snapshot_id);
create index signals_category_idx on public.signals (category);
create index signals_published_priority_idx on public.signals (is_published, priority_rank, id);
create index signals_fingerprint_idx on public.signals (fingerprint);
create index signals_latest_source_date_idx on public.signals (latest_source_date desc);
create index signal_sources_source_idx on public.signal_sources (source_id);
create index signal_evidence_signal_idx on public.signal_evidence (signal_id);
create index signal_actions_signal_idx on public.signal_actions (signal_id);

alter table public.snapshots enable row level security;
alter table public.signals enable row level security;
alter table public.sources enable row level security;
alter table public.signal_sources enable row level security;
alter table public.signal_evidence enable row level security;
alter table public.signal_actions enable row level security;

grant select on public.snapshots, public.signals, public.sources,
  public.signal_sources, public.signal_evidence, public.signal_actions
  to anon, authenticated;
grant all on public.snapshots, public.signals, public.sources,
  public.signal_sources, public.signal_evidence, public.signal_actions
  to service_role;

create policy "Published snapshots are publicly readable"
  on public.snapshots for select to anon, authenticated
  using (published_at is not null);

create policy "Published signals are publicly readable"
  on public.signals for select to anon, authenticated
  using (is_published);

create policy "Sources of published signals are publicly readable"
  on public.sources for select to anon, authenticated
  using (exists (
    select 1
    from public.signal_sources ss
    join public.signals s on s.id = ss.signal_id
    where ss.source_id = sources.id and s.is_published
  ));

create policy "Relations of published signals are publicly readable"
  on public.signal_sources for select to anon, authenticated
  using (exists (
    select 1 from public.signals s
    where s.id = signal_sources.signal_id and s.is_published
  ));

create policy "Evidence of published signals is publicly readable"
  on public.signal_evidence for select to anon, authenticated
  using (exists (
    select 1 from public.signals s
    where s.id = signal_evidence.signal_id and s.is_published
  ));

create policy "Actions of published signals are publicly readable"
  on public.signal_actions for select to anon, authenticated
  using (exists (
    select 1 from public.signals s
    where s.id = signal_actions.signal_id and s.is_published
  ));

create or replace function public.ingest_radar_snapshot(
  p_snapshot jsonb,
  p_variant text,
  p_signals jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_snapshot_id uuid;
  v_signal jsonb;
  v_source jsonb;
  v_evidence jsonb;
  v_action jsonb;
  v_source_id uuid;
  v_signal_id text;
  v_count integer;
begin
  if jsonb_typeof(p_signals) <> 'array' then
    raise exception 'p_signals must be a JSON array';
  end if;

  insert into public.snapshots (
    snapshot_date, variant, schema_version, search, raw_payload, signal_count,
    published_at, updated_at
  ) values (
    (p_snapshot->>'snapshot_date')::date,
    p_variant,
    p_snapshot->>'schema_version',
    coalesce(p_snapshot->'search', '{}'::jsonb),
    p_snapshot,
    jsonb_array_length(p_signals),
    null,
    timezone('utc', now())
  )
  on conflict (snapshot_date, variant) do update set
    schema_version = excluded.schema_version,
    search = excluded.search,
    raw_payload = excluded.raw_payload,
    signal_count = excluded.signal_count,
    published_at = null,
    updated_at = timezone('utc', now())
  returning id into v_snapshot_id;

  delete from public.signals s
  where s.snapshot_id = v_snapshot_id
    and not exists (
      select 1
      from jsonb_array_elements(p_signals) incoming
      where incoming->>'id' = s.id
    );

  for v_signal in select value from jsonb_array_elements(p_signals)
  loop
    v_signal_id := v_signal->>'id';

    insert into public.signals (
      id, snapshot_id, title, category, fingerprint, impact, status, priority,
      priority_rank, latest_source_date, earliest_source_date, rank_score,
      is_published, raw_payload, updated_at
    ) values (
      v_signal_id,
      v_snapshot_id,
      v_signal->>'title',
      v_signal->>'category',
      v_signal->>'fingerprint',
      v_signal->'impact',
      v_signal->'status',
      v_signal->>'priority',
      (v_signal->>'priority_rank')::smallint,
      (v_signal->>'latest_source_date')::date,
      (v_signal->>'earliest_source_date')::date,
      nullif(v_signal->>'rank_score', '')::numeric,
      false,
      v_signal->'raw_payload',
      timezone('utc', now())
    )
    on conflict (id) do update set
      snapshot_id = excluded.snapshot_id,
      title = excluded.title,
      category = excluded.category,
      fingerprint = excluded.fingerprint,
      impact = excluded.impact,
      status = excluded.status,
      priority = excluded.priority,
      priority_rank = excluded.priority_rank,
      latest_source_date = excluded.latest_source_date,
      earliest_source_date = excluded.earliest_source_date,
      rank_score = excluded.rank_score,
      is_published = false,
      raw_payload = excluded.raw_payload,
      updated_at = timezone('utc', now());

    delete from public.signal_sources where signal_id = v_signal_id;
    delete from public.signal_evidence where signal_id = v_signal_id;
    delete from public.signal_actions where signal_id = v_signal_id;

    for v_source in select value from jsonb_array_elements(v_signal->'sources')
    loop
      insert into public.sources (
        canonical_url, name, published_at, kind, updated_at
      ) values (
        v_source->>'canonical_url',
        v_source->>'name',
        (v_source->>'published_at')::date,
        v_source->>'kind',
        timezone('utc', now())
      )
      on conflict (canonical_url) do update set
        name = excluded.name,
        published_at = excluded.published_at,
        kind = excluded.kind,
        updated_at = timezone('utc', now())
      returning id into v_source_id;

      insert into public.signal_sources (signal_id, source_id)
      values (v_signal_id, v_source_id)
      on conflict do nothing;
    end loop;

    for v_evidence in select value from jsonb_array_elements(v_signal->'evidence')
    loop
      insert into public.signal_evidence (
        signal_id, statement, source_urls, evidence_type, confidence
      ) values (
        v_signal_id,
        v_evidence->>'statement',
        coalesce(v_evidence->'source_urls', '[]'::jsonb),
        v_evidence->>'evidence_type',
        v_evidence->>'confidence'
      );
    end loop;

    for v_action in select value from jsonb_array_elements(v_signal->'action')
    loop
      insert into public.signal_actions (signal_id, recommendation, priority)
      values (v_signal_id, v_action->>'recommendation', v_action->>'priority');
    end loop;
  end loop;

  update public.snapshots
  set published_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = v_snapshot_id;

  update public.signals
  set is_published = true, updated_at = timezone('utc', now())
  where snapshot_id = v_snapshot_id;

  select count(*) into v_count
  from public.signals
  where snapshot_id = v_snapshot_id;

  return jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'signal_count', v_count,
    'published', true
  );
end;
$$;

revoke all on function public.ingest_radar_snapshot(jsonb, text, jsonb) from public;
grant execute on function public.ingest_radar_snapshot(jsonb, text, jsonb) to service_role;
