import type { IncomingHttpHeaders } from "node:http";
import type { RequestHandler } from "express";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { branch, company, fiscalYear, userCompanyAccess } from "../db/schema";
import { AppError, badRequest, forbidden } from "../http/errors";

export type Role = "ADMIN" | "ACCOUNTANT" | "VIEWER";
const RANK: Record<Role, number> = { VIEWER: 1, ACCOUNTANT: 2, ADMIN: 3 };

export interface CompanyContext {
  companyId: number;
  /** null = all branches of the company (only possible for users with company-wide access) */
  branchId: number | null;
  fiscalYearId: number | null;
  role: Role;
}

export interface ContextInput {
  companyId?: number;
  branchId?: number | "all";
  fiscalYearId?: number;
}

declare module "express-serve-static-core" {
  interface Request {
    ctx: CompanyContext;
  }
}

/**
 * Decides which company / branch / fiscal year a request works in, and checks
 * the signed-in user is actually allowed there. This is the single place the
 * tenant boundary is enforced: every module reads req.ctx, never raw headers.
 *
 * Access rows: branchId null = whole company, otherwise that one branch.
 */
export async function resolveContext(db: Db, userId: number, input: ContextInput): Promise<CompanyContext> {
  const access = await db
    .select({ companyId: userCompanyAccess.companyId, branchId: userCompanyAccess.branchId, role: userCompanyAccess.role })
    .from(userCompanyAccess)
    .innerJoin(company, eq(company.id, userCompanyAccess.companyId))
    .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.isActive, true), eq(company.isActive, true)))
    .orderBy(asc(userCompanyAccess.companyId));

  if (!access.length) throw forbidden("You do not have access to any company");

  let companyId = input.companyId;
  if (companyId === undefined) companyId = access[0]!.companyId;
  const rows = access.filter((a) => a.companyId === companyId);
  if (!rows.length) throw forbidden("You do not have access to this company");

  const companyWide = rows.some((r) => r.branchId === null);
  const allowedBranches = new Set(rows.flatMap((r) => (r.branchId === null ? [] : [r.branchId])));

  let branchId: number | null;
  if (input.branchId === undefined || input.branchId === "all") {
    if (companyWide) branchId = null;
    else if (allowedBranches.size === 1) branchId = [...allowedBranches][0]!;
    else throw badRequest("Select a branch");
  } else {
    if (!companyWide && !allowedBranches.has(input.branchId)) throw forbidden("You do not have access to this branch");
    const [b] = await db
      .select({ id: branch.id })
      .from(branch)
      .where(and(eq(branch.id, input.branchId), eq(branch.companyId, companyId), eq(branch.isActive, true)));
    if (!b) throw forbidden("Branch does not belong to this company");
    branchId = b.id;
  }

  let fiscalYearId: number | null;
  if (input.fiscalYearId !== undefined) {
    const [fy] = await db
      .select({ id: fiscalYear.id })
      .from(fiscalYear)
      .where(and(eq(fiscalYear.id, input.fiscalYearId), eq(fiscalYear.companyId, companyId)));
    if (!fy) throw forbidden("Fiscal year does not belong to this company");
    fiscalYearId = fy.id;
  } else {
    const [fy] = await db
      .select({ id: fiscalYear.id })
      .from(fiscalYear)
      .where(and(eq(fiscalYear.companyId, companyId), eq(fiscalYear.isCurrent, true)));
    fiscalYearId = fy?.id ?? null;
  }

  // Role = strongest role among the rows that apply to the chosen branch.
  const applicable = rows.filter((r) => r.branchId === null || r.branchId === branchId || branchId === null);
  const role = applicable.reduce<Role>((best, r) => (RANK[r.role] > RANK[best] ? r.role : best), "VIEWER");

  return { companyId, branchId, fiscalYearId, role };
}

function headerInt(v: string | string[] | undefined, name: string): number | undefined {
  if (v === undefined || v === "") return undefined;
  const s = Array.isArray(v) ? v[0]! : v;
  if (!/^\d+$/.test(s)) throw badRequest(`Invalid ${name} header`);
  return Number(s);
}

/** Reads X-Company-Id / X-Branch-Id ("all" ok) / X-Fiscal-Year-Id. */
export function parseContextHeaders(headers: IncomingHttpHeaders): ContextInput {
  const rawBranch = headers["x-branch-id"];
  return {
    companyId: headerInt(headers["x-company-id"], "X-Company-Id"),
    branchId: rawBranch === "all" ? "all" : headerInt(rawBranch, "X-Branch-Id"),
    fiscalYearId: headerInt(headers["x-fiscal-year-id"], "X-Fiscal-Year-Id"),
  };
}

/** Resolves req.ctx for module routes. Must run after requireAuth. */
export function companyContext(db: Db): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.ctx = await resolveContext(db, req.appUser.id, parseContextHeaders(req.headers));
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Allow only the listed roles (ADMIN always allowed). Runs after companyContext. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (req.ctx.role === "ADMIN" || roles.includes(req.ctx.role)) return next();
    next(new AppError(403, "FORBIDDEN", "Your role does not allow this action"));
  };
}
