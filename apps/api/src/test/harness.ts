import { drizzle } from "drizzle-orm/node-postgres";
import { inArray, like, or, sql } from "drizzle-orm";
import pg from "pg";
import request from "supertest";
import { expect } from "vitest";
import { createApp } from "../app";
import { createAuth } from "../auth/auth";
import { runMigrations } from "../db/migrate";
import * as schema from "../db/schema";

export const ORIGIN = "http://localhost:5173";
const PASSWORD = "correct horse battery";

export type Who = "admin" | "accountant" | "viewer" | "adminB";

/**
 * Real-Postgres integration harness for module tests: two companies (A, B), users with
 * ADMIN / ACCOUNTANT / VIEWER on A and an ADMIN on B, all with real Better Auth sessions.
 * Everything is tagged and removed in close(). Use with describe.skipIf(!process.env.DATABASE_URL).
 */
export async function createHarness() {
  const url = process.env.DATABASE_URL!;
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  const auth = createAuth({ db: db as never, secret: "x".repeat(40), baseURL: "http://localhost:4000", webOrigin: ORIGIN });
  const app = createApp({ webOrigin: ORIGIN, db: db as never, auth });
  const tag = `h${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  await runMigrations(url);

  const now = new Date().toISOString();
  const mkCompany = async (c: string) =>
    (await db.insert(schema.company).values({ code: `${tag}${c}`.slice(0, 15), name: `Co ${tag}${c}`, updatedAt: now }).returning({ id: schema.company.id }))[0]!.id;
  const companyA = await mkCompany("A");
  const companyB = await mkCompany("B");

  const userIds = {} as Record<Who, number>;
  const cookies = {} as Record<Who, string>;
  const grants: [Who, number, "ADMIN" | "ACCOUNTANT" | "VIEWER"][] = [
    ["admin", companyA, "ADMIN"],
    ["accountant", companyA, "ACCOUNTANT"],
    ["viewer", companyA, "VIEWER"],
    ["adminB", companyB, "ADMIN"],
  ];
  for (const [who, companyId, role] of grants) {
    const email = `${tag}-${who}@example.com`;
    const [u] = await db.insert(schema.user).values({ name: who, email }).returning({ id: schema.user.id });
    userIds[who] = u!.id;
    await db.insert(schema.userCompanyAccess).values({ userId: u!.id, companyId, branchId: null, role });
    const up = await request(app).post("/api/auth/sign-up/email").set("origin", ORIGIN).send({ email, password: PASSWORD, name: who });
    expect(up.status).toBe(200);
    const inn = await request(app).post("/api/auth/sign-in/email").set("origin", ORIGIN).send({ email, password: PASSWORD });
    expect(inn.status).toBe(200);
    cookies[who] = (inn.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
  }

  /** supertest request as `who`, in that user's company unless a header overrides it. */
  const as = (who: Who) => {
    const withAuth = (t: request.Test) => t.set("origin", ORIGIN).set("cookie", cookies[who]);
    return {
      get: (path: string) => withAuth(request(app).get(path)),
      post: (path: string, body?: object) => withAuth(request(app).post(path)).send(body),
      patch: (path: string, body?: object) => withAuth(request(app).patch(path)).send(body),
      delete: (path: string) => withAuth(request(app).delete(path)),
    };
  };

  async function close() {
    const companyIds = [companyA, companyB];
    const users = Object.values(userIds);
    // module tests register cleanups for their own tables through `onClose`
    for (const fn of closers) await fn(companyIds).catch(() => {});
    await db.delete(schema.userCompanyAccess).where(inArray(schema.userCompanyAccess.userId, users));
    await db.delete(schema.auditLog).where(inArray(schema.auditLog.changedBy, users));
    await db.delete(schema.user).where(inArray(schema.user.id, users));
    await db.delete(schema.authUser).where(like(schema.authUser.email, `${tag}-%`));
    await db.delete(schema.company).where(inArray(schema.company.id, companyIds));
    await pool.end();
  }
  const closers: ((companyIds: number[]) => Promise<unknown>)[] = [];
  const onClose = (fn: (companyIds: number[]) => Promise<unknown>) => void closers.push(fn);

  return { app, db, pool, tag, companyA, companyB, userIds, cookies, as, close, onClose, sql, or };
}
