#!/usr/bin/env node
/**
 * inject-env.js — substitutes environment variables into public/index.html
 * during the build. Runs as a `prebuild` step so Vercel env vars actually
 * reach the static HTML.
 *
 * Placeholders supported:
 *   __MAPBOX_TOKEN__    -> process.env.NEXT_PUBLIC_MAPBOX_TOKEN
 *
 * If an env var is missing, the placeholder is left intact and a warning is
 * printed. The build continues — the page just won't have a working token.
 *
 * Important: this script REWRITES public/index.html in place. To keep the
 * source of truth in git as a template, public/index.html holds the
 * placeholder literal; the rewritten version lives only in the built
 * artifact (Vercel) or the developer's working tree after `npm run build`.
 * Don't commit a substituted index.html.
 */
const fs = require("fs");
const path = require("path");

const TARGET = path.join(__dirname, "..", "public", "index.html");

const SUBS = [
  {
    placeholder: "__MAPBOX_TOKEN__",
    env: "NEXT_PUBLIC_MAPBOX_TOKEN",
    required: true,
  },
];

function main() {
  if (!fs.existsSync(TARGET)) {
    console.error(`[inject-env] ${TARGET} not found`);
    process.exit(1);
  }
  let html = fs.readFileSync(TARGET, "utf8");
  let changed = false;
  for (const { placeholder, env, required } of SUBS) {
    if (!html.includes(placeholder)) continue;
    const value = process.env[env];
    if (!value) {
      const msg = `[inject-env] ${env} is not set; placeholder ${placeholder} left in place`;
      if (required) console.warn(msg);
      continue;
    }
    html = html.split(placeholder).join(value);
    changed = true;
    console.log(`[inject-env] Substituted ${placeholder} from ${env}`);
  }
  if (changed) fs.writeFileSync(TARGET, html);
}

main();
