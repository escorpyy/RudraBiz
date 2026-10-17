# NTCAS Accounting

Monorepo (npm workspaces) mid-migration from Next.js + Prisma to the target stack.

| Path | What |
|---|---|
| `packages/shared` | Money (decimal.js), BS/AD dates, enums — used by web and api |
| `apps/api` | Express + Drizzle ORM + PostgreSQL (DB layer done; routes next) |
| `apps/web` | React + Vite (not started) |
| `legacy/` | The previous Next.js app. Still runnable on its own (`cd legacy && npm i && npm run dev`). Deleted at cutover. |

## Develop

```bash
npm install
cp .env.example .env            # point DATABASE_URL at Postgres
npm run db:migrate              # applies apps/api/drizzle/*.sql
npm run typecheck && npm test
```

## Database rules

- `apps/api/drizzle/0000_baseline.sql` is the legacy Prisma schema **including triggers**
  (balance check, posted-immutability, control-account guard, audit). Never edit it.
- An existing Prisma-created database is detected by `db:migrate` and baseline 0000 is
  recorded as applied, not re-run.
- Schema changes: edit `apps/api/src/db/schema.ts`, run `npm run db:generate -w @ntcas/api`.
  Triggers and expression indexes go in `drizzle-kit generate --custom` migrations.
- Never `drizzle-kit push`. Money is `NUMERIC` + decimal.js; never float.
