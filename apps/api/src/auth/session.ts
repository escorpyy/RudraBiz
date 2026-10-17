import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { user } from "../db/schema";
import { forbidden, unauthorized } from "../http/errors";
import type { Auth } from "./auth";

export interface AppUser {
  id: number;
  name: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    appUser: AppUser;
  }
}

/** Requires a valid Better Auth session that maps to an active app "User". */
export function requireAuth(auth: Auth, db: Db): RequestHandler {
  return async (req, _res, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) throw unauthorized();
      const [row] = await db
        .select({ id: user.id, name: user.name, email: user.email, isActive: user.isActive })
        .from(user)
        .where(eq(user.authUserId, session.user.id));
      if (!row || !row.isActive) throw forbidden("Account is not active");
      req.appUser = { id: row.id, name: row.name, email: row.email };
      next();
    } catch (e) {
      next(e);
    }
  };
}
