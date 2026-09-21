import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Mirrors src/lib/journalVoucher.ts, plus the one rule that makes a
 * Cash/Bank Voucher a distinct document rather than a plain Journal
 * Voucher: at least one line has to actually touch a cash/bank ledger
 * (GeneralLedger.isCashOrBank). Everything else about double-entry
 * balancing is identical.
 */

export type CashBankVoucherLineInput = {
  generalLedgerId: number;
  debit: number;
  credit: number;
  narration?: string | null;
  agentId?: number | null;
  instrumentType?: "CHEQUE" | "RTGS" | "ONLINE_TRANSFER" | "OTHER" | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  chequeBankName?: string | null;
  chequeBankBranch?: string | null;
};

export function validateLines(
  lines: CashBankVoucherLineInput[],
  cashOrBankLedgerIds: Set<number>
): string | null {
  if (!Array.isArray(lines) || lines.length < 2) {
    return "A cash/bank voucher needs at least two lines.";
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let touchesCashOrBank = false;

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
    if (cashOrBankLedgerIds.has(Number(line.generalLedgerId))) {
      touchesCashOrBank = true;
    }
    if (line.instrumentType === "CHEQUE" && !line.chequeNumber?.trim()) {
      return "Cheque No. is required when the instrument is Cheque.";
    }
    totalDebit += debit;
    totalCredit += credit;
  }

  if (!touchesCashOrBank) {
    return "At least one line must be a Cash or Bank account — otherwise this belongs on a Journal Voucher.";
  }

  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    return `Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}).`;
  }

  return null;
}

export function describeWriteError(err: unknown): string {
  const isDuplicate =
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
  if (isDuplicate) {
    return "A voucher with this number already exists for this branch. Refresh the voucher number and try again.";
  }
  console.error(err);
  return "Failed to save cash/bank voucher.";
}

/** Same scheme as Journal Voucher, prefixed "CB-" instead of "JV-". */
export async function nextVoucherNumber(
  prisma: PrismaClient | Prisma.TransactionClient,
  branchId: number
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CB-${year}-`;

  const existing = await prisma.cashBankVoucher.findMany({
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
