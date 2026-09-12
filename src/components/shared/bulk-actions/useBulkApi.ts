"use client";

import { useState } from "react";

export type BulkResult = { succeeded: number; failed: number; errors: string[] };

function summarize(results: PromiseSettledResult<void>[]): BulkResult {
  let succeeded = 0;
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") succeeded++;
    else errors.push(r.reason instanceof Error ? r.reason.message : "Something went wrong.");
  }
  return { succeeded, failed: errors.length, errors };
}

/**
 * Runs a bulk PATCH or DELETE across many ids by calling each row's
 * existing `{baseUrl}/{id}` endpoint individually (in parallel) — every
 * master in this app already exposes GET/PATCH/DELETE at that shape, so
 * this needs no new bulk-specific API route per master. Per-row failures
 * (e.g. a delete blocked by a dependent-record guard) are collected rather
 * than aborting the whole batch, so "5 of 7 succeeded" is reportable.
 */
export function useBulkApi(baseUrl: string) {
  const [running, setRunning] = useState(false);

  async function runBulkPatch(ids: (number | string)[], data: Record<string, unknown>): Promise<BulkResult> {
    setRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${baseUrl}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? `Failed to update #${id}.`);
            }
          })
        )
      );
      return summarize(results);
    } finally {
      setRunning(false);
    }
  }

  async function runBulkDelete(ids: (number | string)[]): Promise<BulkResult> {
    setRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${baseUrl}/${id}`, { method: "DELETE" }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? `Failed to delete #${id}.`);
            }
          })
        )
      );
      return summarize(results);
    } finally {
      setRunning(false);
    }
  }

  return { runBulkPatch, runBulkDelete, running };
}
