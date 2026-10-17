import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { authAccount, authSession, authUser, authVerification, user } from "../db/schema";

export interface AuthOptions {
  db: Db;
  secret: string;
  baseURL: string;
  webOrigin: string;
}

/**
 * Better Auth, invite-only. A login can only be created for an email that
 * already exists (and is active) in the app's "User" table; the new login is
 * then linked to that row via "User"."authUserId". Company access stays in
 * "UserCompanyAccess", keyed by the integer "User".id as before.
 */
export function createAuth({ db, secret, baseURL, webOrigin }: AuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    basePath: "/api/auth",
    trustedOrigins: [webOrigin],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    databaseHooks: {
      user: {
        create: {
          before: async (u) => {
            const [row] = await db
              .select({ id: user.id, isActive: user.isActive, authUserId: user.authUserId })
              .from(user)
              .where(sql`lower(${user.email}) = lower(${u.email})`);
            if (!row || !row.isActive) {
              throw new APIError("FORBIDDEN", { message: "This email has not been invited" });
            }
            if (row.authUserId) {
              throw new APIError("FORBIDDEN", { message: "This user already has a login" });
            }
            return { data: u };
          },
          after: async (u) => {
            await db
              .update(user)
              .set({ authUserId: u.id })
              .where(sql`lower(${user.email}) = lower(${u.email})`);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
