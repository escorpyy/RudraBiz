import { conflict } from "./errors";
import { findPgError } from "./errorHandler";

/** What a unique constraint means to the user: which form field clashed and what to tell them. */
export interface UniqueRule {
  constraint: string;
  field: string;
  message: string;
}

/**
 * Runs `fn`; a unique-key violation becomes a 409 whose message and `details.field`
 * come from the matching rule, so the form can mark the right input.
 */
export async function orConflict<T>(rules: UniqueRule[], fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const pg = findPgError(e);
    if (pg?.code === "23505") {
      const rule = rules.find((r) => r.constraint === pg.constraint);
      if (rule) throw conflict(rule.message, { field: rule.field, constraint: rule.constraint });
      throw conflict("A record with the same unique value already exists.", { constraint: pg.constraint });
    }
    throw e;
  }
}
