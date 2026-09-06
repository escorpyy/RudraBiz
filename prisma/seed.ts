import { PrismaClient, AccountType, NormalBalance } from "@prisma/client";

const prisma = new PrismaClient();

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
  for (const g of groups) {
    const createdGroup = await prisma.accountGroup.upsert({
      where: { code: g.code },
      update: {},
      create: {
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
      await prisma.generalLedger.upsert({
        where: { code: `${subGroup.code}-L1` },
        update: {},
        create: {
          code: `${subGroup.code}-L1`,
          name: `${sgDescription} - Ledger 1`,
          accountSubGroupId: subGroup.id,
          normalBalance,
        },
      });
      await prisma.generalLedger.upsert({
        where: { code: `${subGroup.code}-L2` },
        update: {},
        create: {
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
