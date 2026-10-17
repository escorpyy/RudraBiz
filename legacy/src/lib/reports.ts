import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Both reports rest on the same idea: a ledger's balance is its Opening
 * Balance netted with every POSTED line ever written against it (drafts
 * don't count — they haven't happened yet). Trial Balance aggregates that
 * across every ledger; General Ledger drills into one ledger's lines.
 *
 * Company-wide by definition (every GeneralLedger is company-wide — see
 * the schema notes on Party/Location), but branch-filterable because the
 * underlying vouchers and opening balances are branch-level.
 */

export type LedgerBalanceRow = {
  generalLedgerId: number;
  code: string;
  name: string;
  normalBalance: "DEBIT" | "CREDIT";
  groupPath: string;
  isCashOrBank: boolean;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
};

function toNum(v: Prisma.Decimal | number | null | undefined): number {
  return v ? Number(v) : 0;
}

/**
 * One row per ledger that has any opening balance or period activity —
 * dormant ledgers with nothing to show are left out to keep the table
 * readable, same as a printed Trial Balance would.
 */
export async function computeTrialBalance(
  prisma: PrismaClient,
  companyId: number,
  branchId: number | null,
  fiscalYearId: number,
  fiscalYearCode: string
): Promise<LedgerBalanceRow[]> {
  const branchFilter = branchId === null ? {} : { branchId };

  const [ledgers, openingAgg, jvAgg, cbAgg] = await Promise.all([
    prisma.generalLedger.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        normalBalance: true,
        isCashOrBank: true,
        accountSubGroup: { select: { description: true, accountGroup: { select: { description: true } } } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.openingBalance.groupBy({
      by: ["generalLedgerId"],
      where: { companyId, fiscalYearId, ...branchFilter },
      _sum: { debit: true, credit: true },
    }),
    prisma.journalVoucherLine.groupBy({
      by: ["generalLedgerId"],
      where: { journalVoucher: { companyId, fiscalYear: fiscalYearCode, isPosted: true, ...branchFilter } },
      _sum: { debit: true, credit: true },
    }),
    prisma.cashBankVoucherLine.groupBy({
      by: ["generalLedgerId"],
      where: { cashBankVoucher: { companyId, fiscalYear: fiscalYearCode, isPosted: true, ...branchFilter } },
      _sum: { debit: true, credit: true },
    }),
  ]);

  const openingMap = new Map(openingAgg.map((r) => [r.generalLedgerId, r._sum]));
  const jvMap = new Map(jvAgg.map((r) => [r.generalLedgerId, r._sum]));
  const cbMap = new Map(cbAgg.map((r) => [r.generalLedgerId, r._sum]));

  const rows: LedgerBalanceRow[] = [];

  for (const gl of ledgers) {
    const opening = openingMap.get(gl.id);
    const jv = jvMap.get(gl.id);
    const cb = cbMap.get(gl.id);

    const openingDebit = toNum(opening?.debit);
    const openingCredit = toNum(opening?.credit);
    const periodDebit = toNum(jv?.debit) + toNum(cb?.debit);
    const periodCredit = toNum(jv?.credit) + toNum(cb?.credit);

    if (openingDebit === 0 && openingCredit === 0 && periodDebit === 0 && periodCredit === 0) continue;

    // Net into a single signed balance, then split back into Dr/Cr columns
    // — summing gross debits and gross credits separately would double
    // count instead of showing what the account actually settles to.
    const net = openingDebit - openingCredit + periodDebit - periodCredit;

    rows.push({
      generalLedgerId: gl.id,
      code: gl.code,
      name: gl.name,
      normalBalance: gl.normalBalance,
      groupPath: `${gl.accountSubGroup.accountGroup.description} > ${gl.accountSubGroup.description}`,
      isCashOrBank: gl.isCashOrBank,
      openingDebit,
      openingCredit,
      periodDebit,
      periodCredit,
      closingDebit: net > 0 ? net : 0,
      closingCredit: net < 0 ? -net : 0,
    });
  }

  return rows;
}

export type LedgerLine = {
  id: number;
  source: "JOURNAL" | "CASH_BANK";
  voucherId: number;
  voucherNumber: string;
  voucherDate: Date;
  narration: string | null;
  debit: number;
  credit: number;
};

/** Opening balance for one ledger, plus every posted line against it in date order. */
export async function computeGeneralLedgerStatement(
  prisma: PrismaClient,
  companyId: number,
  branchId: number | null,
  fiscalYearId: number,
  fiscalYearCode: string,
  generalLedgerId: number
): Promise<{ openingDebit: number; openingCredit: number; lines: LedgerLine[] }> {
  const branchFilter = branchId === null ? {} : { branchId };

  const [openingAgg, jvLines, cbLines] = await Promise.all([
    prisma.openingBalance.aggregate({
      where: { companyId, fiscalYearId, generalLedgerId, ...branchFilter },
      _sum: { debit: true, credit: true },
    }),
    prisma.journalVoucherLine.findMany({
      where: {
        generalLedgerId,
        journalVoucher: { companyId, fiscalYear: fiscalYearCode, isPosted: true, ...branchFilter },
      },
      select: {
        id: true,
        debit: true,
        credit: true,
        narration: true,
        journalVoucher: { select: { id: true, voucherNumber: true, voucherDate: true } },
      },
    }),
    prisma.cashBankVoucherLine.findMany({
      where: {
        generalLedgerId,
        cashBankVoucher: { companyId, fiscalYear: fiscalYearCode, isPosted: true, ...branchFilter },
      },
      select: {
        id: true,
        debit: true,
        credit: true,
        narration: true,
        cashBankVoucher: { select: { id: true, voucherNumber: true, voucherDate: true } },
      },
    }),
  ]);

  const lines: LedgerLine[] = [
    ...jvLines.map((l) => ({
      id: l.id,
      source: "JOURNAL" as const,
      voucherId: l.journalVoucher.id,
      voucherNumber: l.journalVoucher.voucherNumber,
      voucherDate: l.journalVoucher.voucherDate,
      narration: l.narration,
      debit: toNum(l.debit),
      credit: toNum(l.credit),
    })),
    ...cbLines.map((l) => ({
      id: l.id,
      source: "CASH_BANK" as const,
      voucherId: l.cashBankVoucher.id,
      voucherNumber: l.cashBankVoucher.voucherNumber,
      voucherDate: l.cashBankVoucher.voucherDate,
      narration: l.narration,
      debit: toNum(l.debit),
      credit: toNum(l.credit),
    })),
  ].sort((a, b) => a.voucherDate.getTime() - b.voucherDate.getTime() || a.voucherId - b.voucherId);

  return {
    openingDebit: toNum(openingAgg._sum.debit),
    openingCredit: toNum(openingAgg._sum.credit),
    lines,
  };
}
