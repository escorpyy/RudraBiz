import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GLType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Party has no name of its own — it's a detail profile hung off a
// GeneralLedger, so the display name comes from there. This minimal shape
// (id/code/name) is what dropdowns elsewhere (e.g. the Sub-Ledger form)
// consume; the full Party Master list page queries prisma directly instead.
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

const PARTY_GL_TYPES: GLType[] = ["CUSTOMER", "VENDOR", "BOTH"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    code,
    name,
    accountSubGroupId,
    glType,
    address,
    city,
    state,
    country,
    phone,
    mobile,
    email,
    contactPerson,
    panNo,
    isVatRegistered,
    subAreaId,
    agentId,
    isActive,
    creditLimit,
    creditDays,
    paymentTermDays,
  } = body ?? {};

  if (!code || !name || !accountSubGroupId) {
    return NextResponse.json(
      { error: "Ledger Code, Ledger Name, and Account Sub-Group are required." },
      { status: 400 }
    );
  }
  if (!PARTY_GL_TYPES.includes(glType)) {
    return NextResponse.json(
      { error: "GL Type must be CUSTOMER, VENDOR, or BOTH for a Party." },
      { status: 400 }
    );
  }

  try {
    const subGroup = await prisma.accountSubGroup.findUnique({
      where: { id: Number(accountSubGroupId) },
      include: { accountGroup: true },
    });
    if (!subGroup) {
      return NextResponse.json({ error: "Account sub-group not found." }, { status: 400 });
    }
    // Same rule as the General Ledger API: normal balance follows the
    // account type of the group the ledger sits under.
    const normalBalance: "DEBIT" | "CREDIT" =
      subGroup.accountGroup.type === "ASSET" || subGroup.accountGroup.type === "EXPENSE"
        ? "DEBIT"
        : "CREDIT";

    const party = await prisma.$transaction(async (tx) => {
      const generalLedger = await tx.generalLedger.create({
        data: {
          code,
          name,
          accountSubGroupId: Number(accountSubGroupId),
          normalBalance,
          glType,
          isActive: typeof isActive === "boolean" ? isActive : true,
        },
      });

      const created = await tx.party.create({
        data: {
          generalLedgerId: generalLedger.id,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
          phone: phone || null,
          mobile: mobile || null,
          email: email || null,
          contactPerson: contactPerson || null,
          panNo: panNo || null,
          isVatRegistered: Boolean(isVatRegistered),
          subAreaId: subAreaId ? Number(subAreaId) : null,
          agentId: agentId ? Number(agentId) : null,
        },
      });

      if (glType === "CUSTOMER" || glType === "BOTH") {
        await tx.customerDetail.create({
          data: {
            partyId: created.id,
            creditLimit: creditLimit ? Number(creditLimit) : null,
            creditDays: creditDays ? Number(creditDays) : null,
          },
        });
      }
      if (glType === "VENDOR" || glType === "BOTH") {
        await tx.vendorDetail.create({
          data: {
            partyId: created.id,
            paymentTermDays: paymentTermDays ? Number(paymentTermDays) : null,
          },
        });
      }

      return created;
    });

    return NextResponse.json(party, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create party.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

