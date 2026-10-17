import { Router } from "express";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { agentInputSchema, agentListQuerySchema, agentUpdateSchema, type AgentDetail, type AgentRow } from "@ntcas/shared";
import { requireRole } from "../../auth/companyContext";
import type { Db } from "../../db/client";
import { withTx } from "../../db/tx";
import { agent, generalLedger, party } from "../../db/schema";
import { notFound } from "../../http/errors";
import { orConflict } from "../../http/pg";
import { validate } from "../../http/validate";

const idParams = z.object({ id: z.coerce.number().int().positive() });
const DUPLICATE = "An agent with that code already exists.";

/** Agent master. Every query is scoped to req.ctx.companyId; writes need ACCOUNTANT or ADMIN. */
export function agentsRouter(db: Db) {
  const r = Router();
  const writer = requireRole("ACCOUNTANT");

  const rowColumns = {
    id: agent.id,
    code: agent.code,
    name: agent.name,
    phone: agent.phone,
    isActive: agent.isActive,
    ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" g where g."agentId" = ${agent.id})`,
    partiesCount: sql<number>`(select count(*)::int from "Party" p where p."agentId" = ${agent.id})`,
  };

  async function findRow(companyId: number, id: number): Promise<AgentRow | undefined> {
    const [row] = await db.select(rowColumns).from(agent).where(and(eq(agent.id, id), eq(agent.companyId, companyId)));
    return row;
  }

  r.get("/", validate({ query: agentListQuerySchema }), async (req, res) => {
    const { status, q } = req.valid.query as z.infer<typeof agentListQuerySchema>;
    const where = and(
      eq(agent.companyId, req.ctx.companyId),
      status === "active" ? eq(agent.isActive, true) : undefined,
      q ? or(ilike(agent.code, `%${q}%`), ilike(agent.name, `%${q}%`)) : undefined,
    );
    const rows: AgentRow[] = await db.select(rowColumns).from(agent).where(where).orderBy(asc(agent.code));
    res.json(rows);
  });

  r.get("/:id", validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    const row = await findRow(req.ctx.companyId, id);
    if (!row) throw notFound("Agent");
    const ledgers = await db
      .select({ id: generalLedger.id, code: generalLedger.code, name: generalLedger.name, isActive: generalLedger.isActive })
      .from(generalLedger)
      .where(eq(generalLedger.agentId, id))
      .orderBy(asc(generalLedger.code));
    const parties = await db
      .select({ id: party.id, code: generalLedger.code, name: generalLedger.name })
      .from(party)
      .innerJoin(generalLedger, eq(generalLedger.id, party.generalLedgerId))
      .where(eq(party.agentId, id))
      .orderBy(asc(party.id));
    const detail: AgentDetail = { ...row, ledgers, parties };
    res.json(detail);
  });

  r.post("/", writer, validate({ body: agentInputSchema }), async (req, res) => {
    const body = req.valid.body as z.output<typeof agentInputSchema>;
    const created = await orConflict(DUPLICATE, () =>
      withTx(db, req.appUser.id, async (tx) => {
        const [a] = await tx
          .insert(agent)
          .values({ ...body, companyId: req.ctx.companyId, updatedAt: sql`CURRENT_TIMESTAMP` })
          .returning({ id: agent.id });
        return a!;
      }),
    );
    res.status(201).json(await findRow(req.ctx.companyId, created.id));
  });

  r.patch("/:id", writer, validate({ params: idParams, body: agentUpdateSchema }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    const body = req.valid.body as z.output<typeof agentUpdateSchema>;
    await orConflict(DUPLICATE, () =>
      withTx(db, req.appUser.id, async (tx) => {
        const updated = await tx
          .update(agent)
          .set({ ...body, updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(and(eq(agent.id, id), eq(agent.companyId, req.ctx.companyId)))
          .returning({ id: agent.id });
        if (!updated.length) throw notFound("Agent");
      }),
    );
    res.json(await findRow(req.ctx.companyId, id));
  });

  // Ledgers, parties and voucher lines that used this agent keep working: their agentId is set to NULL by the FK.
  r.delete("/:id", writer, validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params as z.infer<typeof idParams>;
    await withTx(db, req.appUser.id, async (tx) => {
      const deleted = await tx
        .delete(agent)
        .where(and(eq(agent.id, id), eq(agent.companyId, req.ctx.companyId)))
        .returning({ id: agent.id });
      if (!deleted.length) throw notFound("Agent");
    });
    res.status(204).end();
  });

  return r;
}
