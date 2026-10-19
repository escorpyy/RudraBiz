import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { userCompanyAccess } from "../db/schema";
import { forbidden, notFound } from "../http/errors";
import type { Role } from "./companyContext";

const RANK: Record<Role, number> = { VIEWER: 1, ACCOUNTANT: 2, ADMIN: 3 };

export interface CompanyAccess {
  /** Strongest role over the user's active access rows for the company. */
  role: Role;
  /** Has a row with no branch: access to every branch, and the right to manage the company itself. */
  companyWide: boolean;
}

/** All of a user's active access rows, grouped by company. Used by the tenant registry (Company master), which is not tied to one selected company. */
export async function accessByCompany(db: Db, userId: number): Promise<Map<number, CompanyAccess>> {
  const rows = await db
    .select({ companyId: userCompanyAccess.companyId, branchId: userCompanyAccess.branchId, role: userCompanyAccess.role })
    .from(userCompanyAccess)
    .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.isActive, true)));
  const out = new Map<number, CompanyAccess>();
  for (const r of rows) {
    const cur = out.get(r.companyId) ?? { role: "VIEWER" as Role, companyWide: false };
    out.set(r.companyId, {
      role: RANK[r.role] > RANK[cur.role] ? r.role : cur.role,
      companyWide: cur.companyWide || r.branchId === null,
    });
  }
  return out;
}

/**
 * Managing a company (editing it, deleting it, its branches) takes ADMIN with company-wide access:
 * a branch-level admin must not be able to change the company around their branch.
 * No access at all is reported as 404 so company ids can't be probed.
 */
export async function requireCompanyAdmin(db: Db, userId: number, companyId: number): Promise<void> {
  const a = (await accessByCompany(db, userId)).get(companyId);
  if (!a) throw notFound("Company");
  if (a.role !== "ADMIN" || !a.companyWide) throw forbidden("Only a company-wide administrator can do this");
}

/** True when the user is a company-wide ADMIN of at least one company (the right to create new companies). */
export async function isAnyCompanyAdmin(db: Db, userId: number): Promise<boolean> {
  for (const a of (await accessByCompany(db, userId)).values()) if (a.role === "ADMIN" && a.companyWide) return true;
  return false;
}
