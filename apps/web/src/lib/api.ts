import { contextHeaders, getSelection } from "./contextStore";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
  /** Zod flatten() field errors from a 400 VALIDATION response, for forms. */
  get fieldErrors(): Record<string, string[]> {
    const d = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    return d?.fieldErrors ?? {};
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: {
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...contextHeaders(getSelection()),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? "ERROR", e?.message ?? res.statusText, e?.details);
  }
  return json as T;
}
