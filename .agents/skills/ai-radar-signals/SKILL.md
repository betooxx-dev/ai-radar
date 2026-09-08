---
name: ai-radar-signals
description: Consult existing AI Radar signals from local daily JSON snapshots and return a selected JSON result by date, quantity, and order. Use when someone asks to consultar, mostrar, listar, or retrieve AI Radar signals. Do not use this skill to search for new AI news or create a snapshot.
metadata:
  short-description: Consultar señales AI Radar desde snapshots diarios
---

# AI Radar Signals

Use the repository tool `scripts/query_signals.py` to query existing daily snapshots. This skill is read-only: it must not edit snapshots, browse the web, or generate new signals.

## Workflow

1. Interpret the request:
   - `día` maps to `--date YYYY-MM-DD`. If omitted, let the tool choose the newest primary snapshot.
   - `cantidad`, `n`, or an equivalent maps to `--limit N`. If omitted, use the tool default of 5.
   - Map `original` or `editorial` to `input`, recent-first to `newest`, oldest-first to `oldest`, priority to `priority`, and explicit ID ascending/descending to `id-asc`/`id-desc`.
2. From the repository root, call the tool automatically:

   ```bash
   python3 scripts/query_signals.py [--date YYYY-MM-DD] [--limit N] [--order ORDER]
   ```

   Omit `--date` when the user asks for the latest available snapshot. Always pass an explicit quantity or rely on the documented default; always pass `--order` when the user specifies one.
3. Return the tool's JSON result without dropping or inventing signal fields. The result contains `snapshot_date`, `count`, `order`, and exactly the requested number of `signals`.
4. If the tool reports a missing day or if the requested quantity exceeds the snapshot, explain the error and mention the available date(s) from the tool output. Do not silently switch to `*-alternatives.json`; use alternatives only if the user explicitly asks for them and the tool is later extended to support that source.

## Routing boundary

Use `ai-radar-news` instead when the user asks for latest/recent AI news, a new digest, web research, or creation of a new daily snapshot. Use this skill when the user wants to consult data that already exists locally.
