import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { describeFiscalYearError } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { id: Number(id), companyId: ctx.companyId },
    include: {
      company: { select: { id: true, name: true } },
      _count: { select: { openingBalances: true, stockOpeningBalances: true } },
    },
  });
  if (!fiscalYear) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(fiscalYear);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.fiscalYear.findFirst({ where: { id: Number(id), companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { code, startDate, endDate, isCurrent, isClosed, isOpeningBalanceLocked, isActive } = body ?? {};

  // Resolve the merged before/after state up front so the date-range and
  // closed/current checks can be validated against what the row will
  // actually look like after this update, not just the fields provided.
  const nextStart = startDate !== undefined ? new Date(startDate) : existing.startDate;
  const nextEnd = endDate !== undefined ? new Date(endDate) : existing.endDate;
  if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) {
    return NextResponse.json({ error: "Start Date and End Date must be valid dates." }, { status: 400 });
  }
  if (nextEnd <= nextStart) {
    return NextResponse.json({ error: "End Date must be after Start Date." }, { status: 400 });
  }

  const nextIsCurrent = typeof isCurrent === "boolean" ? isCurrent : existing.isCurrent;
  const nextIsClosed = typeof isClosed === "boolean" ? isClosed : existing.isClosed;
  if (nextIsCurrent && nextIsClosed) {
    return NextResponse.json(
      { error: "A fiscal year can't be both current and closed at the same time." },
      { status: 400 }
    );
  }

  // closedAt/openingBalanceLockedAt track the moment the flag flipped, the
  // same shape as FiscalYear.closedBy/openingBalanceLockedBy — but this app
  // has no login/session system yet (see lib/companyContext.ts), so the
  // "by" columns are left null here rather than attributed to a fake user.
  const closedAtUpdate =
    typeof isClosed === "boolean" && isClosed !== existing.isClosed
      ? { closedAt: isClosed ? new Date() : null, closedBy: isClosed ? existing.closedBy : null }
      : {};
  const lockedAtUpdate =
    typeof isOpeningBalanceLocked === "boolean" && isOpeningBalanceLocked !== existing.isOpeningBalanceLocked
      ? {
          openingBalanceLockedAt: isOpeningBalanceLocked ? new Date() : null,
          openingBalanceLockedBy: isOpeningBalanceLocked ? existing.openingBalanceLockedBy : null,
        }
      : {};

  try {
    const fiscalYear = await prisma.fiscalYear.update({
      where: { id: Number(id) },
      data: {
        code: code?.trim() || undefined,
        startDate: startDate !== undefined ? nextStart : undefined,
        endDate: endDate !== undefined ? nextEnd : undefined,
        isCurrent: typeof isCurrent === "boolean" ? isCurrent : undefined,
        isClosed: typeof isClosed === "boolean" ? isClosed : undefined,
        isOpeningBalanceLocked: typeof isOpeningBalanceLocked === "boolean" ? isOpeningBalanceLocked : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        ...closedAtUpdate,
        ...lockedAtUpdate,
      },
    });
    return NextResponse.json(fiscalYear);
  } catch (err) {
    return NextResponse.json({ error: describeFiscalYearError(err) }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const { id } = await params;
  const fiscalYearId = Number(id);

  const existing = await prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, companyId: ctx.companyId } });
  if (!existing) return NextResponse.json({ error: "Fiscal year not found." }, { status: 404 });

  // A company always needs a current year for the header switcher and for
  // recording opening balances — refuse to delete it out from under that,
  // same spirit as Branch refusing to delete a company's only branch.
  if (existing.isCurrent) {
    return NextResponse.json(
      { error: "Cannot delete the current fiscal year. Set another year as current first." },
      { status: 409 }
    );
  }

  // Dependent-record guard. OpeningBalance and StockOpeningBalance both
  // carry a NOT NULL fiscalYearId with onDelete: Restrict, so deleting a
  // fiscal year that has any of them would fail at the database anyway —
  // this reports which, same pattern as Branch's delete guard.
  const [openingBalances, stockOpeningBalances] = await Promise.all([
    prisma.openingBalance.count({ where: { fiscalYearId } }),
    prisma.stockOpeningBalance.count({ where: { fiscalYearId } }),
  ]);

  const blockers = [
    { label: "opening balance", plural: "opening balances", count: openingBalances },
    { label: "stock opening balance", plural: "stock opening balances", count: stockOpeningBalances },
  ].filter((b) => b.count > 0);

  if (blockers.length > 0) {
    const summary = blockers.map((b) => `${b.count} ${b.count === 1 ? b.label : b.plural}`).join(", ");
    return NextResponse.json(
      { error: `Cannot delete: this fiscal year still has ${summary}. Deactivate it instead.` },
      { status: 409 }
    );
  }

  try {
    await prisma.fiscalYear.delete({ where: { id: fiscalYearId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete fiscal year.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
