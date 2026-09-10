"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, X, type LucideIcon } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks";

export type ComboboxOption = {
  /** Value submitted to the form / API (e.g. the record's id as a string). */
  value: string;
  /** Primary label shown in the input and the option list. */
  label: string;
  /** Optional secondary line under the label (e.g. a parent's name). */
  description?: string;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** Leading icon, matching the pattern used by the app's existing selects. */
  icon?: LucideIcon;
  disabled?: boolean;
  /** Show a spinner in place of the chevron (e.g. while options are loading). */
  loading?: boolean;
  /**
   * Provide this to make the Combobox "async": instead of filtering
   * `options` locally, the component calls this (debounced) as the user
   * types and expects the caller to update `options` in response. Omit it
   * for a plain client-side-filtered Combobox.
   */
  onQueryChange?: (query: string) => void;
  /** Debounce delay in ms for `onQueryChange`. Defaults to 300. */
  debounceMs?: number;
  /** Show a clear ("x") button once a value is selected. Defaults to true. */
  clearable?: boolean;
  id?: string;
  "aria-label"?: string;
};

/**
 * A searchable single-select dropdown: type to filter, click (or Enter) to
 * pick, arrow keys to navigate, Escape to close. Styled to match the app's
 * existing `<select>` fields exactly (see AreaForm/SubAreaForm) so it's a
 * drop-in replacement once a list of options grows too long to scan.
 *
 * Client-side filtering by default. Pass `onQueryChange` + externally
 * filtered `options` to make it async (see docs/COMPONENTS.md → Async
 * Combobox).
 */
export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  emptyMessage = "No results found.",
  icon: Icon,
  disabled = false,
  loading = false,
  onQueryChange,
  debounceMs = 300,
  clearable = true,
  id,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listboxId = `${baseId}-listbox`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isAsync = Boolean(onQueryChange);
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  useEffect(() => {
    if (isAsync && open) onQueryChange!(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, isAsync, open]);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    if (isAsync) return options; // caller already filtered
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)
    );
  }, [options, query, isAsync]);

  // Close on outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  function openList() {
    if (disabled) return;
    setOpen(true);
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) selectOption(filtered[highlightedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
        break;
      case "Tab":
        setOpen(false);
        setQuery("");
        break;
    }
  }

  const displayValue = open ? query : selected?.label ?? "";
  const showClear = clearable && !open && Boolean(selected) && !disabled;

  return (
    <div ref={rootRef} className="relative">
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
        />
      )}

      <input
        ref={inputRef}
        id={baseId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        aria-activedescendant={open && filtered[highlightedIndex] ? `${listboxId}-opt-${highlightedIndex}` : undefined}
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => {
          openList();
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`w-full appearance-none rounded-lg border border-slate-200 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          Icon ? "pl-10" : "pl-3.5"
        } ${showClear ? "pr-16" : "pr-10"}`}
      />

      <div className="pointer-events-none absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>

      {showClear && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      )}

      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1.5 text-sm shadow-lg"
        >
          {loading && filtered.length === 0 && (
            <li className="px-3.5 py-2.5 text-slate-400">Loading...</li>
          )}
          {!loading && filtered.length === 0 && (
            <li className="px-3.5 py-2.5 text-slate-400">{emptyMessage}</li>
          )}
          {filtered.map((option, i) => {
            const isSelected = option.value === value;
            const isHighlighted = i === highlightedIndex;
            return (
              <li
                key={option.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => {
                  // preventDefault so the input doesn't blur before onClick fires.
                  e.preventDefault();
                  selectOption(option);
                }}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 ${
                  isHighlighted ? "bg-blue-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className={`truncate ${isHighlighted ? "text-brand" : "text-slate-800"}`}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="truncate text-xs text-slate-400">{option.description}</div>
                  )}
                </div>
                {isSelected && <Check size={15} className="shrink-0 text-brand" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
