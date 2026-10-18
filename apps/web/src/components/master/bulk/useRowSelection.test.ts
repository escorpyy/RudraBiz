import { describe, expect, it } from "vitest";
import { toggleSelection } from "./useRowSelection";

const ids = [10, 20, 30, 40, 50];

describe("toggleSelection", () => {
  it("toggles a single row on and off", () => {
    const on = toggleSelection(new Set(), ids, 20, 1, null);
    expect([...on]).toEqual([20]);
    expect([...toggleSelection(on, ids, 20, 1, 1)]).toEqual([]);
  });
  it("Shift adds the whole range from the last clicked row, in either direction", () => {
    expect([...toggleSelection(new Set([10]), ids, 30, 2, 0, true)].sort()).toEqual([10, 20, 30]);
    expect([...toggleSelection(new Set([50]), ids, 30, 2, 4, true)].sort()).toEqual([30, 40, 50]);
  });
  it("Shift with no previous click behaves like a normal toggle", () => {
    expect([...toggleSelection(new Set(), ids, 30, 2, null, true)]).toEqual([30]);
  });
});
