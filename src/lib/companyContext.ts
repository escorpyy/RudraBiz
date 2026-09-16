import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ============================================================
// COMPANY / BRANCH / FISCAL YEAR CONTEXT
//
// The app has no login/session system yet, so there's no signed-in
// user to hang the "current company" off of. Until that exists, the
// selected Company -> Branch -> Fiscal Year lives in three plain
// cookies, set by the header switcher (CompanySwitcher.tsx) via
// POST /api/context. Every Server Component and API route that needs
// to scope a query calls getCompanyContext() to read the same three
// cookies and resolve them against the database, so there's exactly
// one place that decides "what does a request without a real session
// default to".
//
// When real auth lands, swap the "first active company a real user
// has access to" fallback below for a UserCompanyAccess lookup keyed
// off the signed-in user — the cookie plumbing and the API routes
// that consume getCompanyContext() won't need to change.
// ============================================================

export const COMPANY_COOKIE = "ntcas_companyId";
export const BRANCH_COOKIE = "ntcas_branchId";
export const FISCAL_YEAR_COOKIE = "ntcas_fiscalYearId";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  // 1 year — this is a UI preference, not a session credential.
  maxAge: 60 * 60 * 24 * 365,
};

export interface CompanyContext {
  companyId: number;
  // null = "All Branches" for this company, a deliberate selection,
  // not an unset value.
  branchId: number | null;
  fiscalYearId: number | null;
}

/**
 * Resolves the current Company/Branch/FiscalYear selection from
 * cookies, falling back to sane defaults (first active company, "All
 * Branches", that company's current fiscal year) for anything missing
 * or no longer valid — e.g. a cookie pointing at a company that was
 * since deactivated, or a branch that belongs to a different company
 * than the one now selected.
 *
 * Never throws for "nothing set up yet": if there's truly no active
 * company in the database, companyId comes back as null and callers
 * (API routes in particular) should treat that as "setup required"
 * rather than a scoping bug.
 */
export async function getCompanyContext(): Promise<{
  companyId: number | null;
  branchId: number | null;
  fiscalYearId: number | null;
}> {
  const cookieStore = await cookies();

  const rawCompanyId = cookieStore.get(COMPANY_COOKIE)?.value;
  const rawBranchId = cookieStore.get(BRANCH_COOKIE)?.value;
  const rawFiscalYearId = cookieStore.get(FISCAL_YEAR_COOKIE)?.value;

  let company = rawCompanyId
    ? await prisma.company.findFirst({ where: { id: Number(rawCompanyId), isActive: true } })
    : null;

  if (!company) {
    company = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
  }

  if (!company) {
    // No company exists at all yet (e.g. brand-new install before
    // seeding/setup). Nothing to scope against.
    return { companyId: null, branchId: null, fiscalYearId: null };
  }

  let branchId: number | null = null;
  if (rawBranchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: Number(rawBranchId), companyId: company.id, isActive: true },
    });
    branchId = branch?.id ?? null;
  }

  let fiscalYear = rawFiscalYearId
    ? await prisma.fiscalYear.findFirst({
        where: { id: Number(rawFiscalYearId), companyId: company.id },
      })
    : null;

  if (!fiscalYear) {
    fiscalYear = await prisma.fiscalYear.findFirst({
      where: { companyId: company.id, isCurrent: true },
    });
  }

  return {
    companyId: company.id,
    branchId,
    fiscalYearId: fiscalYear?.id ?? null,
  };
}

/** Persists a selection to the three context cookies. */
export async function setCompanyContext(context: CompanyContext) {
  const cookieStore = await cookies();
  cookieStore.set(COMPANY_COOKIE, String(context.companyId), COOKIE_OPTIONS);
  if (context.branchId === null) {
    cookieStore.delete(BRANCH_COOKIE);
  } else {
    cookieStore.set(BRANCH_COOKIE, String(context.branchId), COOKIE_OPTIONS);
  }
  if (context.fiscalYearId === null) {
    cookieStore.delete(FISCAL_YEAR_COOKIE);
  } else {
    cookieStore.set(FISCAL_YEAR_COOKIE, String(context.fiscalYearId), COOKIE_OPTIONS);
  }
}

/**
 * Convenience wrapper for the common case: an API route that needs a
 * companyId to scope its query and should fail loudly (400) rather
 * than silently return unscoped data if none is resolvable yet.
 */
export async function requireCompanyId(): Promise<
  { ok: true; companyId: number; branchId: number | null; fiscalYearId: number | null } | { ok: false }
> {
  const ctx = await getCompanyContext();
  if (ctx.companyId === null) return { ok: false };
  return { ok: true, companyId: ctx.companyId, branchId: ctx.branchId, fiscalYearId: ctx.fiscalYearId };
}
