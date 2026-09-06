# NTCAS Accounting — Account Groups

Next.js 15 (App Router) + React 19 + Tailwind CSS, backed by Prisma + PostgreSQL.
Recreates the "Account Groups" list page and "Add New Account Group" form exactly
as designed, plus a working API and database schema behind them.

## What's included

- `src/app/(dashboard)/account-groups/page.tsx` — Account Groups list page (stat
  cards, search/filter, table, pagination, info banner)
- `src/app/(dashboard)/account-groups/new/page.tsx` — Add New Account Group form
  (group info fields + hierarchy info panel)
- `src/app/api/account-groups/*` — REST API (list/create/get/update/delete)
- `prisma/schema.prisma` — `AccountGroup` → `SubGroup` → `Ledger` hierarchy
- `prisma/seed.ts` — seeds the same 8 groups shown in the screenshot (G-1000 … G-8000)
- `src/components/layout/Sidebar.tsx` — collapsible dark navy sidebar nav

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env file and point it at your Postgres database:

   ```bash
   cp .env.example .env
   # edit .env and set DATABASE_URL
   ```

3. Create the database schema:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed sample data (matches the screenshot: 18 groups... this seeds the 8 top
   level ones with sub-groups/ledgers so counts populate):

   ```bash
   npx prisma db seed
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 — it redirects to `/account-groups`.

## Notes

- The account type badge colors, status colors, and sidebar nav structure all
  live in `src/lib/constants.ts` — edit there to add new account types or nav
  items in one place.
- The list page's table (`GroupsTable.tsx`) filters/paginates client-side over
  data fetched server-side in the page component. For large datasets, move
  filtering to the API route (`/api/account-groups`) with query params instead.
- `Save Group` on the new-group form posts to `POST /api/account-groups` and
  redirects back to the list on success.
- Tailwind v3 is used (not v4) for a standard `tailwind.config.ts` setup that's
  easy to extend.
