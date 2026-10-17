import { describe, expect, it } from "vitest";
import { formatNpr, isMoneyString, money, moneyEquals, sumMoney, toDb, voucherTotals } from "./money";

describe("money", () => {
  it("does not suffer float error", () => {
    expect(sumMoney(["0.1", "0.2"]).toString()).toBe("0.3");
    expect(0.1 + 0.2).not.toBe(0.3); // the bug we are avoiding
  });
  it("treats empty as zero and rejects garbage", () => {
    expect(money(null).toString()).toBe("0");
    expect(money("").toString()).toBe("0");
    expect(() => money("abc")).toThrow();
    expect(isMoneyString("12.50")).toBe(true);
    expect(isMoneyString("1e")).toBe(false);
  });
  it("rounds half up to a NUMERIC-ready string", () => {
    expect(toDb("1.005")).toBe("1.01");
    expect(toDb(5)).toBe("5.00");
  });
  it("compares exactly after rounding", () => {
    expect(moneyEquals("10.001", "10.004")).toBe(true);
    expect(moneyEquals("10.00", "10.01")).toBe(false);
  });
  it("checks voucher balance", () => {
    expect(voucherTotals([{ debit: "100.10" }, { credit: "100.10" }]).balanced).toBe(true);
    const t = voucherTotals([{ debit: "100.10" }, { credit: "100.00" }]);
    expect(t.balanced).toBe(false);
    expect(t.difference).toBe("0.10");
  });
  it("formats in lakh grouping", () => {
    expect(formatNpr("1234567.8")).toBe("12,34,567.80");
    expect(formatNpr("-999")).toBe("-999.00");
  });
});
