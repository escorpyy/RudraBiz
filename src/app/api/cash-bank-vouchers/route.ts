import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateLines, describeWriteError, type CashBankVoucherLineInput } from "@/lib/cashBankVoucher";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const vouchers = await prisma.cashBankVoucher.findMany({
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
    lines?: CashBankVoucherLineInput[];
  } = body ?? {};

  if (!branchId || !voucherNumber || !voucherDate) {
    return NextResponse.json(
      { error: "Branch, Voucher No. and Date are required." },
      { status: 400 }
    );
  }

  const branch = await prisma.branch.findFirst({ where: { id: Number(branchId), companyId: ctx.companyId } });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 400 });

  const fiscalYear = await prisma.fiscalYear.findFirst({ where: { id: ctx.fiscalYearId, companyId: ctx.companyId } });
  if (!fiscalYear) return NextResponse.json({ error: "Fiscal year not found." }, { status: 400 });

  const ledgerIds = [...new Set((lines ?? []).map((l) => Number(l.generalLedgerId)))];
  const ledgers = await prisma.generalLedger.findMany({
    where: { id: { in: ledgerIds }, companyId: ctx.companyId },
    select: { id: true, isCashOrBank: true },
  });
  if (ledgers.length !== ledgerIds.length) {
    return NextResponse.json({ error: "One or more Account Heads were not found." }, { status: 400 });
  }
  const cashOrBankLedgerIds = new Set<number>(ledgers.filter((l) => l.isCashOrBank).map((l) => Number(l.id)));

  const linesError = validateLines(lines ?? [], cashOrBankLedgerIds);
  if (linesError) return NextResponse.json({ error: linesError }, { status: 400 });

  if (reversalOfId) {
    const original = await prisma.cashBankVoucher.findFirst({
      where: { id: Number(reversalOfId), companyId: ctx.companyId },
    });
    if (!original) return NextResponse.json({ error: "Voucher to reverse was not found." }, { status: 400 });
  }

  try {
    const voucher = await prisma.cashBankVoucher.create({
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
            instrumentType: line.instrumentType ?? null,
            chequeNumber: line.instrumentType === "CHEQUE" ? line.chequeNumber?.trim() || null : null,
            chequeDate: line.instrumentType === "CHEQUE" && line.chequeDate ? new Date(line.chequeDate) : null,
            chequeBankName: line.instrumentType === "CHEQUE" ? line.chequeBankName?.trim() || null : null,
            chequeBankBranch: line.instrumentType === "CHEQUE" ? line.chequeBankBranch?.trim() || null : null,
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
