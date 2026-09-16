import { Prisma } from "@prisma/client";

/**
 * Maps fiscal year write failures to messages a user can act on.
 *
 * "One current year per company" is enforced by a partial unique index
 * (`FiscalYear_only_one_current_per_company`) added in the multi-tenant
 * migration — Prisma can't express that declaratively, same pattern as
 * `Branch_only_one_head_office_per_company`. It can surface either as a
 * raw constraint error or as P2002 depending on the code path, so both are
 * handled. The date-range and closed/current rules are plain CHECK
 * constraints (`FiscalYear_dateRange_check`, `FiscalYear_closedNotCurrent_check`)
 * that are also validated up front in the route, but are mapped here too in
 * case a race lets one through to the database.
 *
 * Lives here rather than in a `route.ts` because Next.js only permits route
 * handlers and a small set of config exports from those files.
 */
export function describeFiscalYearError(err: unknown): string {
  if (err instanceof Error && err.message.includes("FiscalYear_only_one_current_per_company")) {
    return "This company already has a current fiscal year. Clear the existing one first.";
  }
  if (err instanceof Error && err.message.includes("FiscalYear_closedNotCurrent_check")) {
    return "A fiscal year can't be both current and closed at the same time.";
  }
  if (err instanceof Error && err.message.includes("FiscalYear_dateRange_check")) {
    return "End Date must be after Start Date.";
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String(err.meta?.target ?? "");
    if (target.includes("current")) {
      return "This company already has a current fiscal year. Clear the existing one first.";
    }
    return "A fiscal year with that code already exists in this company.";
  }
  console.error(err);
  return "Failed to save fiscal year.";
}
