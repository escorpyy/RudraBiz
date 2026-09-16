import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { describeFiscalYearError } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

/**
 * Fiscal years are scoped to the selected company like every other master.
 * Also feeds the header switcher's fiscal-year dropdown (`/api/context`)
 * and every OpeningBalance/StockOpeningBalance flow that requires a
 * fiscal year to be selected — this is the only place one can be created.
 */
export async function GET() {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const fiscalYears = await prisma.fiscalYear.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { openingBalances: true, stockOpeningBalances: true } } },
  });
  return NextResponse.json(fiscalYears);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { code, startDate, endDate, isCurrent, isActive } = body ?? {};

  if (!code?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: "Code, Start Date, and End Date are required." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Start Date and End Date must be valid dates." }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "End Date must be after Start Date." }, { status: 400 });
  }

  try {
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        companyId: ctx.companyId,
        code: code.trim(),
        startDate: start,
        endDate: end,
        // A brand-new fiscal year is never created already closed or
        // locked — those only happen via an explicit edit later, once
        // opening balances actually exist to close/lock.
        isCurrent: Boolean(isCurrent),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(fiscalYear, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: describeFiscalYearError(err) }, { status: 409 });
  }
}
