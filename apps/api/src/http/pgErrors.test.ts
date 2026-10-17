import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import express from "express";
import pg from "pg";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { errorHandler } from "./errorHandler";

const url = process.env.DATABASE_URL;

// Drizzle >= 0.44 wraps driver errors (DrizzleQueryError, original in .cause).
// These tests use REAL database errors so the HTTP mapping cannot silently stop matching.
describe.skipIf(!url)("real Postgres errors through the HTTP error handler", () => {
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);
  afterAll(() => pool.end());

  const app = (run: () => Promise<unknown>) => {
    const a = express();
    a.get("/x", async () => {
      await run();
    });
    a.use(errorHandler);
    return a;
  };

  it("unique violation -> 409 DUPLICATE", async () => {
    const tag = `dup${Date.now()}`;
    const res = await request(
      app(() => db.execute(sql`insert into "AuthUser"(id,name,email) values (${tag + "a"},'x',${tag}),(${tag + "b"},'y',${tag})`)),
    ).get("/x");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE");
  });

  it("RAISE EXCEPTION in a trigger-style function -> 422 with the message", async () => {
    const res = await request(
      app(() => db.execute(sql`do $$ begin raise exception 'JournalVoucher 1 is out of balance: debit 10 != credit 9'; end $$`)),
    ).get("/x");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("RULE_VIOLATION");
    expect(res.body.error.message).toContain("out of balance");
  });

  it("foreign-key violation -> 409 IN_USE", async () => {
    const res = await request(
      app(() => db.execute(sql`insert into "AuthSession"(id,"expiresAt",token,"userId") values ('s',now(),'t-fk','no-such-user')`)),
    ).get("/x");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("IN_USE");
  });
});
