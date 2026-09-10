import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` has
 * passed without `value` changing. Use this to avoid firing an API call (or
 * any other expensive work) on every keystroke — e.g. an async Combobox's
 * search query, or a table's free-text filter.
 *
 * const query = useState("")[0];
 * const debouncedQuery = useDebouncedValue(query, 300);
 * useEffect(() => { fetch(`/api/x?q=${debouncedQuery}`) }, [debouncedQuery]);
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
