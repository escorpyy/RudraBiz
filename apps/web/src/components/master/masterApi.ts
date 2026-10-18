import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useScopedKey } from "../../lib/me";
import type { MasterConfig, MasterRow } from "./types";

/** TanStack Query hooks for one master's REST endpoints. Keys include the active company/branch/year. */
export function useMasterList<Row extends MasterRow>(cfg: Pick<MasterConfig<Row>, "key" | "apiPath">) {
  return useQuery({
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

export function useMasterSave<Row extends MasterRow>(cfg: Pick<MasterConfig<Row>, "key" | "apiPath">, id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      id === undefined
        ? api<Row>(cfg.apiPath, { method: "POST", body: values })
        : api<Row>(`${cfg.apiPath}/${id}`, { method: "PATCH", body: values }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.key] }),
  });
}

export function useMasterDelete(cfg: Pick<MasterConfig<MasterRow>, "key" | "apiPath">) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`${cfg.apiPath}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.key] }),
  });
}
