import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/companyContext";
import { nextVoucherNumber } from "@/lib/journalVoucher";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await requireCompanyId();
  if (!ctx.ok) return NextResponse.json({ error: "No company selected." }, { status: 400 });

  const branchId = Number(req.nextUrl.searchParams.get("branchId"));
  if (!branchId) return NextResponse.json({ error: "branchId is required." }, { status: 400 });

  const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: ctx.companyId } });
  if (!branch) return NextResponse.json({ error: "Branch not found." }, { status: 400 });

  const voucherNumber = await nextVoucherNumber(prisma, branchId);
  return NextResponse.json({ voucherNumber });
}
