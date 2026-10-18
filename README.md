# NTCAS Accounting

Monorepo (npm workspaces) mid-migration from Next.js + Prisma to the target stack.

| Path | What |
|---|---|
| `packages/shared` | Money (decimal.js), BS/AD dates, enums — used by web and api |
| `apps/api` | Express + Drizzle ORM + PostgreSQL + Better Auth (DB, auth and company context done; module routes next) |
| `apps/web` | React + Vite + Tailwind + React Router + TanStack Query (shell, login, company switcher; modules migrate one per patch) |
| `legacy/` | The previous Next.js app. Still runnable on its own (`cd legacy && npm i && npm run dev`). Deleted at cutover. |

## Develop

```bash
npm install
cp .env.example .env            # point DATABASE_URL at Postgres
npm run db:migrate              # applies apps/api/drizzle/*.sql
npm run typecheck && npm test
npm run dev -w @ntcas/api       # http://localhost:4000
npm run dev -w @ntcas/web       # http://localhost:5173 (proxies /api to the API)
```

## Auth and company context

- Better Auth, invite-only: a login can only be created for an email that already exists in `"User"`.
  Login tables are `AuthUser/AuthSession/AuthAccount/AuthVerification`; `"User"."authUserId"` links them
  to the integer-keyed app user that the rest of the schema references.
- First admin: `npm run user:create -w @ntcas/api -- --email you@x.com --name "You" --password '...' --admin`
- Every module router is mounted behind `requireAuth` + `companyContext`. The client sends
  `X-Company-Id`, `X-Branch-Id` (or `all`) and `X-Fiscal-Year-Id`; the server checks them against
  `UserCompanyAccess` and exposes the result as `req.ctx`. Modules must never read those headers themselves.
- Writes go through `withTx(db, req.appUser.id, ...)` so the audit trigger knows who made the change.

## Adding a simple master (company-scoped code/name/status table)

1. `packages/shared/src/schemas/<name>.ts`: Zod input schema + row type (export it from `index.ts`).
2. `apps/api/src/modules/<name>/<name>.router.ts`: one `crudRouter(db, {...})` call (table, schemas,
   selected columns, search columns, `unique` rules with a message and field per constraint). Mount it in `app.ts`.
3. `apps/api/src/modules/<name>/<name>.test.ts`: `describeCrud({...})` + `describeSchemaDrift(...)` give you
   roles, validation, duplicates, tenant isolation, filters, update, delete and audit-trail tests.
4. `apps/web/src/modules/<name>/config.tsx`: a `MasterConfig` (columns, stats, form fields, summary), then
   `{masterRoutes(config)}` in `App.tsx`. List, form, detail, bulk select/activate/delete come for free.

Masters with special inputs (selects, numbers, dates) add a field `kind` to `components/master/types.ts`.

## Database rules

- `apps/api/drizzle/0000_baseline.sql` is the legacy Prisma schema **including triggers**
  (balance check, posted-immutability, control-account guard, audit). Never edit it.
- An existing Prisma-created database is detected by `db:migrate` and baseline 0000 is
  recorded as applied, not re-run.
- Schema changes: edit `apps/api/src/db/schema.ts`, run `npm run db:generate -w @ntcas/api`.
  Triggers and expression indexes go in `drizzle-kit generate --custom` migrations.
- Never `drizzle-kit push`. Money is `NUMERIC` + decimal.js; never float.
