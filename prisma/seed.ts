import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const groups = [
  {
    code: "G-1000",
    name: "Current Assets",
    accountType: "ASSETS" as const,
    description: "Assets expected to be realized within 12 months",
    order: 1,
    subGroups: ["Cash & Bank", "Accounts Receivable", "Inventory", "Prepaid Expenses", "Short-term Investments"],
  },
  {
    code: "G-2000",
    name: "Non Current Assets",
    accountType: "ASSETS" as const,
    description: "Long term assets not expected to be realized within 12 months",
    order: 2,
    subGroups: ["Property, Plant & Equipment", "Intangible Assets", "Long-term Investments", "Deferred Tax Assets"],
  },
  {
    code: "G-3000",
    name: "Current Liabilities",
    accountType: "LIABILITIES" as const,
    description: "Obligations due within 12 months",
    order: 3,
    subGroups: ["Accounts Payable", "Short-term Loans", "Accrued Expenses", "Taxes Payable"],
  },
  {
    code: "G-4000",
    name: "Non Current Liabilities",
    accountType: "LIABILITIES" as const,
    description: "Obligations due after 12 months",
    order: 4,
    subGroups: ["Long-term Loans", "Deferred Tax Liabilities", "Bonds Payable"],
  },
  {
    code: "G-5000",
    name: "Capital",
    accountType: "CAPITAL" as const,
    description: "Owner's equity in the business",
    order: 5,
    subGroups: ["Share Capital", "Retained Earnings"],
  },
  {
    code: "G-6000",
    name: "Income",
    accountType: "INCOME" as const,
    description: "Income earned from operations and other sources",
    order: 6,
    subGroups: ["Sales Revenue", "Service Revenue", "Interest Income", "Other Income", "Rental Income", "Commission Income"],
  },
  {
    code: "G-7000",
    name: "Direct Expenses",
    accountType: "EXPENSES" as const,
    description: "Costs directly related to operations",
    order: 7,
    subGroups: ["Cost of Goods Sold", "Direct Labor", "Manufacturing Overhead", "Freight & Shipping"],
  },
  {
    code: "G-8000",
    name: "Indirect Expenses",
    accountType: "EXPENSES" as const,
    description: "Costs not directly related to operations",
    order: 8,
    subGroups: ["Salaries & Wages", "Rent & Utilities", "Office Supplies", "Marketing & Advertising"],
  },
];

async function main() {
  for (const g of groups) {
    const created = await prisma.accountGroup.upsert({
      where: { code: g.code },
      update: {},
      create: {
        code: g.code,
        name: g.name,
        accountType: g.accountType,
        description: g.description,
        order: g.order,
      },
    });

    for (const [i, sgName] of g.subGroups.entries()) {
      const subGroup = await prisma.subGroup.upsert({
        where: { code: `${g.code}-${i + 1}` },
        update: {},
        create: {
          code: `${g.code}-${i + 1}`,
          name: sgName,
          order: i + 1,
          accountGroupId: created.id,
        },
      });

      // A couple of sample ledgers per sub-group so counts are non-zero.
      await prisma.ledger.upsert({
        where: { code: `${subGroup.code}-L1` },
        update: {},
        create: { code: `${subGroup.code}-L1`, name: `${sgName} - Ledger 1`, subGroupId: subGroup.id },
      });
      await prisma.ledger.upsert({
        where: { code: `${subGroup.code}-L2` },
        update: {},
        create: { code: `${subGroup.code}-L2`, name: `${sgName} - Ledger 2`, subGroupId: subGroup.id },
      });
    }
  }
}

async function seedGeneralLedgers() {
  const currentAssets = await prisma.accountGroup.findUnique({ where: { code: "G-1000" } });
  const currentLiabilities = await prisma.accountGroup.findUnique({ where: { code: "G-3000" } });
  if (!currentAssets || !currentLiabilities) return;

  const cashBank = await prisma.accountSubGroup.upsert({
    where: { code: "ASG-1000" },
    update: {},
    create: { code: "ASG-1000", name: "Cash & Bank", accountGroupId: currentAssets.id },
  });
  const receivables = await prisma.accountSubGroup.upsert({
    where: { code: "ASG-1001" },
    update: {},
    create: { code: "ASG-1001", name: "Accounts Receivable", accountGroupId: currentAssets.id },
  });
  const payables = await prisma.accountSubGroup.upsert({
    where: { code: "ASG-3000" },
    update: {},
    create: { code: "ASG-3000", name: "Accounts Payable", accountGroupId: currentLiabilities.id },
  });

  await prisma.generalLedger.upsert({
    where: { code: "GL-1000" },
    update: {},
    create: {
      code: "GL-1000",
      name: "Cash in Hand",
      accountSubGroupId: cashBank.id,
      normalBalance: "DEBIT",
      glType: "CASH",
      isCashOrBank: true,
      postsToCashBook: true,
    },
  });
  await prisma.generalLedger.upsert({
    where: { code: "GL-1001" },
    update: {},
    create: {
      code: "GL-1001",
      name: "Bank Account - NIC Asia",
      accountSubGroupId: cashBank.id,
      normalBalance: "DEBIT",
      glType: "BANK",
      isCashOrBank: true,
      postsToCashBook: true,
    },
  });
  await prisma.generalLedger.upsert({
    where: { code: "GL-1100" },
    update: {},
    create: {
      code: "GL-1100",
      name: "Trade Debtors",
      accountSubGroupId: receivables.id,
      normalBalance: "DEBIT",
      glType: "RECEIVABLE",
      requiresSubLedger: true,
    },
  });
  await prisma.generalLedger.upsert({
    where: { code: "GL-3000" },
    update: {},
    create: {
      code: "GL-3000",
      name: "Trade Creditors",
      accountSubGroupId: payables.id,
      normalBalance: "CREDIT",
      glType: "PAYABLE",
      requiresSubLedger: true,
    },
  });
}

main()
  .then(seedGeneralLedgers)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
