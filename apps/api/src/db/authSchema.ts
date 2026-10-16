import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Better Auth's own tables. Prefixed "Auth" so they never clash with the app's
// integer-keyed "User" table (which stays the identity that the rest of the
// schema references; "User"."authUserId" links the two).

export const authUser = pgTable("AuthUser", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
});

export const authSession = pgTable(
  "AuthSession",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ mode: "date" }).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull().references(() => authUser.id, { onDelete: "cascade" }),
  },
  (t) => [index("AuthSession_userId_idx").on(t.userId)],
);

export const authAccount = pgTable(
  "AuthAccount",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text().notNull().references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ mode: "date" }),
    refreshTokenExpiresAt: timestamp({ mode: "date" }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("AuthAccount_userId_idx").on(t.userId)],
);

export const authVerification = pgTable(
  "AuthVerification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ mode: "date" }).notNull(),
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("AuthVerification_identifier_idx").on(t.identifier)],
);
