#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const mobileRoot = path.join(repoRoot, "MeetMeHalfwayMobile");

const rootEnvPath = path.join(repoRoot, ".env.local");
const mobileEnvPath = path.join(mobileRoot, ".env");

const requiredRootEnv = [
  "OPENROUTESERVICE_API_KEY",
  "LOCATIONIQ_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

const requiredMobileEnv = [
  "EXPO_PUBLIC_API_BASE_URL",
  "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const entries = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    entries[key] = value;
  }
  return entries;
}

function validate(name, values, requiredKeys) {
  const missing = requiredKeys.filter((key) => !values[key]);
  if (missing.length === 0) {
    console.log(`[OK] ${name}: all required vars are present.`);
    return true;
  }
  console.error(`[MISSING] ${name}:`);
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  return false;
}

const rootEnv = parseEnvFile(rootEnvPath);
const mobileEnv = parseEnvFile(mobileEnvPath);

const rootValid = validate(".env.local", rootEnv, requiredRootEnv);
const mobileValid = validate("MeetMeHalfwayMobile/.env", mobileEnv, requiredMobileEnv);

console.log("");
console.log("Run commands:");
console.log("  npm run dev");
console.log("  npm run --prefix ./MeetMeHalfwayMobile ios");

if (!rootValid || !mobileValid) {
  process.exit(1);
}

