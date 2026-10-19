import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useScopedKey } from "../../lib/me";
import type { MasterConfig, MasterRow } from "./types";

/** TanStack Query hooks for one master's REST endpoints. Keys include the active company/branch/year. */
export function useMasterList<Row extends MasterRow>(cfg: Pick<MasterConfig<Row>, "key" | "apiPath">, opts: { enabled?: boolean } = {}) {
  return useQuery({
    enabled: opts.enabled ?? true,
    queryKey: useScopedKey(cfg.key, "list"),
    queryFn: () => api<Row[]>(cfg.apiPath),
  });
}

export function useMasterOne<Detail extends MasterRow>(cfg: Pick<MasterConfig<Detail>, "key" | "apiPath">, id: number | undefined) {
  return useQuery({
    queryKey: useScopedKey(cfg.key, "detail", id),
    queryFn: () => api<Detail>(`${cfg.apiPath}/${id}`),
    enabled: id !== undefined,
  });
}

export function useMasterSave<Row extends MasterRow>(cfg: Pick<MasterConfig<Row>, "key" | "apiPath" | "alsoInvalidate">, id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      id === undefined
        ? api<Row>(cfg.apiPath, { method: "POST", body: values })
        : api<Row>(`${cfg.apiPath}/${id}`, { method: "PATCH", body: values }),
    onSuccess: () => Promise.all([cfg.key, ...(cfg.alsoInvalidate ?? [])].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}

export function useMasterDelete(cfg: Pick<MasterConfig<MasterRow>, "key" | "apiPath" | "alsoInvalidate">) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`${cfg.apiPath}/${id}`, { method: "DELETE" }),
    onSuccess: () => Promise.all([cfg.key, ...(cfg.alsoInvalidate ?? [])].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}
