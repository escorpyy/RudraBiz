import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateLines, describeWriteError, type CashBankVoucherLineInput } from "@/lib/cashBankVoucher";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const voucher = await prisma.cashBankVoucher.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      reversalOf: { select: { id: true, voucherNumber: true } },
      lines: {
        orderBy: { lineNumber: "asc" },
        include: {
          generalLedger: { select: { id: true, code: true, name: true, isCashOrBank: true } },
          agent: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });
  if (!voucher) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(voucher);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const voucherId = Number(id);
  const existing = await prisma.cashBankVoucher.findFirst({ where: { id: voucherId, companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body?.post === true) {
    if (existing.isPosted) return NextResponse.json({ error: "Voucher is already posted." }, { status: 400 });
    const posted = await prisma.cashBankVoucher.update({
      where: { id: voucherId },
      data: { isPosted: true, postedAt: new Date() },
    });
    return NextResponse.json(posted);
  }

  if (existing.isPosted) {
    return NextResponse.json({ error: "A posted voucher can't be edited." }, { status: 400 });
  }

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

  try {
    const voucher = await prisma.$transaction(async (tx) => {
      await tx.cashBankVoucherLine.deleteMany({ where: { cashBankVoucherId: voucherId } });
      return tx.cashBankVoucher.update({
        where: { id: voucherId },
        data: {
          branchId: Number(branchId),
          voucherNumber,
          voucherDate: new Date(voucherDate),
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
    });
    return NextResponse.json(voucher);
  } catch (err) {
    return NextResponse.json({ error: describeWriteError(err) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const voucherId = Number(id);
  const existing = await prisma.cashBankVoucher.findFirst({ where: { id: voucherId, companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.isPosted) {
    return NextResponse.json({ error: "A posted voucher can't be deleted." }, { status: 400 });
  }

  await prisma.cashBankVoucher.delete({ where: { id: voucherId } });
  return NextResponse.json({ success: true });
}
