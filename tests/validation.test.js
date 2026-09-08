const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildNormalizedSignals, canonicalizeUrl, ValidationError } = require('../src/validation');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'daily', name), 'utf8'));
}

test('normaliza las señales del fixture principal y calcula fingerprints estables', () => {
  const signals = buildNormalizedSignals(fixture('2026-09-08.json'));

  assert.equal(signals.length, 5);
  assert.match(signals[0].fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(signals[0].sources[0].canonical_url, canonicalizeUrl(signals[0].sources[0].canonical_url));
  assert.ok(signals.every((signal) => signal.priority_rank >= 0 && signal.priority_rank <= 2));
});

test('rechaza payloads que no cumplen el contrato', () => {
  assert.throws(
    () => buildNormalizedSignals({ schema_version: '1.0.0', snapshot_date: '2026-09-08', signals: [] }),
    ValidationError,
  );
});
