#!/usr/bin/env node
/**
 * Writes MeetMeHalfwayMobile/.env.eas-production for `eas env:push production`.
 * Uses https://meetmehalfway.co for API; copies Clerk/Supabase/Stripe from .env.local.
 * Does not print secret values.
 */
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const rootEnvPath = path.join(repoRoot, ".env.local");
const outPath = path.join(repoRoot, "MeetMeHalfwayMobile", ".env.eas-production");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const entries = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[trimmed.slice(0, idx).trim()] = value;
  }
  return entries;
}

const root = parseEnvFile(rootEnvPath);
const pick = (...keys) => {
  for (const key of keys) if (root[key]) return root[key];
  return "";
};

const entries = {
  EXPO_PUBLIC_API_BASE_URL: "https://meetmehalfway.co",
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: pick(
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  ),
  EXPO_PUBLIC_SUPABASE_URL: pick(
    "EXPO_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: pick(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: pick(
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ),
  EXPO_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY: pick(
    "EXPO_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY",
    "NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY"
  ),
  EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: pick(
    "EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY",
    "NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY"
  ),
  EXPO_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY: pick(
    "EXPO_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY",
    "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY"
  ),
  EXPO_PUBLIC_REQUIRE_AUTH: root.EXPO_PUBLIC_REQUIRE_AUTH || "false",
};

const required = [
  "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];
const missing = required.filter((k) => !entries[k]);
if (missing.length) {
  console.error("[generate-eas-production-env] Missing in .env.local:");
  for (const k of missing) console.error(`  - ${k}`);
  process.exit(1);
}

const lines = [
  "# Generated — eas env:push production --path .env.eas-production --force",
  ...Object.entries(entries)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`),
  "",
];
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`[generate-eas-production-env] Wrote ${path.relative(repoRoot, outPath)}`);
