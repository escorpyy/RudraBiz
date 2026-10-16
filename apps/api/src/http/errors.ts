/** Error that is safe to show to the client. Everything else becomes a 500. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (msg: string, details?: unknown) => new AppError(400, "BAD_REQUEST", msg, details);
export const unauthorized = (msg = "Not signed in") => new AppError(401, "UNAUTHORIZED", msg);
export const forbidden = (msg = "Not allowed") => new AppError(403, "FORBIDDEN", msg);
export const notFound = (what = "Resource") => new AppError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (msg: string, details?: unknown) => new AppError(409, "CONFLICT", msg, details);
