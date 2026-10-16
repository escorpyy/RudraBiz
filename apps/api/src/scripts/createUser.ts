import { parseArgs } from "node:util";
import { and, eq, isNull, sql } from "drizzle-orm";
import { createAuth } from "../auth/auth";
import { loadConfig } from "../config";
import { db, pool } from "../db/client";
import { company, user, userCompanyAccess } from "../db/schema";

/**
 * Invites a user and creates their login in one step. Use it for the first admin;
 * afterwards admins add users from the app.
 *   npm run user:create -w @ntcas/api -- --email a@b.com --name "A B" --password '...' [--admin]
 * --admin grants the ADMIN role on every company (company-wide, all branches).
 */
const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
    admin: { type: "boolean", default: false },
  },
});
if (!values.email || !values.name || !values.password) {
  console.error("Required: --email --name --password");
  process.exit(1);
}
const email = values.email.trim();

const config = loadConfig();
const auth = createAuth({ db, secret: config.BETTER_AUTH_SECRET, baseURL: config.API_URL, webOrigin: config.WEB_ORIGIN });

try {
  let [row] = await db.select().from(user).where(sql`lower(${user.email}) = lower(${email})`);
  if (!row) {
    [row] = await db.insert(user).values({ name: values.name, email }).returning();
  }
  if (!row!.authUserId) {
    await auth.api.signUpEmail({ body: { email, password: values.password, name: values.name } });
  }
  if (values.admin) {
    for (const c of await db.select({ id: company.id }).from(company).where(eq(company.isActive, true))) {
      // The unique key includes branchId, and NULLs never collide in Postgres,
      // so "onConflictDoNothing" would not prevent duplicates here: check first.
      const [existing] = await db
        .select({ id: userCompanyAccess.id })
        .from(userCompanyAccess)
        .where(and(eq(userCompanyAccess.userId, row!.id), eq(userCompanyAccess.companyId, c.id), isNull(userCompanyAccess.branchId)));
      if (!existing) {
        await db.insert(userCompanyAccess).values({ userId: row!.id, companyId: c.id, branchId: null, role: "ADMIN" });
      }
    }
  }
  console.log(`User ${email} ready (id ${row!.id}).`);
} finally {
  await pool.end();
}
