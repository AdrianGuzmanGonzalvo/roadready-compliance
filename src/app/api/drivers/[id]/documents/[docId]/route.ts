import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { deleteDocument } from "@/lib/document-storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id: driverId, docId } = await params;
  const document = await user.db.driverDocument.findUnique({ where: { id: docId } });
  if (!document || document.driverId !== driverId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // The record goes either way, so the document stops showing up; a file left behind is only worth a log line.
  await deleteDocument(document.pathname).catch((error) => console.error("[documents] Could not delete file:", error));
  await user.db.driverDocument.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true });
}
