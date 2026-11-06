import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { documentContentType, openDocument } from "@/lib/document-storage";

/**
 * Header values must be plain ASCII: a name like "licencia ñ.pdf" or one with an emoji would make the response
 * throw. Old browsers get an ASCII copy of the name, current ones the real name (RFC 6266 filename*).
 */
function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: driverId, docId } = await params;
  const document = await user.db.driverDocument.findUnique({ where: { id: docId } });
  if (!document || document.driverId !== driverId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const file = await openDocument(document.pathname);
  if (!file) return NextResponse.json({ error: "File not found in storage" }, { status: 404 });

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": documentContentType(document.filename, document.contentType) ?? "application/octet-stream",
      "Content-Length": String(file.size),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": contentDisposition(document.filename),
      "Cache-Control": "private, no-cache",
    },
  });
}
