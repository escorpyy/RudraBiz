import { sql } from "drizzle-orm";
import type { Db } from "./client";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Runs `fn` in a transaction with `app.current_user_id` set (transaction-local),
 * which the audit-log trigger reads. Every write must go through this.
 *
 * The deferred balance trigger for vouchers fires at COMMIT, so a voucher and
 * all of its lines must be inserted inside the same withTx call.
 */
export async function withTx<T>(db: Db, userId: number | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    if (userId != null) {
      // set_config(..., true) == SET LOCAL, but accepts a bound parameter.
      await tx.execute(sql`select set_config('app.current_user_id', ${String(userId)}, true)`);
    }
    return fn(tx);
  });
}
