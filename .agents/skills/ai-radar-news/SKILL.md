---
name: ai-radar-news
description: Search recent artificial intelligence news and turn exactly five high-impact items into AI Radar signals with sources, evidence, impact, action, status, and a daily JSON snapshot. Use when the user asks for latest or recent AI news, an AI news digest, or news formatted as AI Radar signals.
metadata:
  short-description: Convert recent AI news into verified AI Radar signals
---

# AI Radar News

Use this skill to transform current AI news into evidence-backed, actionable signals for builders. The repository is the source of truth for the contract and snapshots:

- Contract: `contracts/ai-radar-daily.schema.json`
- Daily snapshots: `data/daily/YYYY-MM-DD.json`; use `data/daily/YYYY-MM-DD-alternatives.json` for an additional deduplicated set on a date that already has a primary snapshot.

## Workflow

1. Inspect the repository before editing. Look for the contract, existing snapshots, and any local validation tools. Do not assume they exist.
2. For requests involving “latest”, “recent”, “today”, or “news”, browse the web. Prefer primary sources: company or lab announcements for launches, government or court sources for policy, and research papers or independent investigations for technical claims. Add reputable reporting when it provides independent corroboration.
3. Select the requested number of items; if the user asks for five, return exactly five. Prioritize recency, potential impact, evidence quality, and practical actionability. Diversify categories when the evidence supports it. Treat the ordering as an editorial prioritization, not an objective ranking.
4. Normalize every item with these fields:
   - `source`: one or more named sources with canonical URL, publication date, and source kind.
   - `evidence`: concrete claims tied to source URLs, with an evidence type and confidence. Mark company-reported claims as such.
   - `impact`: a concise consequence, affected areas, and confidence. Clearly separate source claims from analysis.
   - `action`: one or more recommended next steps with a priority. Actions are derived recommendations, not source facts.
   - `status`: a stable status code, a short explanation, and the date assessed.
5. Keep facts and inferences separate. Do not present benchmark results, funding plans, safety claims, or expected impact as independently verified when the source is only a company announcement. Record uncertainty in `evidence`, `impact`, or `status`.
6. If `contracts/ai-radar-daily.schema.json` is missing, create it before the snapshot. Preserve an existing contract unless the user explicitly asks to change it.
7. Save the result as `data/daily/YYYY-MM-DD.json` using the current calendar date. If that file already exists and the user asks for different, alternative, or deduplicated news, save `data/daily/YYYY-MM-DD-alternatives.json` instead of overwriting the primary snapshot. Include the search query, search date, selection criteria, and the normalized signals.
8. Validate the contract and snapshot after writing. At minimum, parse both as JSON with an available local JSON parser. If a JSON Schema validator already exists in the repository, use it; do not invent a project command that is not present.
9. In the response, show the requested signals using the same fields and link to the saved snapshot. Include source links near the claims they support. Mention any intentionally missing validation or unresolved status.

## Status vocabulary

Use the status codes defined by the contract. In particular:

- `confirmed`: the announcement or event is supported by the cited source(s); this does not prove its future impact.
- `announced`: a plan or agreement has been published but is not yet completed.
- `rolling_out`: a product or capability is being released gradually or to limited users.
- `pending_validation`: the central claim needs independent testing or replication.
- `pending_closure`: a transaction or planned action has not been completed.
- `mitigation_ongoing`: a security or reliability issue is confirmed and remediation is still in progress.

## Safety and quality boundaries

- Never fabricate a source, publication date, benchmark result, or availability status.
- Use the article’s original publication date when available, not the date it was found.
- Avoid duplicate signals for the same event; related events may remain separate when their actions differ, such as an acquisition and a security incident.
- For cyber incidents, summarize the defensive lesson without reproducing credentials, exploit chains, or instructions for unauthorized access.
- Do not save API keys, browser state, search caches, generated weekly snapshots, or temporary reports in the repository.
