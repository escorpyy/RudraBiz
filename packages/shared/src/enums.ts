/**
 * Domain enums. Values are identical to the Postgres enum types, so the
 * Drizzle schema (apps/api) and the UI import the same lists.
 * Display labels / colours stay in the web app — this file is data only.
 */
export const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const NORMAL_BALANCES = ["DEBIT", "CREDIT"] as const;
export type NormalBalance = (typeof NORMAL_BALANCES)[number];

export const GL_TYPES = ["CUSTOMER", "VENDOR", "BOTH", "OTHER"] as const;
export type GLType = (typeof GL_TYPES)[number];

export const CALENDAR_PREFERENCES = ["BS", "AD"] as const;
export type CalendarPreference = (typeof CALENDAR_PREFERENCES)[number];

export const PRODUCT_TYPES = ["STOCK", "NON_STOCK", "SERVICE", "FIXED_ASSET", "BUNDLE"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const VALUATION_METHODS = ["FIFO", "WEIGHTED_AVERAGE", "STANDARD_COST"] as const;
export type ValuationMethod = (typeof VALUATION_METHODS)[number];

export const DEPRECIATION_METHODS = ["STRAIGHT_LINE", "WRITTEN_DOWN_VALUE"] as const;
export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number];

export const BUSINESS_TYPES = ["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "PRIVATE_LIMITED", "PUBLIC_LIMITED", "OTHER"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];
