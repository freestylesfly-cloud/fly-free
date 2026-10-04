/**
 * Moves storefront media off Supabase Storage and onto Cloudinary.
 *
 * Supabase restricted the project for cached egress (every read, including with
 * the service-role key, returns 402), so the originals cannot be downloaded. The
 * files come from a local salvage of the live site's Vercel image cache instead:
 * `d:\flyfree\image-backup` holds `urls.json` (every Supabase URL in the database)
 * and `files/<bucket>/<path>` (the largest cached copy of each).
 *
 *   node scripts/migrate-media-to-cloudinary.mjs upload            # files → Cloudinary, writes mapping.json
 *   node scripts/migrate-media-to-cloudinary.mjs rewrite           # dry run: counts per column
 *   node scripts/migrate-media-to-cloudinary.mjs rewrite --apply   # swap URLs in DATABASE_URL
 *   node scripts/migrate-media-to-cloudinary.mjs rollback --apply  # swap them back
 *
 * Upload is idempotent (fixed public ids, existing assets are reused), and the
 * rewrite only touches values that contain a mapped URL, so both are safe to rerun.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

const BACKUP_DIR = process.env.MEDIA_BACKUP_DIR || "d:/flyfree/image-backup";
const MAPPING_FILE = path.join(BACKUP_DIR, "mapping.json");
const [command = "", ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");

/** Every column that held a Supabase URL in the inventory. */
const COLUMNS = [
  ["ProductImage", "url"],
  ["Theme", "imageUrl"],
  ["Theme", "bannerImageUrl"],
  ["Theme", "featureImageUrl"],
  ["Category", "imageUrl"],
  ["SizeGuide", "chartImageUrl"],
  ["Influencer", "imageUrl"],
  ["InstagramPost", "imageUrl"],
  ["InstagramPost", "videoUrl"],
  ["AppSetting", "value"]
];

async function upload() {
  const salvage = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, "salvage.json"), "utf8"));
  const mapping = fs.existsSync(MAPPING_FILE) ? JSON.parse(fs.readFileSync(MAPPING_FILE, "utf8")) : {};
  const queue = Object.entries(salvage).filter(([url, info]) => info.w && !mapping[url]);
  let done = 0;
  let failed = 0;

  async function worker() {
    while (queue.length) {
      const [url, info] = queue.shift();
      const file = path.join(BACKUP_DIR, "files", info.key);
      // Same path as on Supabase, minus the extension Cloudinary adds itself.
      const publicId = info.key.replace(/\.[a-z0-9]+$/i, "");
      try {
        const result = await cloudinary.uploader.upload(file, {
          public_id: publicId,
          resource_type: "image",
          overwrite: false,
          unique_filename: false,
          use_filename: false
        });
        mapping[url] = result.secure_url;
        done++;
      } catch (error) {
        failed++;
        console.error("FAILED", info.key, error?.message || error?.error?.message || error);
      }
    }
  }

  await Promise.all(Array.from({ length: 5 }, worker));
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 1));
  console.log(`uploaded ${done}, failed ${failed}, mapped total ${Object.keys(mapping).length}`);
}

/**
 * Reads each affected row once, swaps URLs in memory, then writes every change
 * in one transaction. The original values are saved to a timestamped backup file
 * before anything is written.
 */
async function rewrite(reverse = false) {
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf8"));
  const pairs = Object.entries(mapping).map(([from, to]) => (reverse ? [to, from] : [from, to]));
  const marker = reverse ? "res.cloudinary.com/" : "supabase.co/storage/";
  const prisma = new PrismaClient();
  const host = new URL(process.env.DATABASE_URL).host;
  console.log(`${apply ? "APPLYING" : "dry run"} ${reverse ? "rollback" : "rewrite"} on ${host}`);

  try {
    const updates = [];
    const unmapped = new Set();
    for (const [table, column] of COLUMNS) {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id, "${column}"::text AS v FROM "${table}" WHERE "${column}"::text LIKE '%' || $1 || '%'`,
        marker
      );
      let changed = 0;
      for (const row of rows) {
        let next = row.v;
        for (const [from, to] of pairs) if (next.includes(from)) next = next.split(from).join(to);
        // Anything still on the old host had no file to move (e.g. lost videos).
        const leftover = next.match(/https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'\\,)\]}]+/gi);
        if (!reverse) leftover?.forEach((u) => unmapped.add(`${table}.${column} ${u}`));
        if (next !== row.v) {
          updates.push({ table, column, id: row.id, before: row.v, after: next, json: table === "AppSetting" });
          changed++;
        }
      }
      console.log(`  ${table}.${column}: ${rows.length} rows on old host, ${changed} to update`);
    }

    console.log(`${updates.length} rows to update`);
    if (unmapped.size) {
      console.log(`${unmapped.size} links have no migrated file and stay as they are:`);
      for (const u of unmapped) console.log(`   ${u}`);
    }
    if (!apply || updates.length === 0) return;

    const backup = path.join(BACKUP_DIR, `db-backup-${reverse ? "rollback" : "rewrite"}-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify({ host, updates }, null, 1));
    console.log(`original values saved to ${backup}`);

    await prisma.$transaction(
      updates.map((u) =>
        prisma.$executeRawUnsafe(
          `UPDATE "${u.table}" SET "${u.column}" = $1${u.json ? "::jsonb" : ""} WHERE id = $2`,
          u.after,
          u.id
        )
      )
    );
    console.log(`updated ${updates.length} rows`);
  } finally {
    await prisma.$disconnect();
  }
}

if (command === "upload") await upload();
else if (command === "rewrite") await rewrite(false);
else if (command === "rollback") await rewrite(true);
else console.log("usage: upload | rewrite [--apply] | rollback [--apply]");
