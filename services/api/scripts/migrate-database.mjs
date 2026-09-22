/**
 * Copies every row from the current database into a new, empty one.
 *
 * Built for moving Neon -> Railway Postgres, but works between any two Postgres
 * databases that share this Prisma schema.
 *
 * SAFETY - the source is only ever read:
 *   - only SELECTs are issued against it
 *   - nothing is deleted, trimmed, transformed or "cleaned up" on the way through
 *   - the target must be empty, so a stray second run cannot double-insert
 *   - row counts are compared per table before it reports success
 *   - the old database is left untouched and running, so rollback is just
 *     pointing DATABASE_URL back at it
 *
 * Order of operations:
 *   1. create the schema on the target:  npx prisma migrate deploy
 *   2. dry run (default):                node scripts/migrate-database.mjs
 *   3. copy:                             node scripts/migrate-database.mjs --apply
 *   4. verify only, any time:            node scripts/migrate-database.mjs --verify
 *
 * Env:
 *   DATABASE_URL         source (read only here)
 *   TARGET_DATABASE_URL  destination
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

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

const APPLY = process.argv.includes("--apply");
const VERIFY_ONLY = process.argv.includes("--verify");
/**
 * Continue a run that died partway, e.g. when the network drops mid-copy.
 *
 * Safe to repeat: every primary key is a cuid generated at the source and every
 * insert uses skipDuplicates / ON CONFLICT DO NOTHING, so a row that already
 * landed is skipped rather than duplicated. Tables already at full count are
 * left alone entirely.
 */
const RESUME = process.argv.includes("--resume");
/**
 * Restrict the run to named tables, e.g. --only=Payment,Inventory.
 *
 * Useful after an interruption: --resume alone re-reads a short table from the
 * start, which is wasteful for a large append-only log where the source is still
 * growing and only a handful of rows are actually missing.
 */
const ONLY = (() => {
  const arg = process.argv.find((value) => value.startsWith("--only="));
  if (!arg) return null;
  const names = arg
    .slice("--only=".length)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length ? new Set(names) : null;
})();
const BATCH = 1000;

const SOURCE_URL = process.env.DATABASE_URL;
const TARGET_URL = process.env.TARGET_DATABASE_URL;

if (!SOURCE_URL) {
  console.error("DATABASE_URL (source) is not set.");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error(
    "TARGET_DATABASE_URL is not set.\n\n" +
      "Create a PostgreSQL service in Railway, copy its connection string, then:\n" +
      '  TARGET_DATABASE_URL="postgresql://..." node scripts/migrate-database.mjs'
  );
  process.exit(1);
}

/** Refuse to copy a database onto itself. */
const identity = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
};
if (identity(SOURCE_URL) === identity(TARGET_URL)) {
  console.error("Source and target point at the same database. Refusing to run.");
  process.exit(1);
}

const { PrismaClient, Prisma } = await import("@prisma/client");

const source = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
const target = new PrismaClient({ datasources: { db: { url: TARGET_URL } } });

/** Prisma model name -> client property, e.g. ProductVariant -> productVariant. */
const clientKey = (modelName) => modelName.charAt(0).toLowerCase() + modelName.slice(1);

const modelsByTable = new Map(
  Prisma.dmmf.datamodel.models.map((model) => [model.dbName || model.name, model])
);

/** Implicit many-to-many join tables have no Prisma model; they are plain (A, B) pairs. */
const isJoinTable = (table) => table.startsWith("_") && table !== "_prisma_migrations";

async function fkSafeOrder(client) {
  const tables = (
    await client.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public'`)
  ).map((row) => row.tablename);

  const fks = await client.$queryRawUnsafe(`
    SELECT tc.table_name AS child, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'`);

  const deps = new Map(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of fks) if (child !== parent) deps.get(child)?.add(parent);

  const order = [];
  const placed = new Set();
  while (order.length < tables.length) {
    const ready = tables
      .filter((t) => !placed.has(t) && [...deps.get(t)].every((p) => placed.has(p)))
      .sort();
    if (!ready.length) {
      throw new Error(
        `Foreign-key cycle involving: ${tables.filter((t) => !placed.has(t)).join(", ")}`
      );
    }
    for (const t of ready) {
      order.push(t);
      placed.add(t);
    }
  }
  // Prisma owns this table via `migrate deploy`; copying it would corrupt migration state.
  // Dependency order is computed across every table first, so a filtered run still
  // inserts parents before children.
  return order.filter((t) => t !== "_prisma_migrations" && (!ONLY || ONLY.has(t)));
}

