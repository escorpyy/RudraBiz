import { useMasterList } from "../components/master/masterApi";
import type { MasterConfig, MasterRow } from "../components/master/types";
import { useCanWrite } from "./useCanWrite";

/**
 * Whether the "New" button / form should be available. Uses cfg.canCreate when a master defines its own rule,
 * which needs the list, so `loading` is true until it arrives (callers wait instead of redirecting).
 */
export function useCreateAccess<Row extends MasterRow>(cfg: MasterConfig<Row>): { allowed: boolean; loading: boolean } {
  const base = useCanWrite();
  const list = useMasterList<Row>(cfg, { enabled: Boolean(cfg.canCreate) });
  if (!cfg.canCreate) return { allowed: base, loading: false };
  return { allowed: Boolean(list.data && cfg.canCreate(list.data)), loading: list.isPending };
}

/** Whether edit/delete is available for a given row. */
export function useRowAccess<Row extends MasterRow>(cfg: MasterConfig<Row>): (row: Row) => boolean {
  const base = useCanWrite();
  return (row) => (cfg.canWriteRow ? cfg.canWriteRow(row) : base);
}
