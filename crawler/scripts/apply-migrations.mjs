#!/usr/bin/env node
/**
 * Apply Supabase migrations + seed against a remote Postgres URL.
 *
 *   DATABASE_URL=postgres://... node scripts/apply-migrations.mjs [--seed]
 *
 * Iterates `supabase/migrations/*.sql` in lexicographic order and runs each as
 * a single transaction. With `--seed`, also runs `supabase/seed.sql` at the end.
 *
 * Safe to re-run: each migration uses CREATE TABLE IF NOT EXISTS / similar
 * idempotent patterns, but the SQL itself is the source of truth.
 */
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// crawler/scripts → up two levels to project root
const ROOT = resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const SEED_PATH = join(ROOT, 'supabase', 'seed.sql');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('error: DATABASE_URL env var required');
  process.exit(1);
}

const runSeed = process.argv.includes('--seed');
// --from=NNNN  skips files with a numeric prefix < NNNN (lexicographic compare).
// Useful when re-running after the first batch has already been applied.
const fromArg = process.argv.find((a) => a.startsWith('--from='));
const fromPrefix = fromArg ? fromArg.slice('--from='.length) : '';

const sql = postgres(DATABASE_URL, {
  ssl: 'require',           // Supabase requires SSL
  max: 1,                    // serialize, easier to reason about
  prepare: false,            // some migration statements aren't preparable
  connection: { application_name: 'aupa-ab-migrator' },
});

async function applyFile(label, path) {
  const content = readFileSync(path, 'utf-8');
  process.stdout.write(`▶ ${label}… `);
  try {
    await sql.unsafe(content);
    process.stdout.write('OK\n');
  } catch (err) {
    process.stdout.write('FAIL\n');
    console.error(`   ${err.message}`);
    throw err;
  }
}

try {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => !fromPrefix || f >= fromPrefix)
    .sort();
  for (const f of files) {
    await applyFile(`migration ${f}`, join(MIGRATIONS_DIR, f));
  }
  if (runSeed) {
    await applyFile('seed.sql', SEED_PATH);
  }
  console.log('✓ all done');
} catch (err) {
  console.error('aborted:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
