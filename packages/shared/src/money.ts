import Decimal from "decimal.js";

/**
 * Money rules for the whole app:
 *  - the database stores NUMERIC; the API/UI carry money as decimal *strings*
 *  - arithmetic only ever goes through decimal.js — never `Number`/float
 *  - 2 decimal places for amounts (rupees/paisa)
 */
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = Decimal.Value | null | undefined;

export const MONEY_DP = 2;

/** Parses to Decimal; null/undefined/"" become 0. Throws on garbage like "abc". */
export function money(value: MoneyInput): Decimal {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(value);
}

export function isMoneyString(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    return new Decimal(value).isFinite();
  } catch {
    return false;
  }
}

export function sumMoney(values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(money(v)), new Decimal(0));
}

/** Rounded, fixed-point string ready for a NUMERIC column. */
export function toDb(value: MoneyInput, dp = MONEY_DP): string {
  return money(value).toDecimalPlaces(dp).toFixed(dp);
}

/** Exact equality of two totals after rounding to `dp` — no epsilon tricks. */
export function moneyEquals(a: MoneyInput, b: MoneyInput, dp = MONEY_DP): boolean {
  return money(a).toDecimalPlaces(dp).equals(money(b).toDecimalPlaces(dp));
}

export type DrCrLine = { debit?: MoneyInput; credit?: MoneyInput };

export function voucherTotals(lines: DrCrLine[]) {
  const debit = sumMoney(lines.map((l) => l.debit));
  const credit = sumMoney(lines.map((l) => l.credit));
  return {
    debit: debit.toFixed(MONEY_DP),
    credit: credit.toFixed(MONEY_DP),
    difference: debit.minus(credit).toFixed(MONEY_DP),
    balanced: moneyEquals(debit, credit),
  };
}

/** Indian/Nepali grouping (12,34,567.89) for display only. */
export function formatNpr(value: MoneyInput, dp = MONEY_DP): string {
  const fixed = money(value).toDecimalPlaces(dp).toFixed(dp);
  const [intPart, frac] = fixed.split(".");
  const neg = intPart!.startsWith("-");
  const digits = neg ? intPart!.slice(1) : intPart!;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `${neg ? "-" : ""}${grouped}${frac ? "." + frac : ""}`;
}
