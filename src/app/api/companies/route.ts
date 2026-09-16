import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Unlike every other master in this app, the Company API is deliberately NOT
 * filtered by the header switcher's selected company: this *is* the tenant
 * registry that populates the switcher. Scoping it to the current company
 * would make it impossible to see or create a second one.
 *
 * Access control belongs here once auth exists — today there's no signed-in
 * user, so `UserCompanyAccess` can't be consulted yet. See
 * `src/lib/companyContext.ts` for the same note on the read path.
 */
export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { branches: true, fiscalYears: true } } },
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    code,
    name,
    legalName,
    businessType,
    registrationNo,
    panNo,
    vatNo,
    isVatRegistered,
    taxOfficeName,
    address,
    city,
    district,
    province,
    country,
    phone,
    email,
    website,
    baseCurrency,
    defaultCalendarPref,
    isActive,
  } = body ?? {};

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Company Code and Company Name are required." }, { status: 400 });
  }

  try {
    // A company with no branch can't be used: OpeningBalance and both
    // voucher tables have a NOT NULL branchId, and the switcher needs
    // something to select. So every new company gets a head office in the
    // same transaction, mirroring what the multi-tenant migration does for
    // pre-existing companies.
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          code: code.trim(),
          name: name.trim(),
          legalName: legalName?.trim() || null,
          businessType: businessType || "OTHER",
          registrationNo: registrationNo?.trim() || null,
          panNo: panNo?.trim() || null,
          vatNo: vatNo?.trim() || null,
          isVatRegistered: Boolean(isVatRegistered),
          taxOfficeName: taxOfficeName?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          district: district?.trim() || null,
          province: province?.trim() || null,
          country: country?.trim() || "Nepal",
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          website: website?.trim() || null,
          baseCurrency: baseCurrency?.trim() || "NPR",
          defaultCalendarPref: defaultCalendarPref || "BS",
          isActive: typeof isActive === "boolean" ? isActive : true,
        },
      });

      await tx.branch.create({
        data: {
          companyId: created.id,
          code: "HO",
          name: "Head Office",
          isHeadOffice: true,
          address: created.address,
          phone: created.phone,
          email: created.email,
        },
      });

      return created;
    });

    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A company with that code already exists." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create company." }, { status: 500 });
  }
}
