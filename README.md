# RoadReady Compliance

A web application for tracking Article 19-A Driver Qualification Record compliance: driver rosters, the nine tracked compliance forms (MCSA-5876, DS-703, DS-704, License Expiration, DS-870, DS-872, DS-873, DS-875, DS-875Y), and expiration status at a glance.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + hand-built shadcn-style components (Radix primitives, Lucide icons)
- **State:** Zustand (UI state) + TanStack React Query (server state)
- **Database:** SQLite via Prisma ORM (driver adapter: `@libsql/client`)
- **File processing:** SheetJS (`xlsx`) for Excel import parsing and export

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

3. Create the database and apply migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Importing driver data

Use the **Upload Excel** button (sidebar or top bar) to import a `.xlsx` workbook with `PRIME`, `Active`, and `Terminated` sheets. Existing drivers are matched by name and updated; new drivers are created. See `src/lib/excel-parser.ts` for the column mapping.

## Project structure

- `prisma/schema.prisma` — `Driver` and `ComplianceForm` models
- `src/lib/excel-parser.ts` — workbook import/merge logic
- `src/lib/compliance.ts` — days-remaining and status-badge logic
- `src/app/api/drivers/*` — REST API routes (list, update, import)
- `src/app/(dashboard, drivers, settings)` — pages
- `src/components/` — UI

## Notes

- The SQLite database file and any imported `.xlsx` rosters are gitignored — they contain PII (SSNs, DOB, license numbers) and should not be committed or emailed unmasked.
- SSNs are masked to last-4 on import.
