import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { validateAmounts, describeWriteError } from "@/lib/openingBalance";

export const dynamic = "force-dynamic";

/**
 * Opening balances are scoped by the header switcher's full
 * Company -> Branch -> Fiscal Year selection, not just company: an opening
 * balance only means anything for one specific year and branch. When the
 * switcher is on "All Branches" (branchId === null) the list spans every
 * branch of the company, but creating a row still requires picking one,
 * since OpeningBalance.branchId is NOT NULL.
 */
export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });
  if (ctx.fiscalYearId === null) {
    return NextResponse.json({ error: "No fiscal year selected." }, { status: 400 });
  }

  const rows = await prisma.openingBalance.findMany({
    where: {
      companyId: ctx.companyId,
      fiscalYearId: ctx.fiscalYearId,
      ...(ctx.branchId === null ? {} : { branchId: ctx.branchId }),
    },
    orderBy: { generalLedger: { code: "asc" } },
    include: {
      generalLedger: { select: { id: true, code: true, name: true } },
      subLedger: { select: { id: true, code: true, name: true } },
      branch: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });
  if (ctx.fiscalYearId === null) {
    return NextResponse.json({ error: "No fiscal year selected." }, { status: 400 });
  }

  const body = await req.json();
  const { branchId, generalLedgerId, subLedgerId, debit, credit, remarks } = body ?? {};

  if (!branchId || !generalLedgerId) {
    return NextResponse.json({ error: "Branch and General Ledger are required." }, { status: 400 });
  }

  const debitValue = Number(debit ?? 0);
  const creditValue = Number(credit ?? 0);
  const amountError = validateAmounts(debitValue, creditValue);
  if (amountError) return NextResponse.json({ error: amountError }, { status: 400 });

  // Every referenced record has to belong to the selected company, so a
  // crafted request can't attach another tenant's ledger to this company's
  // opening balances.
  const branch = await prisma.branch.findFirst({
    where: { id: Number(branchId), companyId: ctx.companyId, isActive: true },
  });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 400 });

  const generalLedger = await prisma.generalLedger.findFirst({
    where: { id: Number(generalLedgerId), companyId: ctx.companyId },
  });
  if (!generalLedger) return NextResponse.json({ error: "General ledger not found." }, { status: 400 });

  if (subLedgerId) {
    const subLedger = await prisma.subLedger.findFirst({
      where: {
        id: Number(subLedgerId),
        OR: [{ generalLedger: { companyId: ctx.companyId } }, { party: { companyId: ctx.companyId } }],
      },
    });
    if (!subLedger) return NextResponse.json({ error: "Sub-ledger not found." }, { status: 400 });
  }

  try {
    const created = await prisma.openingBalance.create({
      data: {
        // companyId is re-derived from fiscalYearId by trg_sync_ob_company,
        // which also rejects a branch belonging to a different company —
        // passed here only to satisfy the required create input.
        companyId: ctx.companyId,
        branchId: Number(branchId),
        fiscalYearId: ctx.fiscalYearId,
        generalLedgerId: Number(generalLedgerId),
        subLedgerId: subLedgerId ? Number(subLedgerId) : null,
        debit: new Prisma.Decimal(debitValue),
        credit: new Prisma.Decimal(creditValue),
        remarks: remarks?.trim() ? remarks.trim() : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: describeWriteError(err) }, { status: 409 });
  }
}
