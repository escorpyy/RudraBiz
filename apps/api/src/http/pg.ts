import { conflict } from "./errors";
import { findPgError } from "./errorHandler";

/** Runs `fn`; a unique-key violation becomes a 409 with a message the user can act on. */
export async function orConflict<T>(message: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (findPgError(e)?.code === "23505") throw conflict(message);
    throw e;
  }
}
