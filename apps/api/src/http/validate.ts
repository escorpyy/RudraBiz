import type { RequestHandler } from "express";
import { ZodError, type ZodIssue, type ZodTypeAny, type z } from "zod";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Parsed (and coerced) values are stored on req.valid, never on req.body. */
export interface Validated<B = unknown, Q = unknown, P = unknown> {
  body: B;
  query: Q;
  params: P;
}

declare module "express-serve-static-core" {
  interface Request {
    valid: Validated<any, any, any>;
  }
}

export function validate<S extends Schemas>(schemas: S): RequestHandler {
  return (req, _res, next) => {
    const issues: ZodIssue[] = [];
    const run = (schema: ZodTypeAny | undefined, input: unknown) => {
      if (!schema) return input;
      const r = schema.safeParse(input);
      if (r.success) return r.data;
      issues.push(...r.error.issues);
      return undefined;
    };
    // All three sections are checked so the client sees every problem at once.
    const valid = {
      body: run(schemas.body, req.body),
      query: run(schemas.query, req.query),
      params: run(schemas.params, req.params),
    };
    if (issues.length) return next(new ZodError(issues));
    req.valid = valid;
    next();
  };
}

export type Infer<T extends ZodTypeAny> = z.infer<T>;
