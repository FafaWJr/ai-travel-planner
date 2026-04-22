// scripts/i18n-check/shared/env-loader.mjs
//
// Lightweight .env.local loader. Reads key=value pairs from the file in
// the current working directory (assumed to be the project root) and
// populates process.env for any keys not already set.
//
// No dependency on dotenv. Keeps the scripts usable without npm install.
//
// Precedence: shell-exported env vars win over .env.local values.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

/**
 * Load .env.local from the project root into process.env.
 * Idempotent: safe to call multiple times.
 */
export function loadEnvLocal() {
  if (loaded) return;
  loaded = true;

  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;

  let contents;
  try {
    contents = readFileSync(path, 'utf-8');
  } catch {
    return;
  }

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
