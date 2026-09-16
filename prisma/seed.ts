import { PrismaClient, AccountType, NormalBalance } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// COMPANY / BRANCH / USER / FISCAL YEAR
// The multi-tenant migration's own default-data step already leaves
// behind a bare-bones "MAIN" company with one "HO" branch (so every
// NOT NULL companyId/branchId column has something to backfill
// against even on a database that had no Company row at all). This
// seed just upserts onto that same company/branch and fills them out
// with real demo data, then adds a second branch, a fiscal year, a
// demo user, and that user's access grant — the pieces the migration
// intentionally leaves for the app layer to set up.
// ============================================================

async function seedCompanySetup() {
  const company = await prisma.company.upsert({
    where: { code: "MAIN" },
    update: {
      name: "Acme Traders Pvt. Ltd.",
      legalName: "Acme Traders Private Limited",
      businessType: "PRIVATE_LIMITED",
      registrationNo: "REG-2082-00123",
      panNo: "600123456",
      isVatRegistered: true,
      vatNo: "600123456",
      taxOfficeName: "Inland Revenue Office, Kathmandu",
      address: "New Baneshwor",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      country: "Nepal",
      phone: "01-4444444",
      email: "info@acmetraders.example",
      baseCurrency: "NPR",
      defaultCalendarPref: "BS",
      isActive: true,
    },
    create: {
      code: "MAIN",
      name: "Acme Traders Pvt. Ltd.",
      legalName: "Acme Traders Private Limited",
      businessType: "PRIVATE_LIMITED",
      registrationNo: "REG-2082-00123",
      panNo: "600123456",
      isVatRegistered: true,
      vatNo: "600123456",
      taxOfficeName: "Inland Revenue Office, Kathmandu",
      address: "New Baneshwor",
      city: "Kathmandu",
      district: "Kathmandu",
      province: "Bagmati",
      country: "Nepal",
      phone: "01-4444444",
      email: "info@acmetraders.example",
      baseCurrency: "NPR",
      defaultCalendarPref: "BS",
    },
  });

  const headOffice = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: "HO" } },
    update: {
      name: "Head Office",
      isHeadOffice: true,
      address: "New Baneshwor, Kathmandu",
      phone: "01-4444444",
      email: "ho@acmetraders.example",
    },
    create: {
      companyId: company.id,
      code: "HO",
      name: "Head Office",
      isHeadOffice: true,
      address: "New Baneshwor, Kathmandu",
      phone: "01-4444444",
      email: "ho@acmetraders.example",
    },
  });

  // A second branch so the header switcher has something real to
  // switch between (not just "Head Office" / "All Branches").
  const pokharaBranch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: "PKR" } },
    update: { name: "Pokhara Branch" },
    create: {
      companyId: company.id,
      code: "PKR",
      name: "Pokhara Branch",
      isHeadOffice: false,
      address: "Lakeside, Pokhara",
      phone: "061-555555",
      email: "pokhara@acmetraders.example",
    },
  });

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { companyId_code: { companyId: company.id, code: "2082/083" } },
    update: { isCurrent: true },
    create: {
      companyId: company.id,
      code: "2082/083",
      startDate: new Date("2025-07-17"),
      endDate: new Date("2026-07-16"),
      isCurrent: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@acmetraders.example" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@acmetraders.example",
      calendarPreference: "BS",
    },
  });

  // Grant with branchId = null, i.e. "All Branches" for this company —
  // not scoped to just the head office.
  await prisma.userCompanyAccess.upsert({
    where: {
      userId_companyId_branchId: {
        userId: adminUser.id,
        companyId: company.id,
        branchId: null,
      },
    },
    update: { role: "ADMIN", isActive: true },
    create: {
      userId: adminUser.id,
      companyId: company.id,
      branchId: null,
      role: "ADMIN",
      isActive: true,
    },
  });

  return { company, headOffice, pokharaBranch, fiscalYear, adminUser };
}

