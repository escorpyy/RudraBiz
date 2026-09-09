import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Party has no name of its own — it's a detail profile hung off a
// GeneralLedger, so the display name comes from there. This route exists
// to feed simple "select a party" dropdowns (e.g. on Sub-Ledger forms)
// until the full Party Master UI is built.
export async function GET() {
  const parties = await prisma.party.findMany({
    orderBy: { generalLedger: { name: "asc" } },
    select: {
      id: true,
      generalLedger: { select: { code: true, name: true } },
    },
  });
  return NextResponse.json(
    parties.map((p) => ({
      id: p.id,
      code: p.generalLedger.code,
      name: p.generalLedger.name,
    }))
  );
}
