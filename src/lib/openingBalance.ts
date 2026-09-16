import { Prisma } from "@prisma/client";

/**
 * Validation and error-mapping shared between the opening-balance collection
 * route and the per-row route.
 *
 * These live here rather than in `src/app/api/opening-balances/route.ts`
 * because Next.js only permits route handlers (GET/POST/...) and a small set
 * of config exports from a `route.ts` — exporting helpers from one breaks the
 * build.
 */

/**
 * A single opening balance row is one side of a trial balance line, so
 * exactly one of debit/credit may carry a value: a row with both set is
 * almost always a data-entry slip, and a row with neither is noise.
 * Returns an error string, or null when the amounts are acceptable.
 */
export function validateAmounts(debit: number, credit: number): string | null {
  if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
    return "Debit and Credit must be valid numbers.";
  }
  if (debit < 0 || credit < 0) {
    return "Debit and Credit can't be negative.";
  }
  if (debit > 0 && credit > 0) {
    return "Enter either a Debit or a Credit amount, not both.";
  }
  if (debit === 0 && credit === 0) {
    return "Enter a Debit or a Credit amount.";
  }
  return null;
}

/**
 * Uniqueness here is enforced by two *partial* unique indexes created in the
 * migration (one row per ledger per year+branch, and separately one per
 * ledger+sub-ledger), which Prisma's declarative schema can't express. Those
 * surface as P2002 in most cases but can also come back as a raw constraint
 * error, so both paths map to the same human-readable message.
 */
export function describeWriteError(err: unknown): string {
  const isDuplicate =
    (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") ||
    (err instanceof Error && err.message.includes("OpeningBalance_fy_branch_gl"));

  if (isDuplicate) {
    return "An opening balance already exists for this ledger (and sub-ledger) in the selected branch and fiscal year.";
  }
  if (err instanceof Error && err.message.includes("must belong to the same company")) {
    return "That branch doesn't belong to the selected company's fiscal year.";
  }
  console.error(err);
  return "Failed to save opening balance.";
}
