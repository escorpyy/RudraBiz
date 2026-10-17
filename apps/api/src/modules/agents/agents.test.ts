import { and, eq, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { agentInputSchema } from "@ntcas/shared";
import { agent, auditLog } from "../../db/schema";
import { createHarness } from "../../test/harness";

const url = process.env.DATABASE_URL;

describe("shared agent schema vs the database columns (drizzle-zod)", () => {
  const dbSchema = createInsertSchema(agent);
  const base = { companyId: 1, updatedAt: "2026-01-01", code: "A", name: "N" };
  it("accepts and rejects the same lengths as the Agent table", () => {
    for (const [field, max] of [["code", 10], ["name", 100], ["phone", 25]] as const) {
      const ok = "x".repeat(max);
      const bad = "x".repeat(max + 1);
      expect(agentInputSchema.safeParse({ code: "A", name: "N", [field]: ok }).success, `shared ${field}=${max}`).toBe(true);
      expect(agentInputSchema.safeParse({ code: "A", name: "N", [field]: bad }).success, `shared ${field}=${max + 1}`).toBe(false);
      expect(dbSchema.safeParse({ ...base, [field]: ok }).success, `db ${field}=${max}`).toBe(true);
      expect(dbSchema.safeParse({ ...base, [field]: bad }).success, `db ${field}=${max + 1}`).toBe(false);
    }
  });
  it("turns an empty phone into null and trims", () => {
    expect(agentInputSchema.parse({ code: " AG-1 ", name: " Ram ", phone: "  " })).toEqual({ code: "AG-1", name: "Ram", phone: null, isActive: true });
  });
});

describe.skipIf(!url)("/api/agents (real Postgres)", () => {
  let h: Awaited<ReturnType<typeof createHarness>>;
  beforeAll(async () => {
    h = await createHarness();
    h.onClose(async (companyIds) => {
      // delete first (the audit trigger logs the delete), then drop only this test's audit rows
      await h.db.delete(agent).where(inArray(agent.companyId, companyIds));
      await h.db.delete(auditLog).where(
        and(
          eq(auditLog.tableName, "Agent"),
          sql`coalesce("newData"->>'companyId', "oldData"->>'companyId')::int in (${sql.join(companyIds.map((c) => sql`${c}`), sql`, `)})`,
        ),
      );
    });
  }, 60_000);
  afterAll(() => h.close());

  const code = (n: string) => `${n}`.slice(0, 10);

  it("lets an accountant create, and the viewer see it; the viewer cannot write", async () => {
    const created = await h.as("accountant").post("/api/agents", { code: code("AG-1"), name: "  Ram Kumar  ", phone: "" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ code: "AG-1", name: "Ram Kumar", phone: null, isActive: true, ledgersCount: 0, partiesCount: 0 });

    const list = await h.as("viewer").get("/api/agents");
    expect(list.status).toBe(200);
    expect(list.body.map((a: { code: string }) => a.code)).toContain("AG-1");

    expect((await h.as("viewer").post("/api/agents", { code: "V-1", name: "x" })).status).toBe(403);
    expect((await h.as("viewer").patch(`/api/agents/${created.body.id}`, { name: "x" })).status).toBe(403);
    expect((await h.as("viewer").delete(`/api/agents/${created.body.id}`)).status).toBe(403);
  });

  it("rejects bad input with every field error", async () => {
    const res = await h.as("admin").post("/api/agents", { code: "", name: "", phone: "9".repeat(30) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual(["code", "name", "phone"]);
  });

  it("refuses a duplicate code in the same company but allows it in another", async () => {
    expect((await h.as("admin").post("/api/agents", { code: "DUP", name: "One" })).status).toBe(201);
    const dup = await h.as("admin").post("/api/agents", { code: "DUP", name: "Two" });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toBe("An agent with that code already exists.");
    expect((await h.as("adminB").post("/api/agents", { code: "DUP", name: "Other company" })).status).toBe(201);
  });

  it("never exposes or touches another company's agents", async () => {
    const a = (await h.as("admin").post("/api/agents", { code: "ISO-A", name: "Only in A" })).body;
    expect((await h.as("adminB").get("/api/agents")).body.map((x: { code: string }) => x.code)).not.toContain("ISO-A");
    expect((await h.as("adminB").get(`/api/agents/${a.id}`)).status).toBe(404);
    expect((await h.as("adminB").patch(`/api/agents/${a.id}`, { name: "hacked" })).status).toBe(404);
    expect((await h.as("adminB").delete(`/api/agents/${a.id}`)).status).toBe(404);
    const still = await h.as("admin").get(`/api/agents/${a.id}`);
    expect(still.body.name).toBe("Only in A");
  });

  it("filters by status and search text, ordered by code", async () => {
    await h.as("admin").post("/api/agents", { code: "Z-OFF", name: "Zed Inactive", isActive: false });
    await h.as("admin").post("/api/agents", { code: "A-ON", name: "Alpha Active" });
    const all = (await h.as("admin").get("/api/agents")).body.map((x: { code: string }) => x.code);
    expect(all).toEqual([...all].sort());
    expect(all).toContain("Z-OFF");
    const active = (await h.as("admin").get("/api/agents?status=active")).body.map((x: { code: string }) => x.code);
    expect(active).not.toContain("Z-OFF");
    expect((await h.as("admin").get("/api/agents?q=zed")).body.map((x: { code: string }) => x.code)).toEqual(["Z-OFF"]);
  });

  it("updates, treating an empty phone as null and leaving unsent fields alone", async () => {
    const a = (await h.as("accountant").post("/api/agents", { code: "UPD", name: "Before", phone: "9800000000" })).body;
    const res = await h.as("accountant").patch(`/api/agents/${a.id}`, { name: "After", phone: "" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ code: "UPD", name: "After", phone: null, isActive: true });
    expect((await h.as("accountant").patch(`/api/agents/${a.id}`, { isActive: false })).body.name).toBe("After");
    expect((await h.as("accountant").patch("/api/agents/999999", { name: "x" })).status).toBe(404);
    expect((await h.as("accountant").patch(`/api/agents/${a.id}`, { code: "DUP" })).status).toBe(409);
  });

  it("deletes, then 404s", async () => {
    const a = (await h.as("accountant").post("/api/agents", { code: "DEL", name: "Gone" })).body;
    expect((await h.as("accountant").delete(`/api/agents/${a.id}`)).status).toBe(204);
    expect((await h.as("accountant").get(`/api/agents/${a.id}`)).status).toBe(404);
    expect((await h.as("accountant").delete(`/api/agents/${a.id}`)).status).toBe(404);
  });

  it("records who made each change in the audit log", async () => {
    const a = (await h.as("accountant").post("/api/agents", { code: "AUD", name: "Audited" })).body;
    await h.as("admin").patch(`/api/agents/${a.id}`, { name: "Audited 2" });
    await h.as("admin").delete(`/api/agents/${a.id}`);
    const rows = await h.db
      .select({ action: auditLog.action, by: auditLog.changedBy })
      .from(auditLog)
      .where(and(eq(auditLog.tableName, "Agent"), eq(auditLog.recordId, String(a.id))))
      .orderBy(auditLog.id);
    expect(rows).toEqual([
      { action: "INSERT", by: h.userIds.accountant },
      { action: "UPDATE", by: h.userIds.admin },
      { action: "DELETE", by: h.userIds.admin },
    ]);
  });

  it("requires a session", async () => {
    const { default: request } = await import("supertest");
    expect((await request(h.app).get("/api/agents")).status).toBe(401);
  });
});
