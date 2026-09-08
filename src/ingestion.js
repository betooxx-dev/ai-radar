const { buildNormalizedSignals, assertValidSnapshot } = require('./validation');

function validateVariant(variant) {
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(variant)) {
    throw new Error('variant solo puede contener letras minúsculas, números, guiones y guiones bajos');
  }
  return variant;
}

async function ingestSnapshot({ client, snapshot, variant = 'primary' }) {
  assertValidSnapshot(snapshot);
  const normalizedSignals = buildNormalizedSignals(snapshot);
  const { data, error } = await client.rpc('ingest_radar_snapshot', {
    p_snapshot: snapshot,
    p_variant: validateVariant(variant),
    p_signals: normalizedSignals,
  });
  if (error) throw error;
  return data;
}

module.exports = { ingestSnapshot, validateVariant };
