import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateLines, describeWriteError, type JournalVoucherLineInput } from "@/lib/journalVoucher";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const voucher = await prisma.journalVoucher.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      reversalOf: { select: { id: true, voucherNumber: true } },
      lines: {
        orderBy: { lineNumber: "asc" },
        include: {
          generalLedger: { select: { id: true, code: true, name: true } },
          agent: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });
  if (!voucher) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(voucher);
}

/**
 * Handles two distinct edits under one verb:
 *  - `{ post: true }` marks the voucher posted (one-way; a posted voucher
 *    is final — see the isPosted guard below for everything else).
 *  - otherwise, a full field + line replacement, only allowed while the
 *    voucher is still a draft.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const voucherId = Number(id);
  const existing = await prisma.journalVoucher.findFirst({ where: { id: voucherId, companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body?.post === true) {
    if (existing.isPosted) return NextResponse.json({ error: "Voucher is already posted." }, { status: 400 });
    const posted = await prisma.journalVoucher.update({
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

  const ledgerIds = [...new Set((lines ?? []).map((l) => Number(l.generalLedgerId)))];
  const ledgerCount = await prisma.generalLedger.count({
    where: { id: { in: ledgerIds }, companyId: ctx.companyId },
  });
  if (ledgerCount !== ledgerIds.length) {
    return NextResponse.json({ error: "One or more Account Heads were not found." }, { status: 400 });
  }

  try {
    // Lines have no independent identity worth preserving across an edit
    // (no other table references a specific JournalVoucherLine row), so a
    // full replace-in-a-transaction is simpler and safer than diffing.
    const voucher = await prisma.$transaction(async (tx) => {
      await tx.journalVoucherLine.deleteMany({ where: { journalVoucherId: voucherId } });
      return tx.journalVoucher.update({
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
  const existing = await prisma.journalVoucher.findFirst({ where: { id: voucherId, companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.isPosted) {
    return NextResponse.json({ error: "A posted voucher can't be deleted." }, { status: 400 });
  }

  await prisma.journalVoucher.delete({ where: { id: voucherId } });
  return NextResponse.json({ success: true });
}
