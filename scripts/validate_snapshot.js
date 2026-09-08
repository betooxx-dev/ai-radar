#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { assertValidSnapshot } = require('../src/validation');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Uso: npm run validate:fixtures -- data/daily/2026-09-08.json');
  process.exit(2);
}

for (const file of files) {
  const absolute = path.resolve(file);
  const snapshot = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  assertValidSnapshot(snapshot);
  console.log(`${file}: válido (${snapshot.signals.length} señales)`);
}
