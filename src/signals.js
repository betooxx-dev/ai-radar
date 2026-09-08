function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
    return groups;
  }, new Map());
}

async function loadRelations(client, signalIds) {
  if (signalIds.length === 0) return { sources: [], evidence: [], actions: [] };
  const [sources, evidence, actions] = await Promise.all([
    client.from('signal_sources').select('signal_id, source:sources(id, canonical_url, name, published_at, kind)').in('signal_id', signalIds),
    client.from('signal_evidence').select('signal_id, statement, source_urls, evidence_type, confidence').in('signal_id', signalIds),
    client.from('signal_actions').select('signal_id, recommendation, priority').in('signal_id', signalIds),
  ]);
  for (const result of [sources, evidence, actions]) {
    if (result.error) throw result.error;
  }
  return { sources: sources.data || [], evidence: evidence.data || [], actions: actions.data || [] };
}

function toContractSignal(row, relations) {
  const sources = groupBy(relations.sources, 'signal_id').get(row.id) || [];
  const evidence = groupBy(relations.evidence, 'signal_id').get(row.id) || [];
  const actions = groupBy(relations.actions, 'signal_id').get(row.id) || [];
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    source: sources.map((item) => ({
      name: item.source.name,
      url: item.source.canonical_url,
      published_at: item.source.published_at,
      kind: item.source.kind,
    })),
    evidence: evidence.map((item) => ({
      statement: item.statement,
      source_urls: item.source_urls,
      evidence_type: item.evidence_type,
      confidence: item.confidence,
    })),
    impact: row.impact,
    action: actions.map((item) => ({
      recommendation: item.recommendation,
      priority: item.priority,
    })),
    status: row.status,
  };
}

async function hydrateSignals(client, rows) {
  const relations = await loadRelations(client, rows.map((row) => row.id));
  return rows.map((row) => ({ row, signal: toContractSignal(row, relations) }));
}

module.exports = { hydrateSignals, loadRelations, toContractSignal };
