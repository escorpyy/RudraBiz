import { and, eq, getTableColumns, getTableName, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";
import { auditLog } from "../db/schema";
import type { MasterTable } from "../http/crud";
import { createHarness } from "./harness";

type Body = Record<string, unknown>;
type Row = Record<string, unknown> & { id: number };

export interface CrudSuiteOptions {
  title: string;
  /** e.g. "/api/agents" */
  path: string;
  table: MasterTable;
  /** Builds a valid, unique body. n is a unique counter; `over` overrides fields. */
  make: (n: number, over?: Body) => Body;
  /** A body that fails validation and the field names that must be reported. */
  invalid: { body: Body; fields: string[] };
  /** One entry per unique constraint: how to clash with an existing row on that field. */
  unique: { field: string; clash: (existing: Body) => Body; message: string }[];
  /** A distinctive string from a row, used to test ?q= search. */
  searchOf: (row: Body) => string;
  /** A PATCH body that changes something visible (unique per n, since names may be unique), and the expected partial result. */
  update: (n: number) => { body: Body; expect: Body };
  /** Default "code". */
  sortKey?: string;
  /**
   * For masters owned through a parent instead of companyId (SubArea under Area). The suite creates one parent
   * per company and fills `field` in every body it posts, so each company's rows hang off its own parent.
   */
  parent?: { path: string; table: MasterTable; field: string; make: (n: number) => Body };
  /** Module-specific tests, run inside the same describe (same harness, same cleanup). */
  extra?: (t: {
    h: () => Harness;
    create: (body: Body) => Promise<Row>;
    /** The parent row the suite made for company A and B (only with `parent`). */
    parents: () => { A: Row; B: Row };
  }) => void;
}

type Harness = Awaited<ReturnType<typeof createHarness>>;

/**
 * Behaviour every company-scoped master must have: roles, validation, unique conflicts
 * with the right field, tenant isolation, filters, update, delete and the audit trail.
 * Real Postgres and real sessions (see harness). Add a module = one call to this function.
 */
export function describeCrud(o: CrudSuiteOptions) {
  describe.skipIf(!process.env.DATABASE_URL)(`${o.path} CRUD (real Postgres)`, () => {
    let h: Harness;
    let n = 0;
    const next = (over?: Body) => o.make(++n, over);
    const upd = () => o.update(++n);
    const tableName = getTableName(o.table);

    let parents: { A: Row; B: Row } | undefined;
    const closeCompanyRows = async (table: MasterTable, companyIds: number[]) => {
      // delete first (the audit trigger logs deletes), then drop only this test's audit rows
      await h.db.delete(table).where(inArray(table.companyId!, companyIds));
      await h.db.delete(auditLog).where(
        and(
          eq(auditLog.tableName, getTableName(table)),
          sql`coalesce("newData"->>'companyId', "oldData"->>'companyId')::int in (${sql.join(companyIds.map((c) => sql`${c}`), sql`, `)})`,
        ),
      );
    };
    /** Posts as `who`; with `parent`, fills the parent field from that user's company. */
    const send = (who: Parameters<Harness["as"]>[0], body: Body) =>
      h.as(who).post(o.path, o.parent && body[o.parent.field] === undefined ? { ...body, [o.parent.field]: (who === "adminB" ? parents!.B : parents!.A).id } : body);

    beforeAll(async () => {
      h = await createHarness();
      if (o.parent) {
        const p = o.parent;
        h.onClose((ids) => closeCompanyRows(p.table, ids)); // runs last: parents go after their children
        h.onClose(async (ids) => {
          const col = getTableColumns(o.table)[p.field]!;
          const parentIds = (await h.db.select({ id: p.table.id }).from(p.table).where(inArray(p.table.companyId!, ids))).map((r) => r.id as number);
          if (!parentIds.length) return;
          await h.db.delete(o.table).where(inArray(col, parentIds));
          await h.db.delete(auditLog).where(
            and(eq(auditLog.tableName, tableName), sql`coalesce("newData"->>${p.field}, "oldData"->>${p.field})::int in (${sql.join(parentIds.map((c) => sql`${c}`), sql`, `)})`),
          );
        });
        parents = {
          A: (await h.as("admin").post(p.path, p.make(++n))).body as Row,
          B: (await h.as("adminB").post(p.path, p.make(++n))).body as Row,
        };
      } else {
        h.onClose((ids) => closeCompanyRows(o.table, ids));
      }
    }, 60_000);
    afterAll(() => h.close());

    it("lets an accountant create, a viewer read, and blocks the viewer from writing", async () => {
      const body = next();
      const created = await send("accountant", body);
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ ...body, isActive: true });

      const list = await h.as("viewer").get(o.path);
      expect(list.status).toBe(200);
      expect(list.body.map((r: Row) => r.id)).toContain(created.body.id);

      expect((await send("viewer", next())).status).toBe(403);
      expect((await h.as("viewer").patch(`${o.path}/${created.body.id}`, upd().body)).status).toBe(403);
      expect((await h.as("viewer").delete(`${o.path}/${created.body.id}`)).status).toBe(403);
    });

    it("requires a session", async () => {
      expect((await request(h.app).get(o.path)).status).toBe(401);
    });

    it("rejects bad input with every field error", async () => {
      const res = await send("admin", o.invalid.body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION");
      expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual([...o.invalid.fields].sort());
    });

    for (const u of o.unique) {
      it(`refuses a duplicate ${u.field} in one company (naming the field) but allows it in another`, async () => {
        const first = (await send("admin", next())).body as Row;
        const dup = await send("admin", next(u.clash(first)));
        expect(dup.status).toBe(409);
        expect(dup.body.error.message).toBe(u.message);
        expect(dup.body.error.details.field).toBe(u.field);
        // the same value is fine for another company
        expect((await send("adminB", next(u.clash(first)))).status).toBe(201);
        // and an update that clashes is refused the same way
        const other = (await send("admin", next())).body as Row;
        const upd = await h.as("admin").patch(`${o.path}/${other.id}`, u.clash(first));
        expect(upd.status).toBe(409);
        expect(upd.body.error.details.field).toBe(u.field);
      });
    }

    it("never exposes or touches another company's rows", async () => {
      const a = (await send("admin", next())).body as Row;
      expect((await h.as("adminB").get(o.path)).body.map((r: Row) => r.id)).not.toContain(a.id);
      expect((await h.as("adminB").get(`${o.path}/${a.id}`)).status).toBe(404);
      expect((await h.as("adminB").patch(`${o.path}/${a.id}`, upd().body)).status).toBe(404);
      expect((await h.as("adminB").delete(`${o.path}/${a.id}`)).status).toBe(404);
      const still = await h.as("admin").get(`${o.path}/${a.id}`);
      expect(still.status).toBe(200);
      expect(still.body).toMatchObject({ id: a.id });
    });

    it("filters by status and search text, ordered by the sort key", async () => {
      const off = (await send("admin", next({ isActive: false }))).body as Row;
      const on = (await send("admin", next())).body as Row;
      const all = (await h.as("admin").get(o.path)).body as Row[];
      const key = o.sortKey ?? "code";
      const keys = all.map((r) => String(r[key]).toLowerCase());
      expect(keys).toEqual([...keys].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)));
      const active = (await h.as("admin").get(`${o.path}?status=active`)).body as Row[];
      expect(active.map((r) => r.id)).toContain(on.id);
      expect(active.map((r) => r.id)).not.toContain(off.id);
      const found = (await h.as("admin").get(`${o.path}?q=${encodeURIComponent(o.searchOf(off).toUpperCase())}`)).body as Row[];
      expect(found.map((r) => r.id)).toEqual([off.id]);
    });

    it("updates only the fields sent, and 404s for an unknown id", async () => {
      const a = (await send("accountant", next())).body as Row;
      const u = upd();
      const res = await h.as("accountant").patch(`${o.path}/${a.id}`, u.body);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(u.expect);
      const code = a.code;
      expect((await h.as("accountant").patch(`${o.path}/${a.id}`, { isActive: false })).body).toMatchObject({ ...u.expect, code, isActive: false });
      expect((await h.as("accountant").patch(`${o.path}/999999`, upd().body)).status).toBe(404);
    });

    it("deletes, then 404s", async () => {
      const a = (await send("accountant", next())).body as Row;
      expect((await h.as("accountant").delete(`${o.path}/${a.id}`)).status).toBe(204);
      expect((await h.as("accountant").get(`${o.path}/${a.id}`)).status).toBe(404);
      expect((await h.as("accountant").delete(`${o.path}/${a.id}`)).status).toBe(404);
    });

    o.extra?.({ h: () => h, create: async (body) => (await send("admin", body)).body as Row, parents: () => parents! });

    it("records who made each change in the audit log", async () => {
      const a = (await send("accountant", next())).body as Row;
      expect((await h.as("admin").patch(`${o.path}/${a.id}`, upd().body)).status).toBe(200);
      await h.as("admin").delete(`${o.path}/${a.id}`);
      const rows = await h.db
        .select({ action: auditLog.action, by: auditLog.changedBy })
        .from(auditLog)
        .where(and(eq(auditLog.tableName, tableName), eq(auditLog.recordId, String(a.id))))
        .orderBy(auditLog.id);
      expect(rows).toEqual([
        { action: "INSERT", by: h.userIds.accountant },
        { action: "UPDATE", by: h.userIds.admin },
        { action: "DELETE", by: h.userIds.admin },
      ]);
    });
  });
}

/** Fails if the shared Zod schema accepts/rejects different lengths than the table's columns. */
export function describeSchemaDrift(title: string, table: MasterTable, shared: ZodTypeAny, minimal: Body, limits: [field: string, max: number][], dbBase: Body) {
  describe(`${title}: shared schema vs table columns (drizzle-zod)`, () => {
    const dbSchema = createInsertSchema(table as never);
    it("accepts and rejects the same lengths", () => {
      for (const [field, max] of limits) {
        for (const [len, ok] of [[max, true], [max + 1, false]] as const) {
          const v = "x".repeat(len);
          expect(shared.safeParse({ ...minimal, [field]: v }).success, `shared ${field}=${len}`).toBe(ok);
          expect((dbSchema as ZodTypeAny).safeParse({ ...dbBase, [field]: v }).success, `db ${field}=${len}`).toBe(ok);
        }
      }
    });
  });
}
