import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentDetail, AgentInput, AgentRow } from "@ntcas/shared";
import { api } from "../../lib/api";
import { useScopedKey } from "../../lib/me";

export type AgentFilters = { status?: "all" | "active"; q?: string };

export function useAgents(filters: AgentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return useQuery({
    queryKey: useScopedKey("agents", "list", filters),
    queryFn: () => api<AgentRow[]>(`/api/agents${qs ? `?${qs}` : ""}`),
  });
}

export function useAgent(id: number | undefined) {
  return useQuery({
    queryKey: useScopedKey("agents", "detail", id),
    queryFn: () => api<AgentDetail>(`/api/agents/${id}`),
    enabled: id !== undefined,
  });
}

export function useSaveAgent(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<AgentInput>) =>
      id === undefined
        ? api<AgentRow>("/api/agents", { method: "POST", body: values })
        : api<AgentRow>(`/api/agents/${id}`, { method: "PATCH", body: values }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/agents/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}
