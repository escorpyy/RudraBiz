import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray, like } from "drizzle-orm";
import pg from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { createAuth } from "./auth";
import { resolveContext } from "./companyContext";
import * as schema from "../db/schema";
import { runMigrations } from "../db/migrate";

const url = process.env.DATABASE_URL;
const ORIGIN = "http://localhost:5173";
const TAG = `t${Date.now().toString(36)}`;
const PASSWORD = "correct horse battery";

describe.skipIf(!url)("auth + company context (real Postgres)", () => {
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  const auth = createAuth({ db: db as never, secret: "x".repeat(40), baseURL: "http://localhost:4000", webOrigin: ORIGIN });
  const app = createApp({ webOrigin: ORIGIN, db: db as never, auth });

  const email = (n: string) => `${TAG}-${n}@example.com`;
  const ids: Record<string, number> = {};
  let adminCookie = "";
  let restrictedCookie = "";

  async function insertUser(n: string) {
    const [u] = await db.insert(schema.user).values({ name: n, email: email(n) }).returning({ id: schema.user.id });
    return u!.id;
  }
  async function signUpAndIn(n: string) {
    const up = await request(app).post("/api/auth/sign-up/email").set("origin", ORIGIN).send({ email: email(n), password: PASSWORD, name: n });
    expect(up.status).toBe(200);
    const inn = await request(app).post("/api/auth/sign-in/email").set("origin", ORIGIN).send({ email: email(n), password: PASSWORD });
    expect(inn.status).toBe(200);
    return (inn.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
  }
  const get = (path: string, cookie: string, headers: Record<string, string> = {}) =>
    request(app).get(path).set("origin", ORIGIN).set("cookie", cookie).set(headers);

  beforeAll(async () => {
    await runMigrations(url!);
    const now = new Date().toISOString();
    const mkCompany = async (code: string) =>
      (await db.insert(schema.company).values({ code: `${TAG}${code}`.slice(0, 15), name: `Co ${code}`, updatedAt: now }).returning({ id: schema.company.id }))[0]!.id;
    ids.coA = await mkCompany("A");
    ids.coB = await mkCompany("B");
    const mkBranch = async (companyId: number, code: string) =>
      (await db.insert(schema.branch).values({ companyId, code, name: `Br ${TAG}${code}`, updatedAt: now }).returning({ id: schema.branch.id }))[0]!.id;
    ids.a1 = await mkBranch(ids.coA!, "a1");
    ids.a2 = await mkBranch(ids.coA!, "a2");
    ids.b1 = await mkBranch(ids.coB!, "b1");
    const mkFy = async (companyId: number, code: string, current: boolean) =>
      (await db.insert(schema.fiscalYear).values({ companyId, code, startDate: "2026-07-17", endDate: "2027-07-16", isCurrent: current, updatedAt: now }).returning({ id: schema.fiscalYear.id }))[0]!.id;
    ids.fyA = await mkFy(ids.coA!, `${TAG}A`.slice(0, 15), true);
    ids.fyB = await mkFy(ids.coB!, `${TAG}B`.slice(0, 15), true);

    ids.admin = await insertUser("admin");
    ids.restricted = await insertUser("restricted");
    ids.nobody = await insertUser("nobody");
    await db.insert(schema.userCompanyAccess).values([
      { userId: ids.admin!, companyId: ids.coA!, branchId: null, role: "ADMIN" },
      { userId: ids.restricted!, companyId: ids.coA!, branchId: ids.a1!, role: "ACCOUNTANT" },
      { userId: ids.restricted!, companyId: ids.coA!, branchId: ids.a2!, role: "VIEWER" },
    ]);
    adminCookie = await signUpAndIn("admin");
    restrictedCookie = await signUpAndIn("restricted");
  }, 60_000);

  afterAll(async () => {
    const userIds = ["admin", "restricted", "nobody"].map((n) => ids[n]!).filter(Boolean);
    await db.delete(schema.userCompanyAccess).where(inArray(schema.userCompanyAccess.userId, userIds));
    await db.delete(schema.user).where(inArray(schema.user.id, userIds));
    await db.delete(schema.authUser).where(like(schema.authUser.email, `${TAG}-%`));
    await db.delete(schema.fiscalYear).where(inArray(schema.fiscalYear.companyId, [ids.coA!, ids.coB!]));
    await db.delete(schema.branch).where(inArray(schema.branch.companyId, [ids.coA!, ids.coB!]));
    await db.delete(schema.company).where(inArray(schema.company.id, [ids.coA!, ids.coB!]));
    await pool.end();
  });

  it("rejects sign-up for an email that was not invited", async () => {
    const res = await request(app).post("/api/auth/sign-up/email").set("origin", ORIGIN).send({ email: email("stranger"), password: PASSWORD, name: "x" });
    expect(res.status).toBe(403);
    expect(await db.select().from(schema.authUser).where(eq(schema.authUser.email, email("stranger")))).toHaveLength(0);
  });

  it("links the login to the app user and refuses a second login for the same user", async () => {
    const [u] = await db.select().from(schema.user).where(eq(schema.user.id, ids.admin!));
    expect(u!.authUserId).toBeTruthy();
    const again = await request(app).post("/api/auth/sign-up/email").set("origin", ORIGIN).send({ email: email("admin"), password: PASSWORD, name: "x" });
    expect(again.status).toBeGreaterThanOrEqual(400);
    expect(await db.select().from(schema.authUser).where(eq(schema.authUser.email, email("admin")))).toHaveLength(1);
  });

  it("requires a session", async () => {
    expect((await request(app).get("/api/me")).status).toBe(401);
  });

  it("/api/me lists only what the user may access, with the default context", async () => {
    const res = await get("/api/me", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.companies.map((c: { id: number }) => c.id)).toEqual([ids.coA]);
    expect(res.body.context).toEqual({ companyId: ids.coA, branchId: null, fiscalYearId: ids.fyA, role: "ADMIN" });
    expect(res.body.companies[0].branches.map((b: { id: number }) => b.id)).toEqual([ids.a1, ids.a2]);
  });

  it("blocks another company, and branches/fiscal years that belong to another company", async () => {
    expect((await get("/api/me", adminCookie, { "x-company-id": String(ids.coB) })).status).toBe(403);
    expect((await get("/api/me", adminCookie, { "x-branch-id": String(ids.b1) })).status).toBe(403);
    expect((await get("/api/me", adminCookie, { "x-fiscal-year-id": String(ids.fyB) })).status).toBe(403);
    expect((await get("/api/me", adminCookie, { "x-company-id": "abc" })).status).toBe(400);
  });

  it("branch-restricted users never get company-wide scope", async () => {
    const none = await get("/api/me", restrictedCookie);
    expect(none.status).toBe(400); // two branches allowed, none chosen
    const all = await get("/api/me", restrictedCookie, { "x-branch-id": "all" });
    expect(all.status).toBe(400);
    const ok = await get("/api/me", restrictedCookie, { "x-branch-id": String(ids.a1) });
    expect(ok.status).toBe(200);
    expect(ok.body.context.role).toBe("ACCOUNTANT");
    const viewer = await get("/api/me", restrictedCookie, { "x-branch-id": String(ids.a2) });
    expect(viewer.body.context.role).toBe("VIEWER");
  });

  it("a user with no access rows is refused", async () => {
    await expect(resolveContext(db as never, ids.nobody!, {})).rejects.toMatchObject({ status: 403 });
  });
});
