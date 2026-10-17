/**
 * The user's explicit Company / Branch / Fiscal-Year choice, kept in localStorage and
 * sent as X-Company-Id / X-Branch-Id / X-Fiscal-Year-Id on every API call. Anything left
 * undefined is defaulted by the server (see apps/api companyContext). It is only a
 * preference: the server re-checks it against UserCompanyAccess on every request.
 */
export interface Selection {
  companyId?: number;
  branchId?: number | "all";
  fiscalYearId?: number;
}

const KEY = "ntcas.context";
let current: Selection = read();
const listeners = new Set<() => void>();

function read(): Selection {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Selection) : {};
  } catch {
    return {};
  }
}

export function getSelection(): Selection {
  return current;
}

export function setSelection(next: Selection) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: selection just lasts for this page load */
  }
  listeners.forEach((l) => l());
}

export function subscribeSelection(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function contextHeaders(sel: Selection): Record<string, string> {
  const h: Record<string, string> = {};
  if (sel.companyId !== undefined) h["X-Company-Id"] = String(sel.companyId);
  if (sel.branchId !== undefined) h["X-Branch-Id"] = String(sel.branchId);
  if (sel.fiscalYearId !== undefined) h["X-Fiscal-Year-Id"] = String(sel.fiscalYearId);
  return h;
}
