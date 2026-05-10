/**
 * Copies React Email templates into supabase/functions so Edge Functions can bundle them.
 * Run manually before `supabase functions deploy` (npm run emails:sync).
 * Rewrites imports for Deno npm: specifiers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src", "emails");
const destDir = path.join(root, "supabase", "functions", "_shared", "email-templates");

fs.cpSync(srcDir, destDir, { recursive: true, force: true });

const REACT_EMAIL_PIN = "npm:@react-email/components@0.0.22";
const REACT_PIN = "npm:react@18.3.1";

function patchFile(filePath) {
  let s = fs.readFileSync(filePath, "utf8");
  s = s.replaceAll('"@react-email/components"', `"${REACT_EMAIL_PIN}"`);
  s = s.replaceAll("'@react-email/components'", `'${REACT_EMAIL_PIN}'`);
  s = s.replaceAll('from "react"', `from "${REACT_PIN}"`);
  s = s.replaceAll("from 'react'", `from '${REACT_PIN}'`);
  fs.writeFileSync(filePath, s, "utf8");
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) patchFile(p);
  }
}

walk(destDir);
console.log(`Synced email templates: ${srcDir} -> ${destDir}`);
