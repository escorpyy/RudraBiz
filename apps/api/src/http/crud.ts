import { Router } from "express";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { z, type ZodTypeAny } from "zod";
import { masterListQuerySchema } from "@ntcas/shared";
import { requireRole, type CompanyContext, type Role } from "../auth/companyContext";
import type { Db } from "../db/client";
import { withTx, type Tx } from "../db/tx";
import { conflict, notFound } from "./errors";
import { orConflict, type UniqueRule } from "./pg";
import { validate } from "./validate";

/**
 * A master table: id, isActive and updatedAt are what the factory relies on. Tables that carry
 * companyId are scoped by it; tables owned through a parent (SubArea, ProductSubGroup) have none
 * and must give `scope` instead.
 */
export type MasterTable = PgTable & {
  id: AnyPgColumn;
  companyId?: AnyPgColumn;
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
  /**
   * Restricts every query to the active company. Default: `table.companyId = ctx.companyId`.
   * Required for tables without companyId, e.g. `inArray(subArea.areaId, select id from Area where companyId = ...)`.
   */
  scope?: (ctx: CompanyContext) => SQL;
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
  /**
   * Runs inside the write transaction before an insert or update, with the validated body
   * (`id` is set on update). Throw `fieldError(...)` to reject it, e.g. "parent not found".
   */
  beforeWrite?: (tx: Tx, input: Record<string, unknown>, ctx: CompanyContext, id?: number) => Promise<void>;
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
  if (!cfg.scope && !t.companyId) throw new Error(`crudRouter(${cfg.entity}): the table has no companyId, so \`scope\` is required`);
  const inScope = (ctx: CompanyContext): SQL => (cfg.scope ? cfg.scope(ctx) : eq(t.companyId!, ctx.companyId));

  async function findRow(ctx: CompanyContext, id: number): Promise<Row | undefined> {
    const [row] = await db
      .select(cfg.select)
      .from(t)
      .where(and(eq(t.id, id), inScope(ctx)));
    return row as Row | undefined;
  }

  r.get("/", validate({ query: masterListQuerySchema }), async (req, res) => {
    const { status, q } = req.valid.query as z.infer<typeof masterListQuerySchema>;
    const where = and(
      inScope(req.ctx),
      status === "active" ? eq(t.isActive, true) : undefined,
      q ? or(...cfg.searchColumns.map((c) => ilike(c, `%${q}%`))) : undefined,
    );
    res.json(await db.select(cfg.select).from(t).where(where).orderBy(asc(cfg.orderBy)));
  });

  r.get("/:id", validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    const row = await findRow(req.ctx, id);
    if (!row) throw notFound(cfg.entity);
    res.json(cfg.detail ? { ...row, ...(await cfg.detail(db, row, req.ctx)) } : row);
  });

  r.post("/", writer, validate({ body: cfg.inputSchema }), async (req, res) => {
    const created = await orConflict(cfg.unique, () =>
      withTx(db, req.appUser.id, async (tx) => {
        await cfg.beforeWrite?.(tx, req.valid.body as Record<string, unknown>, req.ctx);
        const [a] = await tx
          .insert(t)
          .values({ ...(req.valid.body as object), ...(t.companyId ? { companyId: req.ctx.companyId } : {}), updatedAt: sql`CURRENT_TIMESTAMP` } as never)
          .returning({ id: t.id });
        return a as { id: number };
      }),
    );
    res.status(201).json(await findRow(req.ctx, created.id));
  });

  r.patch("/:id", writer, validate({ params: idParams, body: cfg.updateSchema }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    await orConflict(cfg.unique, () =>
      withTx(db, req.appUser.id, async (tx) => {
        await cfg.beforeWrite?.(tx, req.valid.body as Record<string, unknown>, req.ctx, id);
        const updated = await tx
          .update(t)
          .set({ ...(req.valid.body as object), updatedAt: sql`CURRENT_TIMESTAMP` } as never)
          .where(and(eq(t.id, id), inScope(req.ctx)))
          .returning({ id: t.id });
        if (!updated.length) throw notFound(cfg.entity);
      }),
    );
    res.json(await findRow(req.ctx, id));
  });

  r.delete("/:id", writer, validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    if (cfg.deleteGuard) {
      const row = await findRow(req.ctx, id);
      if (!row) throw notFound(cfg.entity);
      const refusal = await cfg.deleteGuard(db, row, req.ctx);
      if (refusal) throw conflict(refusal);
    }
    await withTx(db, req.appUser.id, async (tx) => {
      const deleted = await tx
        .delete(t)
        .where(and(eq(t.id, id), inScope(req.ctx)))
        .returning({ id: t.id });
      if (!deleted.length) throw notFound(cfg.entity);
    });
    res.status(204).end();
  });

  return r;
}
