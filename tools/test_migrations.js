#!/usr/bin/env node
// Checks saved-data-migrations.js and tools/saved_data_migrations.py agree.
// Usage: node tools/test_migrations.js [EXPORT.json ...]
// Uses the built-in data plus any Project Backup / character exports given.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
global.window = {};
require(path.join(root, 'saved-data-migrations.js'));
require(path.join(root, 'project-defaults-data.js'));
const M = window.SideScrollMigrations;
const cases = Object.entries(window.SIDESCROLL_PROJECT_DEFAULTS.storage);
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const e of data.storage?.localStorage || []) cases.push([e.key, typeof e.value === 'string' ? e.value : JSON.stringify(e.value)]);
  for (const c of data.characters || (data.slices ? [data] : []))
    for (const s of c.slices || []) if (s.path === null && s.present) cases.push([s.key, s.value]);
}
const py = execFileSync('python3', ['-c', `
import json,sys
sys.path.insert(0, ${JSON.stringify(path.join(root, 'tools'))})
from saved_data_migrations import migrate_raw
cases=json.load(sys.stdin)
print(json.dumps([migrate_raw(k, v) for k, v in cases]))`], { input: JSON.stringify(cases), maxBuffer: 1 << 28 }).toString();
const expected = JSON.parse(py);
let bad = 0, changed = 0;
cases.forEach(([k, v], i) => {
  const js = M.migrateRaw(k, v);
  if (js !== v) changed++;
  if (js !== expected[i]) { bad++; if (bad < 5) console.log('MISMATCH', k, String(js).slice(0, 120), '|', String(expected[i]).slice(0, 120)); }
  if (M.migrateRaw(k, js) !== js) { bad++; console.log('NOT IDEMPOTENT', k); }
});
console.log(`${cases.length} values, ${changed} migrated, ${bad} problems`);
process.exit(bad ? 1 : 0);