// Every group's natural (normal) balance side, used for the ledgers
// created under it: asset/expense accounts increase on debit,
// liability/equity/revenue accounts increase on credit.
const NORMAL_BALANCE: Record<AccountType, NormalBalance> = {
  ASSET: "DEBIT",
  EXPENSE: "DEBIT",
  LIABILITY: "CREDIT",
  EQUITY: "CREDIT",
  REVENUE: "CREDIT",
};

const groups = [
  {
    code: "G-1000",
    description: "Current Assets",
    type: "ASSET" as const,
    subGroups: ["Cash & Bank", "Accounts Receivable", "Inventory", "Prepaid Expenses", "Short-term Investments"],
  },
  {
    code: "G-2000",
    description: "Non Current Assets",
    type: "ASSET" as const,
    subGroups: ["Property, Plant & Equipment", "Intangible Assets", "Long-term Investments", "Deferred Tax Assets"],
  },
  {
    code: "G-3000",
    description: "Current Liabilities",
    type: "LIABILITY" as const,
    subGroups: ["Accounts Payable", "Short-term Loans", "Accrued Expenses", "Taxes Payable"],
  },
  {
    code: "G-4000",
    description: "Non Current Liabilities",
    type: "LIABILITY" as const,
    subGroups: ["Long-term Loans", "Deferred Tax Liabilities", "Bonds Payable"],
  },
  {
    code: "G-5000",
    description: "Capital",
    type: "EQUITY" as const,
    subGroups: ["Share Capital", "Retained Earnings"],
  },
  {
    code: "G-6000",
    description: "Income",
    type: "REVENUE" as const,
    subGroups: ["Sales Revenue", "Service Revenue", "Interest Income", "Other Income", "Rental Income", "Commission Income"],
  },
  {
    code: "G-7000",
    description: "Direct Expenses",
    type: "EXPENSE" as const,
    subGroups: ["Cost of Goods Sold", "Direct Labor", "Manufacturing Overhead", "Freight & Shipping"],
  },
  {
    code: "G-8000",
    description: "Indirect Expenses",
    type: "EXPENSE" as const,
    subGroups: ["Salaries & Wages", "Rent & Utilities", "Office Supplies", "Marketing & Advertising"],
  },
];

async function main() {
  const { company } = await seedCompanySetup();

  for (const g of groups) {
    const createdGroup = await prisma.accountGroup.upsert({
      where: { companyId_code: { companyId: company.id, code: g.code } },
      update: {},
      create: {
        companyId: company.id,
        code: g.code,
        description: g.description,
        type: g.type,
      },
    });

    const normalBalance = NORMAL_BALANCE[g.type];

    for (const [i, sgDescription] of g.subGroups.entries()) {
      const subGroupCode = `${g.code}-${i + 1}`;
      const subGroup = await prisma.accountSubGroup.upsert({
        where: { accountGroupId_code: { accountGroupId: createdGroup.id, code: subGroupCode } },
        update: {},
        create: {
          code: subGroupCode,
          description: sgDescription,
          accountGroupId: createdGroup.id,
        },
      });

      // A couple of sample ledgers per sub-group so counts are non-zero.
      // companyId is passed here to satisfy the required field on the
      // create input, but the trg_sync_gl_company trigger derives the
      // real stored value from accountSubGroupId's own AccountGroup
      // and overwrites whatever's sent — same as the create-ledger API
      // will rely on it to do, so a caller can never desync the two.
      await prisma.generalLedger.upsert({
        where: { companyId_code: { companyId: company.id, code: `${subGroup.code}-L1` } },
        update: {},
        create: {
          companyId: company.id,
          code: `${subGroup.code}-L1`,
          name: `${sgDescription} - Ledger 1`,
          accountSubGroupId: subGroup.id,
          normalBalance,
        },
      });
      await prisma.generalLedger.upsert({
        where: { companyId_code: { companyId: company.id, code: `${subGroup.code}-L2` } },
        update: {},
        create: {
          companyId: company.id,
          code: `${subGroup.code}-L2`,
          name: `${sgDescription} - Ledger 2`,
          accountSubGroupId: subGroup.id,
          normalBalance,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
