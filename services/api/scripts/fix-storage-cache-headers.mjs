/**
 * One-time (and safely repeatable) repair for Supabase Storage cache headers.
 *
 * Every object in the product-images bucket was stored with
 * `cache-control: no-cache`, which forbids browsers from reusing an image they
 * have already downloaded. Each page view therefore re-fetched every image from
 * the Supabase CDN, and every CDN hit is billed as "cached egress" — which is
 * how 36 MB of files generated 58 GB of billed traffic.
 *
 * This re-uploads each object to its OWN existing path with a long-lived
 * cache-control header. Paths and public URLs are unchanged, so no database
 * rows need updating and nothing is migrated anywhere.
 *
 * Usage:
 *   node scripts/fix-storage-cache-headers.mjs           # report only
 *   node scripts/fix-storage-cache-headers.mjs --apply   # perform the rewrite
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// Load env from the API's own env files without adding a dependency.
for (const name of [".env.local", ".env"]) {
  const path = join(HERE, "..", name);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}

const BUCKET = "product-images";
// A year, immutable: upload paths already carry a timestamp + random suffix, so
// a given URL's bytes never change. Re-uploads land on new paths.
const CACHE_CONTROL = "31536000";
const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 6;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const storage = supabase.storage.from(BUCKET);

/** Storage listing is per-folder, so walk the tree. */
async function listAll(prefix = "") {
  const found = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await storage.list(prefix, { limit: 100, offset });
    if (error) throw new Error(`list("${prefix}"): ${error.message}`);
    if (!data?.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back without object metadata.
      if (entry.id === null || entry.metadata === null) found.push(...(await listAll(path)));
      else found.push({ path, size: entry.metadata?.size ?? 0, mimeType: entry.metadata?.mimetype });
    }
    if (data.length < 100) break;
    offset += data.length;
  }
  return found;
}

async function restamp(object) {
  const { data, error } = await storage.download(object.path);
  if (error) throw new Error(`download: ${error.message}`);
  const buffer = Buffer.from(await data.arrayBuffer());

  // Never overwrite a good image with a truncated download. The listing size is
  // authoritative, so a mismatch means the fetch was incomplete: skip it.
  if (object.size && buffer.length !== object.size) {
    throw new Error(`size mismatch (got ${buffer.length}, expected ${object.size}) - left untouched`);
  }

  const { error: uploadError } = await storage.upload(object.path, buffer, {
    contentType: object.mimeType || data.type || "application/octet-stream",
    cacheControl: CACHE_CONTROL,
    upsert: true
  });
  if (uploadError) throw new Error(`upload: ${uploadError.message}`);
  return buffer.length;
}

const objects = await listAll();
const totalBytes = objects.reduce((sum, o) => sum + o.size, 0);
console.log(`Bucket "${BUCKET}": ${objects.length} objects, ${(totalBytes / 1048576).toFixed(2)} MB`);

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to stamp cache-control: max-age=${CACHE_CONTROL}.`);
  process.exit(0);
}

let done = 0;
let failed = 0;
const queue = [...objects];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      const object = queue.shift();
      if (!object) return;
      try {
        await restamp(object);
        done += 1;
        if (done % 20 === 0) console.log(`  ${done}/${objects.length}`);
      } catch (err) {
        failed += 1;
        console.error(`  FAILED ${object.path}: ${err.message}`);
      }
    }
  })
);

console.log(`\nRe-stamped ${done}/${objects.length} objects${failed ? `, ${failed} failed` : ""}.`);
