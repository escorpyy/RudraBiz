import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

/**
 * Runs pending migrations. If this database was created by the legacy Prisma app
 * (it has "_prisma_migrations" and no Drizzle history yet), migration 0000 is the
 * baseline of what already exists — so it is recorded as applied instead of re-run.
 */
export async function runMigrations(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const hasPrisma = (await pool.query(`SELECT to_regclass('public."_prisma_migrations"') AS t`)).rows[0].t;
    const hasDrizzle = (await pool.query(`SELECT to_regclass('drizzle.__drizzle_migrations') AS t`)).rows[0].t;

    if (hasPrisma && !hasDrizzle) {
      const baseline = readMigrationFiles({ migrationsFolder })[0]!;
      await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
      await pool.query(
        `CREATE TABLE drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`,
      );
      await pool.query(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [
        baseline.hash,
        baseline.folderMillis,
      ]);
      console.log("Existing Prisma database detected: baseline 0000 recorded as applied.");
    }

    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  runMigrations(url).then(() => console.log("Migrations up to date."));
}
