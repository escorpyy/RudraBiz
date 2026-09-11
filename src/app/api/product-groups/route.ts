import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Feeds the cascading Product Group -> Product Sub-Group picker on the
// Product form, the same way /api/account-groups feeds the Account Group ->
// Sub-Group picker on the Party/GL forms. There is no Product Group Master
// UI yet, so this route (and product-sub-groups' presence as a nested
// relation here) is currently only a read source, not a full master.
export async function GET() {
  const groups = await prisma.productGroup.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    include: { subGroups: { where: { isActive: true }, orderBy: { code: "asc" } } },
  });
  return NextResponse.json(groups);
}
