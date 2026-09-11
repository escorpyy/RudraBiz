import {
  Layers,
  Receipt,
  Landmark,
  BookOpen,
  Network,
  Database,
  Package,
  FileBarChart2,
  LineChart,
  TrendingUp,
  Wrench,
  SlidersHorizontal,
  Settings,
  type LucideIcon,
} from "lucide-react";


// Matches the "AccountType" enum in prisma/schema.prisma.
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
// UI-only concept, derived from the schema's `isActive` boolean.
export type RecordStatus = "ACTIVE" | "INACTIVE";

// Display label + color tokens for each account type badge/icon, used on
// both the list table pills and the form's account type dropdown.
export const ACCOUNT_TYPES: Record<
  AccountType,
  { label: string; badge: string; dot: string }
> = {
  ASSET: { label: "Asset", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  LIABILITY: { label: "Liability", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  EQUITY: { label: "Equity", badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  REVENUE: { label: "Revenue", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  EXPENSE: { label: "Expense", badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

export const ACCOUNT_TYPE_LIST = Object.keys(ACCOUNT_TYPES) as AccountType[];

// Matches the "NormalBalance" enum in prisma/schema.prisma.
export type NormalBalance = "DEBIT" | "CREDIT";

export const NORMAL_BALANCES: Record<NormalBalance, { label: string; badge: string }> = {
  DEBIT: { label: "Debit", badge: "bg-blue-50 text-blue-700" },
  CREDIT: { label: "Credit", badge: "bg-violet-50 text-violet-700" },
};

export const NORMAL_BALANCE_LIST = Object.keys(NORMAL_BALANCES) as NormalBalance[];

// Matches the "GLType" enum in prisma/schema.prisma.
export type GLType = "CUSTOMER" | "VENDOR" | "BOTH" | "OTHER";

export const GL_TYPES: Record<GLType, { label: string; badge: string }> = {
  CUSTOMER: { label: "Customer", badge: "bg-emerald-50 text-emerald-700" },
  VENDOR: { label: "Vendor", badge: "bg-amber-50 text-amber-700" },
  BOTH: { label: "Both", badge: "bg-sky-50 text-sky-700" },
  OTHER: { label: "Other", badge: "bg-slate-100 text-slate-600" },
};

export const GL_TYPE_LIST = Object.keys(GL_TYPES) as GLType[];

export const STATUS_STYLES: Record<RecordStatus, { label: string; badge: string; dot: string }> = {
  ACTIVE: { label: "Active", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  INACTIVE: { label: "Inactive", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

// Matches the "ProductType" enum in prisma/schema.prisma.
export type ProductType = "STOCK" | "NON_STOCK" | "SERVICE" | "FIXED_ASSET" | "BUNDLE";

export const PRODUCT_TYPES: Record<ProductType, { label: string; badge: string; dot: string }> = {
  STOCK: { label: "Stock", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  NON_STOCK: { label: "Non-Stock", badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  SERVICE: { label: "Service", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  FIXED_ASSET: { label: "Fixed Asset", badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  BUNDLE: { label: "Bundle", badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

export const PRODUCT_TYPE_LIST = Object.keys(PRODUCT_TYPES) as ProductType[];

// Matches the "ValuationMethod" enum in prisma/schema.prisma.
export type ValuationMethod = "FIFO" | "WEIGHTED_AVERAGE" | "STANDARD_COST";

export const VALUATION_METHODS: Record<ValuationMethod, { label: string }> = {
  FIFO: { label: "FIFO" },
  WEIGHTED_AVERAGE: { label: "Weighted Average" },
  STANDARD_COST: { label: "Standard Cost" },
};

// Matches the "DepreciationMethod" enum in prisma/schema.prisma.
export type DepreciationMethod = "STRAIGHT_LINE" | "WRITTEN_DOWN_VALUE";

export const DEPRECIATION_METHODS: Record<DepreciationMethod, { label: string }> = {
  STRAIGHT_LINE: { label: "Straight Line" },
  WRITTEN_DOWN_VALUE: { label: "Written Down Value" },
};

// Sidebar navigation tree. A node with `children` renders as a collapsible
// section; a leaf has `href` and links directly. Nesting can go to any depth
// (see "Inventory Reports" below, which nests a third level under Inventory).
export type NavLeaf = { label: string; href: string };
export type NavNode = { label: string; icon?: LucideIcon; children: (NavNode | NavLeaf)[] };

function isNavNode(item: NavNode | NavLeaf): item is NavNode {
  return "children" in item;
}
export { isNavNode };

export const NAV_ITEMS: NavNode[] = [
  {
    label: "Master",
    icon: Database,
    children: [
      { label: "Ledger Master", href: "/master/ledgers" },
      { label: "Sub-Ledger Master", href: "/master/sub-ledgers" },
      { label: "Party Master", href: "/master/parties" },
      { label: "Account Group Master", href: "/account-groups" },
      { label: "Account Sub-Group Master", href: "/sub-groups" },
      { label: "Product Master", href: "/master/products" },
      { label: "Bill Terms Master", href: "/master/bill-terms" },
      { label: "Area Master", href: "/master/areas" },
      { label: "Agent Master", href: "/master/agents" },
      { label: "Narration Master", href: "/master/narrations" },
      { label: "Opening Balance Master", href: "/master/opening-balance" },
    ],
  },
  {
    label: "Transactions",
    icon: Receipt,
    children: [
      { label: "Cash / Bank Voucher", href: "/transactions/cash-bank-voucher" },
      { label: "Journal Voucher", href: "/transactions/journal-voucher" },
      { label: "Purchase", href: "/transactions/purchase" },
      { label: "Sales", href: "/transactions/sales" },
      { label: "Debit Note", href: "/transactions/debit-note" },
      { label: "Credit Note", href: "/transactions/credit-note" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Stock Receipt", href: "/inventory/stock-receipt" },
      { label: "Stock Issue", href: "/inventory/stock-issue" },
      { label: "Stock Transfer", href: "/inventory/stock-transfer" },
      { label: "Stock Adjustment", href: "/inventory/stock-adjustment" },
      { label: "Stock Opening", href: "/inventory/stock-opening" },
      { label: "Stock Consumption", href: "/inventory/stock-consumption" },
      { label: "Stock Production", href: "/inventory/stock-production" },
      { label: "Physical Stock", href: "/inventory/physical-stock" },
    ],
  },
   
  {
    label: "Reports",
    icon: FileBarChart2,
    children: [
      { label: "Cash Reports", href: "/reports/cash" },
      { label: "Bank Reports", href: "/reports/bank" },
      { label: "Journal Reports", href: "/reports/journal" },
      { label: "Purchase Reports", href: "/reports/purchase" },
      { label: "Sales Reports", href: "/reports/sales" },
      { label: "Debit Note Reports", href: "/reports/debit-note" },
      { label: "Credit Note Reports", href: "/reports/credit-note" },
      { label: "Receipt / Payment Reports", href: "/reports/receipt-payment" },
      { label: "Outstanding Reports", href: "/reports/outstanding" },
      { label: "Ageing Reports", href: "/reports/ageing" },
    ],
  },
  {
        label: "Inventory Reports",
		icon: FileBarChart2,
        children: [
          { label: "Stock Ledger", href: "/inventory/reports/stock-ledger" },
          { label: "Stock Summary", href: "/inventory/reports/stock-summary" },
          { label: "Stock Valuation", href: "/inventory/reports/stock-valuation" },
          { label: "Stock Movement", href: "/inventory/reports/stock-movement" },
          { label: "Stock Aging", href: "/inventory/reports/stock-aging" },
          { label: "Slow / Fast Moving Items", href: "/inventory/reports/slow-fast-moving-items" },
          { label: "Stock Adjustment Report", href: "/inventory/reports/stock-adjustment-report" },
        ],
      },
  {
    label: "FS — Financial Statements",
    icon: Landmark,
    children: [
      { label: "Ledgers", href: "/financial-statements/ledgers" },
      { label: "Trial Balance", href: "/financial-statements/trial-balance" },
      { label: "Income Statement", href: "/financial-statements/income-statement" },
      { label: "Balance Sheet", href: "/financial-statements/balance-sheet" },
      { label: "Cash Flow Statement", href: "/financial-statements/cash-flow" },
      { label: "Statement of Changes in Owner's Equity", href: "/financial-statements/owners-equity" },
    ],
  },
  {
    label: "Analysis",
    icon: LineChart,
    children: [
      { label: "Dashboard", href: "/analysis/dashboard" },
      { label: "Profitability Analysis", href: "/analysis/profitability" },
      { label: "Sales Analysis", href: "/analysis/sales" },
      { label: "Purchase Analysis", href: "/analysis/purchase" },
      { label: "Expense Analysis", href: "/analysis/expense" },
      { label: "Cash & Bank Analysis", href: "/analysis/cash-bank" },
      { label: "Working Capital", href: "/analysis/working-capital" },
      { label: "Ratio Analysis", href: "/analysis/ratio" },
      { label: "Budget & Variance", href: "/analysis/budget-variance" },
    ],
  },
  {
    label: "FM Analysis",
    icon: TrendingUp,
    children: [
      { label: "Financial Dashboard", href: "/fm-analysis/financial-dashboard" },
      { label: "Financial Performance", href: "/fm-analysis/financial-performance" },
      { label: "Revenue Analysis", href: "/fm-analysis/revenue" },
      { label: "Gross Profit Analysis", href: "/fm-analysis/gross-profit" },
      { label: "Net Profit Analysis", href: "/fm-analysis/net-profit" },
      { label: "Expense Analysis", href: "/fm-analysis/expense" },
      { label: "Profit Margin Analysis", href: "/fm-analysis/profit-margin" },
      { label: "Cash Flow Analysis", href: "/fm-analysis/cash-flow" },
      { label: "Working Capital Analysis", href: "/fm-analysis/working-capital" },
      { label: "Liquidity Analysis", href: "/fm-analysis/liquidity" },
      { label: "Solvency Analysis", href: "/fm-analysis/solvency" },
      { label: "Efficiency Analysis", href: "/fm-analysis/efficiency" },
      { label: "Receivable Analysis", href: "/fm-analysis/receivable" },
      { label: "Payable Analysis", href: "/fm-analysis/payable" },
      { label: "Inventory Financial Analysis", href: "/fm-analysis/inventory-financial" },
      { label: "Financial Ratios", href: "/fm-analysis/financial-ratios" },
      { label: "Budget vs Actual", href: "/fm-analysis/budget-vs-actual" },
      { label: "Period Comparison", href: "/fm-analysis/period-comparison" },
      { label: "Financial Trends", href: "/fm-analysis/financial-trends" },
    ],
  },
  {
    label: "Housekeep",
    icon: Wrench,
    children: [
      { label: "Data Maintenance", href: "/housekeep/data-maintenance" },
      { label: "Period Management", href: "/housekeep/period-management" },
      { label: "Data Verification", href: "/housekeep/data-verification" },
      { label: "Reconciliation", href: "/housekeep/reconciliation" },
      { label: "Audit Trail", href: "/housekeep/audit-trail" },
      { label: "Backup & Recovery", href: "/housekeep/backup-recovery" },
      { label: "Cleanup", href: "/housekeep/cleanup" },
    ],
  },
  {
    label: "Setup",
    icon: SlidersHorizontal,
    children: [
      { label: "Company", href: "/setup/company" },
      { label: "Financial Year", href: "/setup/financial-year" },
      { label: "Accounting", href: "/setup/accounting" },
      { label: "Chart of Accounts", href: "/setup/chart-of-accounts" },
      { label: "Tax", href: "/setup/tax" },
      { label: "Voucher Configuration", href: "/setup/voucher-configuration" },
      { label: "Inventory Setup", href: "/setup/inventory" },
      { label: "Sales & Purchase", href: "/setup/sales-purchase" },
      { label: "Receivable & Payable", href: "/setup/receivable-payable" },
      { label: "Document Setup", href: "/setup/documents" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "User & Access", href: "/settings/user-access" },
      { label: "Application Preferences", href: "/settings/preferences" },
      { label: "Localization", href: "/settings/localization" },
      { label: "Appearance", href: "/settings/appearance" },
      { label: "Notifications", href: "/settings/notifications" },
      { label: "Security", href: "/settings/security" },
      { label: "Email & Communication", href: "/settings/email-communication" },
      { label: "Integrations", href: "/settings/integrations" },
      { label: "Import / Export", href: "/settings/import-export" },
      { label: "System", href: "/settings/system" },
    ],
  },
];


// Icons + colors for the three summary stat cards and the hierarchy diagram.
export const HIERARCHY_STEPS = [
  {
    label: "Account Type",
    example: "(Asset, Liability, Equity, Revenue, Expense)",
    icon: Layers,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Account Group",
    example: "(e.g. Current Assets)",
    icon: Network,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    label: "Sub-Group",
    example: "(e.g. Inventory)",
    icon: Network,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    label: "Ledger",
    example: "(e.g. ABC Company)",
    icon: BookOpen,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
];
