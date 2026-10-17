"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { BulkResult } from "./useBulkApi";

/**
 * Reports the outcome of a bulk PATCH/DELETE. Since each row is updated
 * independently, a batch can partially fail (e.g. 2 of 5 deletes blocked
 * by a dependent-record guard) — this shows both counts and, if anything
 * failed, the individual error messages so the person knows what to fix.
 */
export default function BulkResultBanner({ result, onDismiss }: { result: BulkResult; onDismiss: () => void }) {
  const allSucceeded = result.failed === 0;

  return (
    <div
      className={`mx-5 mt-4 rounded-lg border px-4 py-3 text-sm ${
        allSucceeded ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {allSucceeded ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0" />
          )}
          <div>
            <div className="font-medium">
              {result.succeeded} succeeded{result.failed > 0 ? `, ${result.failed} failed` : ""}
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs opacity-90">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-xs font-medium underline">
          Dismiss
        </button>
      </div>
    </div>
  );
}
