export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyContext, setCompanyContext } from "@/lib/companyContext";

async function buildResponsePayload(companyId: number | null, branchId: number | null, fiscalYearId: number | null) {
  const [companies, branches, fiscalYears] = await Promise.all([
    prisma.company.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    companyId
      ? prisma.branch.findMany({ where: { companyId, isActive: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    companyId
      ? prisma.fiscalYear.findMany({ where: { companyId }, orderBy: { startDate: "desc" } })
      : Promise.resolve([]),
  ]);

  return {
    companies,
    branches,
    fiscalYears,
    selected: { companyId, branchId, fiscalYearId },
  };
}

// Returns every active company, the selected company's branches and
// fiscal years, and the current selection — everything the header
// switcher needs to render its three dropdowns in one round trip.
export async function GET() {
  const ctx = await getCompanyContext();
  const payload = await buildResponsePayload(ctx.companyId, ctx.branchId, ctx.fiscalYearId);
  return NextResponse.json(payload);
}

// Body: { companyId?: number, branchId?: number | null, fiscalYearId?: number | null }
// Only the fields provided are changed. Switching companyId without
// also specifying branchId/fiscalYearId resets both to that new
// company's defaults ("All Branches" + its current fiscal year)
// rather than carrying over IDs that belong to the old company.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { companyId, branchId, fiscalYearId } = body ?? {};

  const current = await getCompanyContext();
  const nextCompanyId = typeof companyId === "number" ? companyId : current.companyId;

  if (nextCompanyId === null) {
    return NextResponse.json({ error: "No company selected and none available." }, { status: 400 });
  }

  const company = await prisma.company.findFirst({ where: { id: nextCompanyId, isActive: true } });
  if (!company) {
    return NextResponse.json({ error: "Company not found or inactive." }, { status: 404 });
  }

  const companyChanged = nextCompanyId !== current.companyId;

  let nextBranchId: number | null;
  if (!companyChanged && branchId === undefined) {
    nextBranchId = current.branchId;
  } else if (companyChanged && branchId === undefined) {
    nextBranchId = null; // reset to "All Branches" on the new company
  } else {
    nextBranchId = branchId === null ? null : Number(branchId);
  }

  if (nextBranchId !== null) {
    const branch = await prisma.branch.findFirst({
      where: { id: nextBranchId, companyId: nextCompanyId, isActive: true },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch does not belong to the selected company." }, { status: 400 });
    }
  }

  let nextFiscalYearId: number | null;
  if (!companyChanged && fiscalYearId === undefined) {
    nextFiscalYearId = current.fiscalYearId;
  } else if (fiscalYearId === undefined || fiscalYearId === null) {
    // Either the company changed (need this company's own current FY)
    // or the caller explicitly cleared it — either way, fall back to
    // the new company's current fiscal year.
    const fy = await prisma.fiscalYear.findFirst({ where: { companyId: nextCompanyId, isCurrent: true } });
    nextFiscalYearId = fy?.id ?? null;
  } else {
    const fy = await prisma.fiscalYear.findFirst({ where: { id: Number(fiscalYearId), companyId: nextCompanyId } });
    if (!fy) {
      return NextResponse.json({ error: "Fiscal year does not belong to the selected company." }, { status: 400 });
    }
    nextFiscalYearId = fy.id;
  }

  await setCompanyContext({ companyId: nextCompanyId, branchId: nextBranchId, fiscalYearId: nextFiscalYearId });

  const payload = await buildResponsePayload(nextCompanyId, nextBranchId, nextFiscalYearId);
  return NextResponse.json(payload);
}
