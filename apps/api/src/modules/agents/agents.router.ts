import { asc, eq, sql } from "drizzle-orm";
import { agentInputSchema, agentUpdateSchema, type AgentDetail, type AgentRow } from "@ntcas/shared";
import type { Db } from "../../db/client";
import { agent, generalLedger, party } from "../../db/schema";
import { crudRouter } from "../../http/crud";

type Tagged = Pick<AgentDetail, "ledgers" | "parties">;

/** Agent master. Ledgers, parties and voucher lines that used a deleted agent keep working: the FK sets agentId to NULL. */
export function agentsRouter(db: Db) {
  return crudRouter<AgentRow, Tagged>(db, {
    table: agent,
    entity: "Agent",
    inputSchema: agentInputSchema,
    updateSchema: agentUpdateSchema,
    select: {
      id: agent.id,
      code: agent.code,
      name: agent.name,
      phone: agent.phone,
      isActive: agent.isActive,
      ledgersCount: sql<number>`(select count(*)::int from "GeneralLedger" g where g."agentId" = ${agent.id})`,
      partiesCount: sql<number>`(select count(*)::int from "Party" p where p."agentId" = ${agent.id})`,
    },
    searchColumns: [agent.code, agent.name],
    orderBy: agent.code,
    unique: [{ constraint: "Agent_companyId_code_key", field: "code", message: "An agent with that code already exists." }],
    detail: async (db, row) => ({
      ledgers: await db
        .select({ id: generalLedger.id, code: generalLedger.code, name: generalLedger.name, isActive: generalLedger.isActive })
        .from(generalLedger)
        .where(eq(generalLedger.agentId, row.id))
        .orderBy(asc(generalLedger.code)),
      parties: await db
        .select({ id: party.id, code: generalLedger.code, name: generalLedger.name })
        .from(party)
        .innerJoin(generalLedger, eq(generalLedger.id, party.generalLedgerId))
        .where(eq(party.agentId, row.id))
        .orderBy(asc(party.id)),
    }),
  });
}
