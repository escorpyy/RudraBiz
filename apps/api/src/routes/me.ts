import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { parseContextHeaders, resolveContext, type CompanyContext } from "../auth/companyContext";
import { branch, company, fiscalYear, userCompanyAccess } from "../db/schema";
import { AppError } from "../http/errors";

/**
 * Who am I, which companies/branches/fiscal years can I switch to, and what is currently selected.
 * Deliberately NOT behind companyContext: the client needs this list in order to choose a context,
 * so an unresolved selection is reported as context:null + contextError instead of an HTTP error.
 */
export function meRouter(db: Db) {
  const r = Router();
  r.get("/", async (req, res) => {
    const access = await db
      .select({
        companyId: company.id,
        companyCode: company.code,
        companyName: company.name,
        branchId: userCompanyAccess.branchId,
        role: userCompanyAccess.role,
      })
      .from(userCompanyAccess)
      .innerJoin(company, eq(company.id, userCompanyAccess.companyId))
      .where(and(eq(userCompanyAccess.userId, req.appUser.id), eq(userCompanyAccess.isActive, true), eq(company.isActive, true)))
      .orderBy(asc(company.id));

    const companies = [];
    for (const id of [...new Set(access.map((a) => a.companyId))]) {
      const rows = access.filter((a) => a.companyId === id);
      const companyWide = rows.some((a) => a.branchId === null);
      const allowed = new Set(rows.flatMap((a) => (a.branchId === null ? [] : [a.branchId])));
      const branches = (
        await db
          .select({ id: branch.id, code: branch.code, name: branch.name, isHeadOffice: branch.isHeadOffice })
          .from(branch)
          .where(and(eq(branch.companyId, id), eq(branch.isActive, true)))
          .orderBy(asc(branch.id))
      ).filter((b) => companyWide || allowed.has(b.id));
      const fiscalYears = await db
        .select({ id: fiscalYear.id, code: fiscalYear.code, isCurrent: fiscalYear.isCurrent, isClosed: fiscalYear.isClosed })
        .from(fiscalYear)
        .where(and(eq(fiscalYear.companyId, id), eq(fiscalYear.isActive, true)))
        .orderBy(asc(fiscalYear.startDate));
      companies.push({ id, code: rows[0]!.companyCode, name: rows[0]!.companyName, allBranches: companyWide, branches, fiscalYears });
    }
    let context: CompanyContext | null = null;
    let contextError: string | null = null;
    try {
      context = await resolveContext(db, req.appUser.id, parseContextHeaders(req.headers));
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      contextError = e.message;
    }
    res.json({ user: req.appUser, companies, context, contextError });
  });
  return r;
}
