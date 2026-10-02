# RoadReady Compliance

A web application for tracking Article 19-A Driver Qualification Record compliance: driver rosters, the nine tracked compliance forms (MCSA-5876, DS-703, DS-704, License Expiration, DS-870, DS-872, DS-873, DS-875, DS-875Y), and expiration status at a glance.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + hand-built shadcn-style components (Radix primitives, Lucide icons)
- **State:** Zustand (UI state) + TanStack React Query (server state)
- **Database:** SQLite via Prisma ORM (driver adapter: `@libsql/client`)
- **File processing:** SheetJS (`xlsx`) for Excel import parsing and export

## Multi-tenancy

Each company using this system has its own isolated database (see `src/lib/prisma.ts`). A separate control-plane database (`CONTROL_DATABASE_URL`) holds only the `Tenant` registry — a 4-digit login code mapped to that company's own `dbUrl`/`dbAuthToken`. Login asks for company code + username + password; everything after that (drivers, compliance forms, documents, other users) is scoped to that tenant's database only.

- **Provision a new company:** `npx tsx scripts/create-tenant.ts "Company Name" [admin-username] [admin-password]` — assigns the next 4-digit code, creates the database (a real Turso database if `TURSO_API_TOKEN`/`TURSO_ORG` are set, otherwise a local SQLite file under `prisma/tenants/`), migrates it, and seeds the first ADMIN user.
- **Roll out a schema change to every company:** after `npx prisma migrate dev` creates a new migration, run `npx tsx scripts/migrate-all-tenants.ts` to apply it to the control database and every tenant database.
- **Turn an existing database into a tenant** (e.g. this system's original single-tenant data): `DATABASE_URL=... [TURSO_AUTH_TOKEN=...] npx tsx scripts/register-existing-tenant.ts "Company Name" [code]`.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

3. Create the local dev database and apply migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Register that database as your first tenant (company code `0000`):

   ```bash
   npx tsx scripts/register-existing-tenant.ts "Local Dev" 0000
   npx tsx scripts/create-user.ts admin admin-password
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with code `0000`.

## Importing driver data

Use the **Upload Excel** button (sidebar or top bar) to import a `.xlsx` workbook with `PRIME`, `Active`, and `Terminated` sheets. Existing drivers are matched by name and updated; new drivers are created. See `src/lib/excel-parser.ts` for the column mapping.

## Project structure

- `prisma/schema.prisma` — `Driver` and `ComplianceForm` models, plus the control-plane `Tenant` model
- `scripts/create-tenant.ts`, `scripts/migrate-all-tenants.ts`, `scripts/register-existing-tenant.ts` — multi-tenant provisioning/maintenance
- `src/lib/excel-parser.ts` — workbook import/merge logic
- `src/lib/compliance.ts` — days-remaining and status-badge logic
- `src/app/api/drivers/*` — REST API routes (list, update, import)
- `src/app/(dashboard, drivers, settings)` — pages
- `src/components/` — UI

## Deployment

The app runs as a Docker container on a single server; nothing in it depends on a hosting platform.

- **Run it:** put a `.env` beside `docker-compose.yml` (see `.env.example`), run `sh docker/setup-tunnel.sh` once, then `docker compose up -d --build`. The app listens on `127.0.0.1:3210` only (`APP_PORT` changes the port); the `tunnel` service publishes it through RoadReady's own Cloudflare Tunnel. The setup script prints the `<id>.cfargotunnel.com` target that each hostname's proxied CNAME record in Cloudflare must point to.
- **Deploy a new version:** `git pull --ff-only && docker compose up -d --build`. `docker compose ps` shows `healthy` once it answers.
- **Driver documents** are files in the `documents` volume (`src/lib/document-storage.ts`), served only through the signed-in file route. Uploads are limited to 25 MB.
- **Daily job** (`docker/daily.sh`, the `daily` container): at 13:00 UTC it triggers the scheduled report emails and writes an archive of the documents to `./backups`, keeping the last 7 days (`BACKUP_KEEP_DAYS`). Those archives are on the same disk as the documents — copy them off the server for a real backup.
- **Maintenance scripts** run with the app's environment and documents volume: `docker compose run --rm tools npx tsx scripts/migrate-all-tenants.ts`.
- **Moving the existing documents out of Vercel Blob** (one-off): add `BLOB_READ_WRITE_TOKEN` to `.env`, run `docker compose run --rm tools npx tsx scripts/copy-blob-documents.ts`, then remove the token. It can be run again; files already copied are skipped.

## Notes

- SQLite database files (the control database and every tenant's database, local or under `prisma/tenants/`) and any imported `.xlsx` rosters are gitignored — they contain PII (SSNs, DOB, license numbers) and should not be committed or emailed unmasked.
- SSNs are masked to last-4 on import.
