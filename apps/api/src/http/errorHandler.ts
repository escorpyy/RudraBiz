import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, notFound } from "./errors";

interface PgErrorLike {
  code?: string;
  message?: string;
  constraint?: string;
  detail?: string;
}

function isPgError(e: unknown): e is PgErrorLike {
  return typeof e === "object" && e !== null && typeof (e as PgErrorLike).code === "string";
}

/**
 * Maps Postgres errors to HTTP. The database triggers (balance check, posted
 * immutability, control-account guard, opening-balance lock) raise P0001 with
 * a human-readable message, so those are shown to the user as 422.
 */
export function mapPgError(e: PgErrorLike): AppError | null {
  switch (e.code) {
    case "P0001":
      return new AppError(422, "RULE_VIOLATION", e.message ?? "Business rule violated");
    case "23505":
      return new AppError(409, "DUPLICATE", "A record with the same unique value already exists", {
        constraint: e.constraint,
      });
    case "23503":
      return new AppError(409, "IN_USE", "This record is referenced by other data or points to something that does not exist", {
        constraint: e.constraint,
      });
    case "23502":
    case "23514":
      return new AppError(400, "INVALID_DATA", "Value rejected by the database", { constraint: e.constraint });
    default:
      return null;
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "VALIDATION", message: "Validation failed", details: err.flatten() },
    });
    return;
  }
  const mapped = err instanceof AppError ? err : isPgError(err) ? mapPgError(err) : null;
  if (mapped) {
    res.status(mapped.status).json({
      error: { code: mapped.code, message: mapped.message, details: mapped.details },
    });
    return;
  }
  // body-parser errors etc. carry a status
  const status = typeof err?.status === "number" && err.status < 500 ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: { code: status >= 500 ? "INTERNAL" : "BAD_REQUEST", message: status >= 500 ? "Internal server error" : String(err.message) },
  });
};
