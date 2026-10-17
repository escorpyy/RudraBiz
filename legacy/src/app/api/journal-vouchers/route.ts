import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateLines, describeWriteError, type JournalVoucherLineInput } from "@/lib/journalVoucher";

export const dynamic = "force-dynamic";

/**
 * Scoped by the header switcher's Company -> Branch -> Fiscal Year, same
 * pattern as /api/opening-balances: a voucher only means anything for one
 * specific year, and when the switcher is on "All Branches" the list spans
 * every branch of the company.
 */
export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const vouchers = await prisma.journalVoucher.findMany({
    where: {
      companyId: ctx.companyId,
      ...(ctx.branchId === null ? {} : { branchId: ctx.branchId }),
    },
    orderBy: [{ voucherDate: "desc" }, { id: "desc" }],
    include: {
      branch: { select: { id: true, code: true, name: true } },
      lines: { select: { debit: true, credit: true } },
    },
  });

  return NextResponse.json(vouchers);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });
  if (ctx.fiscalYearId === null) {
    return NextResponse.json({ error: "No fiscal year selected." }, { status: 400 });
  }

  const body = await req.json();
  const {
    branchId,
    voucherNumber,
    voucherDate,
    remarks,
    reversalOfId,
    lines,
  }: {
    branchId?: number;
    voucherNumber?: string;
    voucherDate?: string;
    remarks?: string | null;
    reversalOfId?: number | null;
    lines?: JournalVoucherLineInput[];
  } = body ?? {};

  if (!branchId || !voucherNumber || !voucherDate) {
    return NextResponse.json(
      { error: "Branch, Voucher No. and Date are required." },
      { status: 400 }
    );
  }

  const linesError = validateLines(lines ?? []);
  if (linesError) return NextResponse.json({ error: linesError }, { status: 400 });

  // Every referenced record has to belong to the selected company, so a
  // stray id from a stale client can't cross-post into another company.
  const branch = await prisma.branch.findFirst({ where: { id: Number(branchId), companyId: ctx.companyId } });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 400 });

  const fiscalYear = await prisma.fiscalYear.findFirst({ where: { id: ctx.fiscalYearId, companyId: ctx.companyId } });
  if (!fiscalYear) return NextResponse.json({ error: "Fiscal year not found." }, { status: 400 });

  const ledgerIds = [...new Set((lines ?? []).map((l) => Number(l.generalLedgerId)))];
  const ledgerCount = await prisma.generalLedger.count({
    where: { id: { in: ledgerIds }, companyId: ctx.companyId },
  });
  if (ledgerCount !== ledgerIds.length) {
    return NextResponse.json({ error: "One or more Account Heads were not found." }, { status: 400 });
  }

  if (reversalOfId) {
    const original = await prisma.journalVoucher.findFirst({
      where: { id: Number(reversalOfId), companyId: ctx.companyId },
    });
    if (!original) return NextResponse.json({ error: "Voucher to reverse was not found." }, { status: 400 });
  }

  try {
    const voucher = await prisma.journalVoucher.create({
      data: {
        companyId: ctx.companyId,
        branchId: Number(branchId),
        voucherNumber,
        voucherDate: new Date(voucherDate),
        fiscalYear: fiscalYear.code,
        remarks: remarks?.trim() ? remarks.trim() : null,
        reversalOfId: reversalOfId ? Number(reversalOfId) : null,
        lines: {
          create: (lines ?? []).map((line, i) => ({
            lineNumber: i + 1,
            generalLedgerId: Number(line.generalLedgerId),
            debit: Number(line.debit ?? 0),
            credit: Number(line.credit ?? 0),
            narration: line.narration?.trim() ? line.narration.trim() : null,
            agentId: line.agentId ? Number(line.agentId) : null,
          })),
        },
      },
      include: { lines: true },
    });
    return NextResponse.json(voucher, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: describeWriteError(err) }, { status: 400 });
  }
}
