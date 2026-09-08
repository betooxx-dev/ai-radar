# AI Radar Agent Guide

AI Radar is the course project for learning Codex with a real product surface.

The repository is intentionally incremental. Treat the README and this guide as the current implementation contract, and verify any new integration against the files and services that actually exist.

## Current State

- The application is a Next.js App Router project using JavaScript, React, Tailwind CSS, and Next.js Route Handlers.
- The frontend dashboard lives in `src/app/page.js` and reads published signals from Supabase on the server.
- Backend endpoints live under `src/app/api/`: health, public signal listing/detail, and authenticated snapshot ingestion.
- Supabase project `test` is the development environment. Its schema is versioned under `supabase/migrations/` with RLS enabled.
- Local runtime credentials belong in `.env.local`; never commit that file or copy its values into documentation.
- Local JSON fixtures and `scripts/query_signals.py` remain available for deterministic, offline checks.
- User authentication, scheduled automation, production Supabase, and advanced operator workflows are intentionally not implemented yet.
- Verify files, scripts, database state, and deployment configuration before assuming any additional capability exists.

## Product Direction

AI Radar will collect AI news, papers, repos, tools, and launches, then turn them into verifiable signals for builders.

The final system should support:

- source evidence;
- normalized signals;
- duplicate detection;
- ranking;
- practical action guides;
- an operator view;
- deploy and automation.

## Working Rules

- Inspect the repo before editing.
- Keep changes scoped to the current class objective.
- Prefer small, reproducible files over chat-only state.
- Do not commit secrets, local caches, generated weekly snapshots, build output, videos, screenshots, or temporary reports.
- When a class creates a reusable process, prefer a skill.
- When a class creates deterministic work, prefer a tool or script.
- When adding data examples, use fixtures or contracts unless the class explicitly requires a durable seed.
- Keep frontend and backend changes inside the Next.js application unless a future class explicitly introduces a separate service.

## Validation

For each class branch, leave a clear state:

- what was added;
- how to verify it;
- what remains intentionally missing.

Current verification commands are:

```bash
npm test
npm run lint
npm run build
npm run dev
```

For Supabase changes, also verify the linked migration state and advisors:

```bash
supabase migration list
supabase db push --linked --dry-run
```

If commands do not exist yet, do not invent them in docs as if they already work.
