import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { withTx } from "./tx";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("withTx", () => {
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);
  afterAll(() => pool.end());

  const read = (tx: { execute: typeof db.execute }) =>
    tx.execute(sql`select current_setting('app.current_user_id', true) as v`).then((r) => r.rows[0]!.v);

  it("sets app.current_user_id for the transaction only", async () => {
    expect(await withTx(db as never, 42, (tx) => read(tx as never))).toBe("42");
    // setting must not leak to the next use of the pooled connection
    const after = await db.execute(sql`select current_setting('app.current_user_id', true) as v`);
    expect([null, ""]).toContain(after.rows[0]!.v);
  });

  it("rolls back every write when the callback throws", async () => {
    await db.execute(sql`create table if not exists _tx_probe (n int)`);
    await db.execute(sql`truncate _tx_probe`);
    await expect(
      withTx(db as never, 1, async (tx) => {
        await tx.execute(sql`insert into _tx_probe values (1)`);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const { rows } = await db.execute(sql`select count(*)::int as c from _tx_probe`);
    expect(rows[0]!.c).toBe(0);
    await db.execute(sql`drop table _tx_probe`);
  });
});
