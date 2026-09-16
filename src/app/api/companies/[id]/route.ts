import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
    include: {
      branches: { orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }] },
      fiscalYears: { orderBy: { startDate: "desc" } },
      _count: {
        select: {
          branches: true,
          fiscalYears: true,
          accountGroups: true,
          generalLedgers: true,
          parties: true,
          products: true,
        },
      },
    },
  });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  // Optional-text fields collapse "" to null so clearing a field in the form
  // stores NULL rather than an empty string; `undefined` still means
  // "not supplied", which is what bulk PATCH from the table relies on.
  const optional = (value: unknown) =>
    value === undefined ? undefined : typeof value === "string" && value.trim() ? value.trim() : null;

  try {
    const company = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        code: code?.trim() || undefined,
        name: name?.trim() || undefined,
        legalName: optional(legalName),
        businessType: businessType || undefined,
        registrationNo: optional(registrationNo),
        panNo: optional(panNo),
        vatNo: optional(vatNo),
        isVatRegistered: typeof isVatRegistered === "boolean" ? isVatRegistered : undefined,
        taxOfficeName: optional(taxOfficeName),
        address: optional(address),
        city: optional(city),
        district: optional(district),
        province: optional(province),
        country: optional(country),
        phone: optional(phone),
        email: optional(email),
        website: optional(website),
        baseCurrency: baseCurrency?.trim() || undefined,
        defaultCalendarPref: defaultCalendarPref || undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
    });
    return NextResponse.json(company);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "A company with that code already exists." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Failed to update company.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = Number(id);

  const existing = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dependent-record guard, same convention as account-groups blocking on
  // sub-groups — but a company sits at the root of the tenant tree, so the
  // guard counts every kind of record hanging off it and names what's in the
  // way. Without this the delete would fail anyway (the FKs are
  // onDelete: Restrict), just with an opaque database error.
  const [
    accountGroups,
    generalLedgers,
    parties,
    products,
    fiscalYears,
    journalVouchers,
    cashBankVouchers,
    openingBalances,
  ] = await Promise.all([
    prisma.accountGroup.count({ where: { companyId } }),
    prisma.generalLedger.count({ where: { companyId } }),
    prisma.party.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId } }),
    prisma.fiscalYear.count({ where: { companyId } }),
    prisma.journalVoucher.count({ where: { companyId } }),
    prisma.cashBankVoucher.count({ where: { companyId } }),
    prisma.openingBalance.count({ where: { companyId } }),
  ]);

  const blockers = [
    { label: "account group", plural: "account groups", count: accountGroups },
    { label: "general ledger", plural: "general ledgers", count: generalLedgers },
    { label: "party", plural: "parties", count: parties },
    { label: "product", plural: "products", count: products },
    { label: "fiscal year", plural: "fiscal years", count: fiscalYears },
    { label: "journal voucher", plural: "journal vouchers", count: journalVouchers },
    { label: "cash/bank voucher", plural: "cash/bank vouchers", count: cashBankVouchers },
    { label: "opening balance", plural: "opening balances", count: openingBalances },
  ].filter((b) => b.count > 0);

  if (blockers.length > 0) {
    const summary = blockers
      .map((b) => `${b.count} ${b.count === 1 ? b.label : b.plural}`)
      .join(", ");
    return NextResponse.json(
      {
        error: `Cannot delete: this company still has ${summary}. Deactivate it instead, or remove those records first.`,
      },
      { status: 409 }
    );
  }

  try {
    // Branches and user access rows are the company's own scaffolding rather
    // than accounting data, so they're removed with it. Everything that
    // would actually lose meaning was already rejected above.
    await prisma.$transaction(async (tx) => {
      await tx.userCompanyAccess.deleteMany({ where: { companyId } });
      await tx.branch.deleteMany({ where: { companyId } });
      await tx.company.delete({ where: { id: companyId } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete company.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
