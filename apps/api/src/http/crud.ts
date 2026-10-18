import { Router } from "express";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { z, type ZodTypeAny } from "zod";
import { masterListQuerySchema } from "@ntcas/shared";
import { requireRole, type CompanyContext, type Role } from "../auth/companyContext";
import type { Db } from "../db/client";
import { withTx } from "../db/tx";
import { conflict, notFound } from "./errors";
import { orConflict, type UniqueRule } from "./pg";
import { validate } from "./validate";

/** A company-scoped master table: id, companyId, isActive and updatedAt are what the factory relies on. */
export type MasterTable = PgTable & {
  id: AnyPgColumn;
  companyId: AnyPgColumn;
  isActive: AnyPgColumn;
  updatedAt: AnyPgColumn;
};

export interface CrudConfig<Row extends { id: number }, Extra extends object> {
  table: MasterTable;
  /** Shown in "not found" errors, e.g. "Agent". */
  entity: string;
  inputSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** Columns (or SQL subqueries such as counts) returned for every row. Must include `id`. */
  select: Record<string, AnyPgColumn | SQL>;
  searchColumns: AnyPgColumn[];
  orderBy: AnyPgColumn;
  unique: UniqueRule[];
  /** Roles allowed to write besides ADMIN. Default ACCOUNTANT (so ACCOUNTANT and ADMIN). */
  writeRole?: Role;
  /**
   * Runs before a delete. Return a message to refuse it with a 409 (e.g. "this group has 3 sub-groups"),
   * or null to allow it. Use for rules the FK would only report as a generic "in use" error.
   */
  deleteGuard?: (db: Db, row: Row, ctx: CompanyContext) => Promise<string | null>;
  /** Extra data merged into GET /:id (e.g. records tagged to this one). */
  detail?: (db: Db, row: Row, ctx: CompanyContext) => Promise<Extra>;
}

const idParams = z.object({ id: z.coerce.number().int().positive() });

/**
 * REST router for a company-scoped master: list, get, create, patch, delete.
 * Every query is scoped to req.ctx.companyId, writes need `writeRole` or ADMIN and run in
 * withTx (so the audit trigger knows the user). Mount it behind requireAuth + companyContext.
 * Bulk actions are the client calling PATCH/DELETE per id, so there is no bulk route.
 */
export function crudRouter<Row extends { id: number }, Extra extends object = Record<string, never>>(
  db: Db,
  cfg: CrudConfig<Row, Extra>,
) {
  const r = Router();
  const writer = requireRole(cfg.writeRole ?? "ACCOUNTANT");
  const t = cfg.table;

  async function findRow(companyId: number, id: number): Promise<Row | undefined> {
    const [row] = await db
      .select(cfg.select)
      .from(t)
      .where(and(eq(t.id, id), eq(t.companyId, companyId)));
    return row as Row | undefined;
  }

  r.get("/", validate({ query: masterListQuerySchema }), async (req, res) => {
    const { status, q } = req.valid.query as z.infer<typeof masterListQuerySchema>;
    const where = and(
      eq(t.companyId, req.ctx.companyId),
      status === "active" ? eq(t.isActive, true) : undefined,
      q ? or(...cfg.searchColumns.map((c) => ilike(c, `%${q}%`))) : undefined,
    );
    res.json(await db.select(cfg.select).from(t).where(where).orderBy(asc(cfg.orderBy)));
  });

  r.get("/:id", validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    const row = await findRow(req.ctx.companyId, id);
    if (!row) throw notFound(cfg.entity);
    res.json(cfg.detail ? { ...row, ...(await cfg.detail(db, row, req.ctx)) } : row);
  });

  r.post("/", writer, validate({ body: cfg.inputSchema }), async (req, res) => {
    const created = await orConflict(cfg.unique, () =>
      withTx(db, req.appUser.id, async (tx) => {
        const [a] = await tx
          .insert(t)
          .values({ ...(req.valid.body as object), companyId: req.ctx.companyId, updatedAt: sql`CURRENT_TIMESTAMP` } as never)
          .returning({ id: t.id });
        return a as { id: number };
      }),
    );
    res.status(201).json(await findRow(req.ctx.companyId, created.id));
  });

  r.patch("/:id", writer, validate({ params: idParams, body: cfg.updateSchema }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    await orConflict(cfg.unique, () =>
      withTx(db, req.appUser.id, async (tx) => {
        const updated = await tx
          .update(t)
          .set({ ...(req.valid.body as object), updatedAt: sql`CURRENT_TIMESTAMP` } as never)
          .where(and(eq(t.id, id), eq(t.companyId, req.ctx.companyId)))
          .returning({ id: t.id });
        if (!updated.length) throw notFound(cfg.entity);
      }),
    );
    res.json(await findRow(req.ctx.companyId, id));
  });

  r.delete("/:id", writer, validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    if (cfg.deleteGuard) {
      const row = await findRow(req.ctx.companyId, id);
      if (!row) throw notFound(cfg.entity);
      const refusal = await cfg.deleteGuard(db, row, req.ctx);
      if (refusal) throw conflict(refusal);
    }
    await withTx(db, req.appUser.id, async (tx) => {
      const deleted = await tx
        .delete(t)
        .where(and(eq(t.id, id), eq(t.companyId, req.ctx.companyId)))
        .returning({ id: t.id });
      if (!deleted.length) throw notFound(cfg.entity);
    });
    res.status(204).end();
  });

  return r;
}
