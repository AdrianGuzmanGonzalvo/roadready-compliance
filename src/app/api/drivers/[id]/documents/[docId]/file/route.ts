import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { documentContentType, openDocument } from "@/lib/document-storage";

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
      "Content-Disposition": `inline; filename="${document.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
