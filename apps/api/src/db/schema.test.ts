import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { is } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("drizzle schema matches the migrated database", () => {
  const pool = new pg.Pool({ connectionString: url });
  beforeAll(() => runMigrations(url!), 60_000);
  afterAll(() => pool.end());

  it("every table and column name in schema.ts exists in Postgres (and vice versa)", async () => {
    const { rows } = await pool.query(
      `select table_name t, column_name c from information_schema.columns where table_schema='public'`,
    );
    const db = new Map<string, Set<string>>();
    for (const r of rows) (db.get(r.t) ?? db.set(r.t, new Set()).get(r.t)!).add(r.c);

    const tables = (Object.values(schema) as unknown[]).filter((x): x is PgTable => is(x as object, PgTable));
    const problems: string[] = [];
    for (const t of tables) {
      const cfg = getTableConfig(t);
      const actual = db.get(cfg.name);
      if (!actual) { problems.push(`missing table ${cfg.name}`); continue; }
      const declared = new Set(cfg.columns.map((c) => c.name));
      for (const c of declared) if (!actual.has(c)) problems.push(`${cfg.name}.${c} not in DB`);
      for (const c of actual) if (!declared.has(c)) problems.push(`${cfg.name}.${c} not in schema.ts`);
    }
    expect(problems).toEqual([]);
  });

  it("keeps the safety-net triggers from the baseline", async () => {
    const { rows } = await pool.query(`select tgname from pg_trigger where not tgisinternal`);
    const names = rows.map((r) => r.tgname);
    for (const t of [
      "trg_check_jv_balance",
      "trg_check_cbv_balance",
      "trg_block_posted_jv_edit",
      "trg_jvl_no_control_account",
      "trg_audit_journal_voucher",
    ]) expect(names).toContain(t);
  });

  it("money columns are NUMERIC, never float", async () => {
    const { rows } = await pool.query(
      `select table_name, column_name, data_type from information_schema.columns
       where table_schema='public' and data_type in ('double precision','real')`,
    );
    expect(rows).toEqual([]);
  });
});
