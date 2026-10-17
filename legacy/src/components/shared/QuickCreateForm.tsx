"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { ComboboxOption } from "@/components/shared/Combobox";

export type QuickCreateField = {
  /** Key sent in the POST body, e.g. "code". */
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "select";
  placeholder?: string;
  /** Prefills this field, e.g. the query the person typed. */
  defaultValue?: string;
  /** Required when type is "select". */
  options?: { value: string; label: string }[];
};

export type QuickCreateFormProps = {
  title: string;
  /** POST endpoint, e.g. "/api/stock-categories". */
  endpoint: string;
  fields: QuickCreateField[];
  /** Extra fixed fields merged into every request, e.g. { isActive: true }. */
  extraPayload?: Record<string, unknown>;
  /** Maps the created record (the POST response body) to a ComboboxOption. */
  buildOption: (row: Record<string, unknown>) => ComboboxOption;
  /** Receives both the derived option and the raw created record, in case
   * the caller needs to sync its own local copy of the options list (e.g.
   * a cascading picker that keeps its own nested state). */
  onCreated: (option: ComboboxOption, row: Record<string, unknown>) => void;
  onCancel: () => void;
};

/**
 * Ready-made body for CreatableCombobox's `renderCreateForm` — covers the
 * common "code + name (+ a couple more simple fields)" master shape that
 * most of this app's masters use. For anything with its own required
 * picker or more validation than a couple of text fields (e.g. Product
 * Sub-Group needing a Product Group, or the full Product form), write a
 * bespoke renderCreateForm instead — the field is a render prop for
 * exactly this reason.
 */
export default function QuickCreateForm({
  title,
  endpoint,
  fields,
  extraPayload,
  buildOption,
  onCreated,
  onCancel,
}: QuickCreateFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, f.defaultValue ?? (f.type === "select" ? f.options?.[0]?.value ?? "" : "")])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    for (const field of fields) {
      if (field.required && !values[field.name]?.trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...extraPayload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to create.");
      onCreated(buildOption(body), body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>

      {error && (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="text-xs font-medium text-slate-700">
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </label>
            {field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                autoFocus={field === fields[0]}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <X size={13} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          <Save size={13} />
          {submitting ? "Saving..." : "Save & Select"}
        </button>
      </div>
    </form>
  );
}
