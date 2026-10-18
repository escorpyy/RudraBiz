import { useState } from "react";
import { api } from "../../../lib/api";

export type BulkResult = { succeeded: number; failed: number; errors: string[] };

function summarize(results: PromiseSettledResult<unknown>[]): BulkResult {
  let succeeded = 0;
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") succeeded++;
    else errors.push(r.reason instanceof Error ? r.reason.message : "Something went wrong.");
  }
  return { succeeded, failed: errors.length, errors };
}

/**
 * Bulk PATCH or DELETE by calling each row's own `{baseUrl}/{id}` endpoint in parallel, so a master
 * needs no bulk route. Per-row failures (e.g. a role or rule error) are collected rather than
 * aborting the batch, so "5 of 7 succeeded" can be reported.
 */
export function useBulkApi(baseUrl: string) {
  const [running, setRunning] = useState(false);

  async function run(ids: (number | string)[], one: (id: number | string) => Promise<unknown>): Promise<BulkResult> {
    setRunning(true);
    try {
      return summarize(await Promise.allSettled(ids.map(one)));
    } finally {
      setRunning(false);
    }
  }

  return {
    running,
    runBulkPatch: (ids: (number | string)[], data: Record<string, unknown>) =>
      run(ids, (id) => api(`${baseUrl}/${id}`, { method: "PATCH", body: data })),
    runBulkDelete: (ids: (number | string)[]) => run(ids, (id) => api(`${baseUrl}/${id}`, { method: "DELETE" })),
  };
}
