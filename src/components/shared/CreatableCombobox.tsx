"use client";

import { useMemo, useState } from "react";
import Combobox, { type ComboboxOption, type ComboboxProps } from "@/components/shared/Combobox";

export type CreateFormRenderProps = {
  /** What the person had typed when they chose "Create ...". */
  query: string;
  /** Call once the new record is saved — selects it and closes the form. */
  onCreated: (option: ComboboxOption) => void;
  /** Call to abandon creation and go back to the combobox unchanged. */
  onCancel: () => void;
};

export type CreatableComboboxProps = Omit<ComboboxProps, "onCreateNew"> & {
  /**
   * Renders whatever quick-create form is appropriate for this picker
   * (e.g. a code+name form posting to /api/stock-categories). Kept as a
   * render prop rather than a fixed field set so any master — simple or
   * with its own required pickers — can plug in here.
   */
  renderCreateForm: (props: CreateFormRenderProps) => React.ReactNode;
  createLabel?: (query: string) => string;
};

/**
 * Wraps Combobox with an inline "create new" flow:
 *  1. Typing text that matches nothing shows a "Create '<text>'" row.
 *  2. Choosing it swaps the combobox for `renderCreateForm(...)`, right in
 *     the same spot in the layout — nothing else in the surrounding form
 *     unmounts, so every other field the person already filled in stays
 *     exactly as it was.
 *  3. Once the form calls `onCreated`, the new option is selected and the
 *     view switches back to the normal (now closed) combobox — the person
 *     continues the form they started, uninterrupted.
 *
 * Usage:
 *   <CreatableCombobox
 *     options={productGroupOptions}
 *     value={productGroupId}
 *     onChange={setProductGroupId}
 *     renderCreateForm={({ query, onCreated, onCancel }) => (
 *       <QuickCreateForm
 *         title="New Product Group"
 *         endpoint="/api/product-groups"
 *         initialName={query}
 *         onCreated={(row) => onCreated({ value: String(row.id), label: `${row.code} — ${row.name}` })}
 *         onCancel={onCancel}
 *       />
 *     )}
 *   />
 */
export default function CreatableCombobox({
  renderCreateForm,
  createLabel,
  options,
  onChange,
  ...rest
}: CreatableComboboxProps) {
  const [creating, setCreating] = useState<{ query: string } | null>(null);
  // Options created in this session, in case the parent's own `options`
  // list hasn't refetched yet by the time we need to show it as selected.
  const [sessionOptions, setSessionOptions] = useState<ComboboxOption[]>([]);

  const mergedOptions = useMemo(() => {
    const knownValues = new Set(options.map((o) => o.value));
    const extras = sessionOptions.filter((o) => !knownValues.has(o.value));
    return [...options, ...extras];
  }, [options, sessionOptions]);

  if (creating) {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        {renderCreateForm({
          query: creating.query,
          onCreated: (option) => {
            setSessionOptions((prev) => [...prev, option]);
            onChange(option.value);
            setCreating(null);
          },
          onCancel: () => setCreating(null),
        })}
      </div>
    );
  }

  return (
    <Combobox
      {...rest}
      options={mergedOptions}
      onChange={onChange}
      onCreateNew={(query) => setCreating({ query })}
      createLabel={createLabel}
    />
  );
}