const countRows = async (client, table) => {
  const [row] = await client.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`);
  return row.n;
};

async function copyModelTable(table, model) {
  const key = clientKey(model.name);
  const reader = source[key];
  const writer = target[key];
  if (!reader || !writer) throw new Error(`No Prisma client delegate for model ${model.name}`);

  const idField = model.fields.find((field) => field.isId && field.kind === "scalar");
  let copied = 0;

  if (!idField) {
    // No single-column id to page on. Such tables are small by construction.
    const rows = await reader.findMany();
    if (rows.length) await writer.createMany({ data: rows, skipDuplicates: true });
    return rows.length;
  }

  // Keyset pagination: stable, and stays fast where a large OFFSET would not.
  let cursor = null;
  for (;;) {
    const rows = await reader.findMany({
      ...(cursor ? { where: { [idField.name]: { gt: cursor } } } : {}),
      orderBy: { [idField.name]: "asc" },
      take: BATCH
    });
    if (!rows.length) break;
    await writer.createMany({ data: rows, skipDuplicates: true });
    copied += rows.length;
    cursor = rows[rows.length - 1][idField.name];
    if (rows.length < BATCH) break;
    if (copied % 20000 === 0) console.log(`      ... ${copied} rows`);
  }
  return copied;
}

async function copyJoinTable(table) {
  const rows = await source.$queryRawUnsafe(`SELECT "A", "B" FROM "${table}" ORDER BY "A", "B"`);
  for (const row of rows) {
    await target.$executeRawUnsafe(
      `INSERT INTO "${table}" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      row.A,
      row.B
    );
  }
  return rows.length;
}

async function report(order, sourceCounts) {
  let mismatches = 0;
  for (const table of order) {
    const expected = sourceCounts.get(table);
    const actual = await countRows(target, table);
    if (expected !== actual) {
      mismatches += 1;
      console.log(`  MISMATCH  ${table}: source ${expected}, target ${actual}`);
    }
  }
  if (mismatches) {
    console.log(
      `\n${mismatches} table(s) do not match. The source is unchanged; investigate before cutting over.`
    );
    process.exitCode = 1;
  } else {
    console.log("Every table matches the source row for row.");
    console.log("The source database is untouched - switch DATABASE_URL only when you are ready.");
  }
}

async function main() {
  console.log(`source: ${identity(SOURCE_URL)}`);
  console.log(`target: ${identity(TARGET_URL)}\n`);

  const order = await fkSafeOrder(source);

  const targetTables = new Set(
    (await target.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public'`)).map(
      (row) => row.tablename
    )
  );
  const missing = order.filter((table) => !targetTables.has(table));
  if (missing.length) {
    console.error(
      `Target is missing ${missing.length} table(s), e.g. ${missing.slice(0, 5).join(", ")}\n\n` +
        "Create the schema on the target first with: npx prisma migrate deploy"
    );
    process.exit(1);
  }

  const sourceCounts = new Map();
  for (const table of order) sourceCounts.set(table, await countRows(source, table));
  const totalRows = [...sourceCounts.values()].reduce((sum, n) => sum + n, 0);

  if (VERIFY_ONLY) {
    await report(order, sourceCounts);
    return;
  }

  const populated = [];
  for (const table of order) {
    if ((await countRows(target, table)) > 0) populated.push(table);
  }

  if (!APPLY) {
    console.log(`${order.length} tables, ${totalRows.toLocaleString()} rows to copy.\n`);
    for (const table of order.filter((name) => sourceCounts.get(name) > 0)) {
      console.log(`  ${String(sourceCounts.get(table)).padStart(7)}  ${table}`);
    }
    console.log(
      populated.length
        ? `\nTarget is NOT empty (${populated.join(", ")}). --apply would refuse.`
        : "\nTarget is empty and ready."
    );
    console.log("\nDry run. Nothing was written. Re-run with --apply to copy.");
    return;
  }

  if (populated.length && !RESUME) {
    console.error(
      `Target already contains rows in: ${populated.join(", ")}\n` +
        "Refusing to write into a non-empty database. Use a fresh one, reset it yourself,\n" +
        "or pass --resume to continue an interrupted copy (skips rows already present)."
    );
    process.exit(1);
  }

  console.log(`Copying ${totalRows.toLocaleString()} rows across ${order.length} tables...\n`);
  const started = Date.now();

  for (const table of order) {
    const expected = sourceCounts.get(table);
    if (!expected) continue;
    if (RESUME && (await countRows(target, table)) >= expected) {
      console.log(`  ${table} (${expected})... already complete, skipped`);
      continue;
    }
    process.stdout.write(`  ${table} (${expected})... `);
    const model = modelsByTable.get(table);
    const copied = isJoinTable(table)
      ? await copyJoinTable(table)
      : model
        ? await copyModelTable(table, model)
        : null;
    if (copied === null) {
      console.log("SKIPPED (no Prisma model and not a join table)");
      continue;
    }
    console.log(`${copied} copied`);
  }

  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s. Verifying...\n`);
  await report(order, sourceCounts);
}

try {
  await main();
} finally {
  await source.$disconnect();
  await target.$disconnect();
}
