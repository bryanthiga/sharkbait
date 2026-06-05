#!/usr/bin/env node
/**
 * inject-env.js — generates public/index.html from public/index.template.html
 * by substituting environment-variable placeholders.
 *
 * Source of truth: public/index.template.html (tracked in git, contains
 * placeholders like __MAPBOX_TOKEN__).
 * Output: public/index.html (gitignored, contains real values).
 *
 * Why a template? An earlier in-place version would overwrite the tracked
 * index.html with the real token; running `git add -A` or `git commit -a`
 * after a build would then leak the token. With this template pattern,
 * the substituted file is never tracked, so secrets can't accidentally
 * reach git.
 *
 * Placeholders supported:
 *   __MAPBOX_TOKEN__    -> process.env.NEXT_PUBLIC_MAPBOX_TOKEN
 *
 * If an env var is missing, the placeholder is left intact and a warning is
 * printed. The build continues — the page just won't have a working token.
 */
const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "..", "public", "index.template.html");
const TARGET = path.join(__dirname, "..", "public", "index.html");

// Local dev: load .env.local into process.env (Vercel injects env vars itself).
const ENV_LOCAL = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(ENV_LOCAL)) {
  for (const line of fs.readFileSync(ENV_LOCAL, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    process.env[k] = raw.replace(/^['"]|['"]$/g, "");
  }
}

const SUBS = [
  {
    placeholder: "__MAPBOX_TOKEN__",
    env: "NEXT_PUBLIC_MAPBOX_TOKEN",
    required: true,
  },
];

function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`[inject-env] template not found: ${TEMPLATE}`);
    process.exit(1);
  }
  let html = fs.readFileSync(TEMPLATE, "utf8");
  for (const { placeholder, env, required } of SUBS) {
    if (!html.includes(placeholder)) continue;
    const value = process.env[env];
    if (!value) {
      if (required) {
        console.warn(
          `[inject-env] ${env} is not set; ${placeholder} will be left in output ` +
            `(page won't work without it)`,
        );
      }
      continue;
    }
    html = html.split(placeholder).join(value);
    console.log(`[inject-env] Substituted ${placeholder} from ${env}`);
  }
  fs.writeFileSync(TARGET, html);
}

main();
