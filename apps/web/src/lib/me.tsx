import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "./api";
import { getSelection, setSelection, subscribeSelection, type Selection } from "./contextStore";

export interface Me {
  user: { id: number; name: string; email: string };
  companies: {
    id: number;
    code: string;
    name: string;
    allBranches: boolean;
    branches: { id: number; code: string; name: string; isHeadOffice: boolean }[];
    fiscalYears: { id: number; code: string; isCurrent: boolean; isClosed: boolean }[];
  }[];
  context: { companyId: number; branchId: number | null; fiscalYearId: number | null; role: "ADMIN" | "ACCOUNTANT" | "VIEWER" } | null;
  contextError: string | null;
}

export function useSelection(): Selection {
  return useSyncExternalStore(subscribeSelection, getSelection);
}

/** Query key that changes with the active company/branch/fiscal year, so data refetches on switch. */
export function useScopedKey(...base: unknown[]) {
  const sel = useSelection();
  return [...base, sel] as const;
}

export function useMe() {
  const sel = useSelection();
  return useQuery({
    queryKey: ["me", sel],
    queryFn: () => api<Me>("/api/me"),
    retry: false,
    staleTime: 30_000,
  });
}

export function useChangeSelection() {
  const qc = useQueryClient();
  return useCallback(
    (next: Selection) => {
      setSelection(next);
      // everything company-scoped is stale now; "me" re-runs with the new headers via its key
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "me" });
    },
    [qc],
  );
}
