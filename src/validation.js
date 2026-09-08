const crypto = require('node:crypto');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const schema = require('../contracts/ai-radar-daily.schema.json');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function assertValidSnapshot(snapshot) {
  if (!validate(snapshot)) {
    const details = (validate.errors || []).map((error) => ({
      path: error.instancePath || '/',
      message: error.message,
    }));
    throw new ValidationError('El snapshot no cumple el contrato diario', details);
  }
  return snapshot;
}

function canonicalizeUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  url.searchParams.sort();
  return url.toString();
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function priorityRank(actions) {
  const ranks = { high: 0, medium: 1, low: 2 };
  return Math.min(...actions.map((action) => ranks[action.priority]));
}

function normalizedSources(signal) {
  return signal.source.map((source) => ({
    canonical_url: canonicalizeUrl(source.url),
    name: source.name,
    published_at: source.published_at,
    kind: source.kind,
  }));
}

function buildNormalizedSignals(snapshot) {
  assertValidSnapshot(snapshot);
  return snapshot.signals.map((signal) => {
    const sources = normalizedSources(signal);
    const sourceDates = sources.map((source) => source.published_at).sort();
    const actions = signal.action.map((action) => ({
      recommendation: action.recommendation,
      priority: action.priority,
    }));
    const rank = priorityRank(actions);
    const fingerprintInput = [
      normalizeText(signal.title),
      ...sources.map((source) => source.canonical_url).sort(),
    ].join('|');

    return {
      id: signal.id,
      title: signal.title,
      category: signal.category,
      fingerprint: crypto.createHash('sha256').update(fingerprintInput).digest('hex'),
      impact: signal.impact,
      status: signal.status,
      priority: actions.find((action) => ({ high: 0, medium: 1, low: 2 }[action.priority] === rank)).priority,
      priority_rank: rank,
      latest_source_date: sourceDates[sourceDates.length - 1],
      earliest_source_date: sourceDates[0],
      rank_score: null,
      sources,
      evidence: signal.evidence.map((evidence) => ({
        statement: evidence.statement,
        source_urls: evidence.source_urls,
        evidence_type: evidence.evidence_type,
        confidence: evidence.confidence,
      })),
      action: actions,
      raw_payload: signal,
    };
  });
}

module.exports = {
  ValidationError,
  assertValidSnapshot,
  buildNormalizedSignals,
  canonicalizeUrl,
};
