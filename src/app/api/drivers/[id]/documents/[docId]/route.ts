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

  await deleteDocument(document.pathname).catch(() => null);
  await user.db.driverDocument.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true });
}
