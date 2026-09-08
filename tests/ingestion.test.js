const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { ingestSnapshot } = require('../src/ingestion');

test('ingesta un snapshot mediante el RPC idempotente y conserva la variante', async () => {
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'daily', '2026-09-08.json'), 'utf8'));
  const calls = [];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: { published: true, signal_count: 5 }, error: null };
    },
  };

  const result = await ingestSnapshot({ client, snapshot, variant: 'primary' });

  assert.deepEqual(result, { published: true, signal_count: 5 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'ingest_radar_snapshot');
  assert.equal(calls[0].args.p_variant, 'primary');
  assert.equal(calls[0].args.p_signals.length, 5);
});
