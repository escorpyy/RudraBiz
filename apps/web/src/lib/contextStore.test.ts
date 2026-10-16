import { describe, expect, it } from "vitest";
import { contextHeaders } from "./contextStore";

describe("contextHeaders", () => {
  it("sends nothing when the user has not chosen (server defaults apply)", () => {
    expect(contextHeaders({})).toEqual({});
  });
  it("sends company, branch and fiscal year", () => {
    expect(contextHeaders({ companyId: 2, branchId: 5, fiscalYearId: 9 })).toEqual({
      "X-Company-Id": "2",
      "X-Branch-Id": "5",
      "X-Fiscal-Year-Id": "9",
    });
  });
  it('sends "all" for all branches', () => {
    expect(contextHeaders({ companyId: 1, branchId: "all" })["X-Branch-Id"]).toBe("all");
  });
});
