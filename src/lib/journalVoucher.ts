import { Prisma } from "@prisma/client";

/**
 * Validation and error-mapping shared between the journal-voucher collection
 * route and the per-voucher route. Lives here (not in route.ts) because
 * Next.js route files may only export HTTP handlers + a small set of config.
 */

export type JournalVoucherLineInput = {
  generalLedgerId: number;
  debit: number;
  credit: number;
  narration?: string | null;
  agentId?: number | null;
};

/**
 * A journal voucher is only meaningful as a double-entry: at least two
 * lines, each one strictly a debit OR a credit (never both, never
 * neither), and the two columns must foot to the same total. Returns an
 * error string, or null when the lines are acceptable.
 */
export function validateLines(lines: JournalVoucherLineInput[]): string | null {
  if (!Array.isArray(lines) || lines.length < 2) {
    return "A journal voucher needs at least two lines.";
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    if (!line.generalLedgerId) {
      return "Every line needs an Account Head.";
    }
    const debit = Number(line.debit ?? 0);
    const credit = Number(line.credit ?? 0);
    if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
      return "Debit and Credit must be valid numbers.";
    }
    if (debit < 0 || credit < 0) {
      return "Debit and Credit can't be negative.";
    }
    if (debit > 0 && credit > 0) {
      return "Each line can carry either a Debit or a Credit, not both.";
    }
    if (debit === 0 && credit === 0) {
      return "Every line needs a Debit or a Credit amount.";
    }
    totalDebit += debit;
    totalCredit += credit;
  }

  // Compare in cents to sidestep floating-point drift from repeated
  // addition (e.g. 0.1 + 0.2 !== 0.3).
  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    return `Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}).`;
  }

  return null;
}

/**
 * Uniqueness is enforced by @@unique([branchId, voucherNumber]) in the
 * schema — surfaces as Prisma's P2002 when a duplicate voucher number is
 * submitted for the same branch.
 */
export function describeWriteError(err: unknown): string {
  const isDuplicate =
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
  if (isDuplicate) {
    return "A voucher with this number already exists for this branch. Refresh the voucher number and try again.";
  }
  console.error(err);
  return "Failed to save journal voucher.";
}

/**
 * Next voucher number for a branch, formatted "JV-{year}-{seq}". Looks at
 * the highest existing sequence for the current calendar year on this
 * branch and increments it — good enough for single-writer use; the
 * @@unique constraint is the real guard against a collision.
 */
export async function nextVoucherNumber(
  prisma: { journalVoucher: { findMany: (args: unknown) => Promise<{ voucherNumber: string }[]> } },
  branchId: number
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JV-${year}-`;

  const existing = await prisma.journalVoucher.findMany({
    where: { branchId, voucherNumber: { startsWith: prefix } },
    select: { voucherNumber: true },
  });

  let maxSeq = 0;
  for (const row of existing) {
    const suffix = row.voucherNumber.slice(prefix.length);
    const n = Number(suffix);
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
  }

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}
