import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { describeBranchError } from "@/lib/branch";

export const dynamic = "force-dynamic";

/**
 * Branches are scoped to the selected company like every other master.
 *
 * `companyId` may also be passed explicitly as a query param, which the
 * Company detail page uses to show a company's branches while the switcher
 * is pointed somewhere else — you manage Company B's branches from Company
 * B's page without first switching the whole app over to it.
 */
export async function GET(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const requested = req.nextUrl.searchParams.get("companyId");
  const companyId = requested ? Number(requested) : ctx.companyId;

  if (Number.isNaN(companyId)) {
    return NextResponse.json({ error: "Invalid companyId." }, { status: 400 });
  }

  const branches = await prisma.branch.findMany({
    where: { companyId },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
    include: { _count: { select: { openingBalances: true, journalVouchers: true, cashBankVouchers: true } } },
  });
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const body = await req.json();
  const { companyId: rawCompanyId, code, name, isHeadOffice, address, phone, email, isActive } = body ?? {};

  const companyId = rawCompanyId ? Number(rawCompanyId) : ctx.companyId;

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Branch Code and Branch Name are required." }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 400 });

  try {
    const branch = await prisma.branch.create({
      data: {
        companyId,
        code: code.trim(),
        name: name.trim(),
        isHeadOffice: Boolean(isHeadOffice),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: describeBranchError(err) }, { status: 409 });
  }
}
