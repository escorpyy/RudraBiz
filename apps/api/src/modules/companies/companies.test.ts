import { companyInputSchema } from "@ntcas/shared";
import { createInsertSchema } from "drizzle-zod";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditLog, branch, company, userCompanyAccess } from "../../db/schema";
import { createHarness } from "../../test/harness";

type Harness = Awaited<ReturnType<typeof createHarness>>;

describe("company shared schema vs table columns (drizzle-zod)", () => {
  const dbSchema = createInsertSchema(company);
  const base = { code: "C", name: "N", updatedAt: "2026-01-01" };
  it("accepts and rejects the same lengths", () => {
    const limits: [string, number][] = [["code", 15], ["name", 200], ["legalName", 200], ["registrationNo", 50], ["panNo", 25], ["vatNo", 25], ["taxOfficeName", 100], ["address", 300], ["city", 50], ["district", 50], ["province", 50], ["country", 50], ["phone", 20], ["website", 255]];
    for (const [field, max] of limits) {
      for (const [len, ok] of [[max, true], [max + 1, false]] as const) {
        const v = "x".repeat(len);
        expect(companyInputSchema.safeParse({ code: "C", name: "N", [field]: v }).success, `shared ${field}=${len}`).toBe(ok);
        expect(dbSchema.safeParse({ ...base, [field]: v }).success, `db ${field}=${len}`).toBe(ok);
      }
    }
  });
  it("normalises optional text, currency and email", () => {
    const r = companyInputSchema.parse({ code: " C ", name: " N ", legalName: "  ", baseCurrency: "usd", email: "" });
    expect(r).toMatchObject({ code: "C", name: "N", legalName: null, baseCurrency: "USD", email: null, businessType: "OTHER", defaultCalendarPref: "BS", isActive: true, isVatRegistered: false });
    for (const bad of [{ baseCurrency: "US" }, { baseCurrency: "NPRS" }, { email: "not-an-email" }, { businessType: "NOPE" }, { defaultCalendarPref: "XX" }]) {
      expect(companyInputSchema.safeParse({ code: "C", name: "N", ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe.skipIf(!process.env.DATABASE_URL)("/api/companies (real Postgres)", () => {
  let h: Harness;
  const made: number[] = [];
  let n = 0;
  const code = () => `C${++n}${h.tag.slice(-9)}`;
  const body = (over: Record<string, unknown> = {}) => ({ code: code(), name: `Test company ${n}`, ...over });
  const create = async (who: "admin" | "adminB" | "accountant" | "viewer", over: Record<string, unknown> = {}) => {
    const res = await h.as(who).post("/api/companies", body(over));
    if (res.status === 201) made.push(res.body.id);
    return res;
  };

  beforeAll(async () => {
    h = await createHarness();
    h.onClose(async () => {
      if (!made.length) return;
      await h.db.delete(userCompanyAccess).where(inArray(userCompanyAccess.companyId, made));
      await h.db.delete(branch).where(inArray(branch.companyId, made));
      await h.db.delete(company).where(inArray(company.id, made));
      await h.db.delete(auditLog).where(sql`("tableName" in ('Company','Branch','UserCompanyAccess')) and coalesce("newData"->>'id',"oldData"->>'id')::int in (${sql.join(made.map((m) => sql`${m}`), sql`, `)})`);
    });
  }, 60_000);
  afterAll(() => h.close());

  it("requires a session", async () => {
    const request = (await import("supertest")).default;
    expect((await request(h.app).get("/api/companies")).status).toBe(401);
  });

  it("lists only the companies the user can access, with counts and their own role", async () => {
    const mine = (await h.as("viewer").get("/api/companies")).body as { id: number; role: string }[];
    expect(mine.map((c) => c.id)).toEqual([h.companyA]);
    expect(mine[0]!.role).toBe("VIEWER");
    const b = (await h.as("adminB").get("/api/companies")).body as { id: number; role: string }[];
    expect(b.map((c) => c.id)).toEqual([h.companyB]);
    expect(b[0]).toMatchObject({ role: "ADMIN", branchesCount: 0, fiscalYearsCount: 0 });
  });

  it("creates a company with a head-office branch and makes the creator its administrator", async () => {
    const res = await create("admin", { legalName: "  Test Pvt Ltd ", baseCurrency: "usd", phone: "01-555", email: "a@b.co", isVatRegistered: true, panNo: "" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ legalName: "Test Pvt Ltd", baseCurrency: "USD", panNo: null, isVatRegistered: true, businessType: "OTHER", defaultCalendarPref: "BS", country: null, role: "ADMIN", branchesCount: 1, isActive: true });
    const detail = (await h.as("admin").get(`/api/companies/${res.body.id}`)).body;
    expect(detail.branches).toEqual([expect.objectContaining({ code: "HO", name: "Head Office", isHeadOffice: true, isActive: true })]);
    const [ho] = await h.db.select().from(branch).where(eq(branch.companyId, res.body.id));
    expect(ho).toMatchObject({ phone: "01-555", email: "a@b.co" });
    // the creator now sees it in their list, and a stranger does not
    expect((await h.as("admin").get("/api/companies")).body.map((c: { id: number }) => c.id)).toContain(res.body.id);
    expect((await h.as("adminB").get("/api/companies")).body.map((c: { id: number }) => c.id)).not.toContain(res.body.id);
    expect((await h.as("adminB").get(`/api/companies/${res.body.id}`)).status).toBe(404);
  });

  it("only a company administrator may create one", async () => {
    expect((await create("accountant")).status).toBe(403);
    expect((await create("viewer")).status).toBe(403);
  });

  it("rejects bad input with every field error", async () => {
    const res = await h.as("admin").post("/api/companies", { code: "", name: "x".repeat(201), baseCurrency: "N", email: "nope", businessType: "BAD" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual(["baseCurrency", "businessType", "code", "email", "name"]);
  });

  it("refuses a duplicate code naming the code field, on create and update", async () => {
    const first = await create("admin");
    const dup = await h.as("admin").post("/api/companies", body({ code: first.body.code }));
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatchObject({ message: "A company with that code already exists.", details: { field: "code" } });
    const other = await create("admin");
    const upd = await h.as("admin").patch(`/api/companies/${other.body.id}`, { code: first.body.code });
    expect(upd.status).toBe(409);
    expect(upd.body.error.details.field).toBe("code");
  });

  it("updates only the fields sent, turns cleared optionals into null, and keeps the rest", async () => {
    const c = (await create("admin", { legalName: "Old Legal", city: "Pokhara" })).body;
    const res = await h.as("admin").patch(`/api/companies/${c.id}`, { legalName: "", name: "Renamed company", isActive: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ legalName: null, name: "Renamed company", isActive: false, city: "Pokhara", code: c.code });
    expect((await h.as("admin").patch(`/api/companies/999999999`, { name: "x" })).status).toBe(404);
  });

  it("an inactive company still shows in the registry, so it can be reactivated", async () => {
    const c = (await create("admin")).body;
    await h.as("admin").patch(`/api/companies/${c.id}`, { isActive: false });
    const all = (await h.as("admin").get("/api/companies")).body as { id: number }[];
    expect(all.map((x) => x.id)).toContain(c.id);
    const active = (await h.as("admin").get("/api/companies?status=active")).body as { id: number }[];
    expect(active.map((x) => x.id)).not.toContain(c.id);
    const found = (await h.as("admin").get(`/api/companies?q=${encodeURIComponent(c.name.toUpperCase())}`)).body as { id: number }[];
    expect(found.map((x) => x.id)).toEqual([c.id]);
  });

  it("only a company-wide administrator of that company may edit or delete it", async () => {
    expect((await h.as("accountant").patch(`/api/companies/${h.companyA}`, { name: "x" })).status).toBe(403);
    expect((await h.as("viewer").delete(`/api/companies/${h.companyA}`)).status).toBe(403);
    expect((await h.as("adminB").patch(`/api/companies/${h.companyA}`, { name: "x" })).status).toBe(404);
    expect((await h.as("adminB").delete(`/api/companies/${h.companyA}`)).status).toBe(404);
    // an ADMIN limited to a single branch is not company-wide
    const [bb] = await h.db.insert(branch).values({ companyId: h.companyB, code: "BR1", name: "B branch", updatedAt: sql`CURRENT_TIMESTAMP` } as never).returning({ id: branch.id });
    h.onClose(async () => { await h.db.delete(userCompanyAccess).where(eq(userCompanyAccess.branchId, bb!.id)); await h.db.delete(branch).where(eq(branch.id, bb!.id)); });
    await h.db.insert(userCompanyAccess).values({ userId: h.userIds.accountant, companyId: h.companyB, branchId: bb!.id, role: "ADMIN" });
    expect((await h.as("accountant").get(`/api/companies/${h.companyB}`)).status).toBe(200);
    expect((await h.as("accountant").patch(`/api/companies/${h.companyB}`, { name: "hijack" })).status).toBe(403);
    expect((await h.as("accountant").delete(`/api/companies/${h.companyB}`)).status).toBe(403);
  });

  it("deletes a company together with its branches and access rows, and 404s afterwards", async () => {
    const c = (await create("admin")).body;
    expect((await h.as("admin").delete(`/api/companies/${c.id}`)).status).toBe(204);
    expect((await h.as("admin").get(`/api/companies/${c.id}`)).status).toBe(404);
    expect(await h.db.select().from(branch).where(eq(branch.companyId, c.id))).toHaveLength(0);
    expect(await h.db.select().from(userCompanyAccess).where(eq(userCompanyAccess.companyId, c.id))).toHaveLength(0);
  });

  it("refuses to delete a company that still has accounting records, naming them", async () => {
    const c = (await create("admin")).body;
    h.onClose(() => h.db.execute(sql`delete from "AccountGroup" where "companyId" = ${c.id}`));
    expect((await h.as("admin").post("/api/account-groups", {}).set("x-company-id", String(c.id))).status).toBe(400); // context works for the new company
    for (const code of ["G1", "G2"]) {
      const g = await h.as("admin").post("/api/account-groups", { type: "ASSET", code, description: `Group ${code}` }).set("x-company-id", String(c.id));
      expect(g.status).toBe(201);
    }
    const blocked = await h.as("admin").delete(`/api/companies/${c.id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toBe("Cannot delete: this company still has 2 account groups. Deactivate it instead, or remove those records first.");
    await h.db.execute(sql`delete from "AccountGroup" where "companyId" = ${c.id}`);
    expect((await h.as("admin").delete(`/api/companies/${c.id}`)).status).toBe(204);
  });

  it("records who created, changed and deleted a company in the audit log", async () => {
    const c = (await create("admin")).body;
    await h.as("admin").patch(`/api/companies/${c.id}`, { name: "Audited" });
    await h.as("admin").delete(`/api/companies/${c.id}`);
    const rows = await h.db
      .select({ action: auditLog.action, by: auditLog.changedBy })
      .from(auditLog)
      .where(sql`"tableName" = 'Company' and "recordId" = ${String(c.id)}`)
      .orderBy(auditLog.id);
    expect(rows).toEqual([
      { action: "INSERT", by: h.userIds.admin },
      { action: "UPDATE", by: h.userIds.admin },
      { action: "DELETE", by: h.userIds.admin },
    ]);
  });
});
