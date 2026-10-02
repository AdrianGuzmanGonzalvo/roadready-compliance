import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import {
  DocumentTooLargeError,
  MAX_DOCUMENT_BYTES,
  deleteDocument,
  documentContentType,
  safeDocumentFilename,
  saveDocument,
} from "@/lib/document-storage";

const TOO_LARGE = `File is larger than ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB`;

/**
 * Receives one document as the raw request body (?filename= carries its name)
 * and stores it. The DriverDocument row is created by the client's follow-up
 * POST to ../documents with the pathname returned here.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id: driverId } = await params;
  const filename = new URL(request.url).searchParams.get("filename")?.trim() ?? "";
  if (!filename || !request.body) {
    return NextResponse.json({ error: "A file and its filename are required" }, { status: 400 });
  }
  if (!documentContentType(filename, request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Only PDF and image files can be uploaded" }, { status: 400 });
  }

  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });

  const driver = await user.db.driver.findUnique({ where: { id: driverId }, select: { id: true } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const pathname = `${user.tenantCode}/drivers/${driverId}/${randomUUID()}-${safeDocumentFilename(filename)}`;

  try {
    const size = await saveDocument(pathname, request.body);
    // Next.js buffers request bodies that pass through the proxy and silently
    // cuts them at proxyClientMaxBodySize (next.config.ts), so a short body
    // means a truncated file, not a small one.
    if (declaredSize && size !== declaredSize) {
      await deleteDocument(pathname);
      return NextResponse.json({ error: "Upload was incomplete, please try again" }, { status: 400 });
    }
    return NextResponse.json({ pathname });
  } catch (error) {
    if (error instanceof DocumentTooLargeError) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });
    console.error("[documents] Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
