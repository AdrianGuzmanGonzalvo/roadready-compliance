// One-off for the move off Vercel: copies every driver document from Vercel
// Blob into DOCUMENTS_DIR, at the same relative path its DriverDocument row
// already holds, so no database row changes. Safe to run again — files already
// on disk with the right size are skipped, so a second run just before the
// switch only picks up what was uploaded since the first.
// Usage: BLOB_READ_WRITE_TOKEN=... DOCUMENTS_DIR=... npx tsx scripts/copy-blob-documents.ts
import "dotenv/config";
import { get } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { documentSize, saveDocument } from "../src/lib/document-storage";
import { getControlPrismaForScript } from "./lib/control-db";

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Missing BLOB_READ_WRITE_TOKEN");

  const control = getControlPrismaForScript();
  const tenants = await control.tenant.findMany({ orderBy: { code: "asc" } });
  await control.$disconnect();

  let copied = 0;
  let alreadyThere = 0;
  let failed = 0;

  for (const tenant of tenants) {
    const remote = tenant.dbUrl.startsWith("libsql://");
    const adapter =
      remote && tenant.dbAuthToken
        ? new PrismaLibSql({ url: tenant.dbUrl, authToken: tenant.dbAuthToken })
        : new PrismaLibSql({ url: tenant.dbUrl });
    const db = new PrismaClient({ adapter });

    try {
      const documents = await db.driverDocument.findMany();
      console.log(`Tenant ${tenant.code} (${tenant.name}, ${remote ? "Turso" : "local file"} database): ${documents.length} document(s)`);

      for (const document of documents) {
        if ((await documentSize(document.pathname)) === document.size) {
          alreadyThere++;
          continue;
        }
        try {
          const result = await get(document.pathname, { access: "private" });
          if (!result || result.statusCode !== 200 || !result.stream) throw new Error("not found in Vercel Blob");
          const size = await saveDocument(document.pathname, result.stream, Infinity);
          if (size !== document.size) {
            console.warn(`  size differs from the database (${size} vs ${document.size} bytes): ${document.pathname}`);
          }
          copied++;
        } catch (err) {
          failed++;
          console.error(`  FAILED ${document.pathname} —`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      failed++;
      console.error(`Tenant ${tenant.code} (${tenant.name}): FAILED —`, err);
    } finally {
      await db.$disconnect();
    }
  }

  console.log(`Done: ${copied} copied, ${alreadyThere} already on disk, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
