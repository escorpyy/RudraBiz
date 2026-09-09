import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GLType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PARTY_GL_TYPES: GLType[] = ["CUSTOMER", "VENDOR", "BOTH"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const party = await prisma.party.findUnique({
    where: { id: Number(id) },
    include: {
      generalLedger: { include: { accountSubGroup: { include: { accountGroup: true } } } },
      subArea: { include: { area: true } },
      agent: true,
      customerDetail: true,
      vendorDetail: true,
    },
  });
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(party);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (glType !== undefined && !PARTY_GL_TYPES.includes(glType)) {
    return NextResponse.json(
      { error: "GL Type must be CUSTOMER, VENDOR, or BOTH for a Party." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.party.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const effectiveGlType: GLType = glType ?? (await prisma.generalLedger
      .findUnique({ where: { id: existing.generalLedgerId }, select: { glType: true } })
    )!.glType;

    const party = await prisma.$transaction(async (tx) => {
      await tx.generalLedger.update({
        where: { id: existing.generalLedgerId },
        data: {
          code,
          name,
          accountSubGroupId: accountSubGroupId !== undefined ? Number(accountSubGroupId) : undefined,
          glType,
          isActive,
        },
      });

      const updated = await tx.party.update({
        where: { id: Number(id) },
        data: {
          address: address !== undefined ? address || null : undefined,
          city: city !== undefined ? city || null : undefined,
          state: state !== undefined ? state || null : undefined,
          country: country !== undefined ? country || null : undefined,
          phone: phone !== undefined ? phone || null : undefined,
          mobile: mobile !== undefined ? mobile || null : undefined,
          email: email !== undefined ? email || null : undefined,
          contactPerson: contactPerson !== undefined ? contactPerson || null : undefined,
          panNo: panNo !== undefined ? panNo || null : undefined,
          isVatRegistered: typeof isVatRegistered === "boolean" ? isVatRegistered : undefined,
          subAreaId: subAreaId === null ? null : subAreaId !== undefined ? Number(subAreaId) : undefined,
          agentId: agentId === null ? null : agentId !== undefined ? Number(agentId) : undefined,
        },
      });

      if (effectiveGlType === "CUSTOMER" || effectiveGlType === "BOTH") {
        await tx.customerDetail.upsert({
          where: { partyId: updated.id },
          update: {
            creditLimit: creditLimit !== undefined ? (creditLimit ? Number(creditLimit) : null) : undefined,
            creditDays: creditDays !== undefined ? (creditDays ? Number(creditDays) : null) : undefined,
          },
          create: {
            partyId: updated.id,
            creditLimit: creditLimit ? Number(creditLimit) : null,
            creditDays: creditDays ? Number(creditDays) : null,
          },
        });
      } else {
        await tx.customerDetail.deleteMany({ where: { partyId: updated.id } });
      }

      if (effectiveGlType === "VENDOR" || effectiveGlType === "BOTH") {
        await tx.vendorDetail.upsert({
          where: { partyId: updated.id },
          update: {
            paymentTermDays:
              paymentTermDays !== undefined ? (paymentTermDays ? Number(paymentTermDays) : null) : undefined,
          },
          create: {
            partyId: updated.id,
            paymentTermDays: paymentTermDays ? Number(paymentTermDays) : null,
          },
        });
      } else {
        await tx.vendorDetail.deleteMany({ where: { partyId: updated.id } });
      }

      return updated;
    });

    return NextResponse.json(party);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update party.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partyId = Number(id);

  const subLedgerCount = await prisma.subLedger.count({ where: { partyId } });
  if (subLedgerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${subLedgerCount} sub-ledger(s) reference this party. Reassign or delete them first.` },
      { status: 409 }
    );
  }

  try {
    // Deletes the Party profile (and its CustomerDetail/VendorDetail via
    // cascade) but intentionally leaves the underlying GeneralLedger in
    // place — same convention as the GL API, which refuses to delete a
    // ledger that still has a Party attached. Delete the GL separately
    // from Ledger Master if it's no longer needed.
    await prisma.party.delete({ where: { id: partyId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete party.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
