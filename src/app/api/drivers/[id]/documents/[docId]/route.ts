import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: driverId, docId } = await params;
  const document = await user.db.driverDocument.findUnique({ where: { id: docId } });
  if (!document || document.driverId !== driverId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await del(document.pathname).catch(() => null);
  await user.db.driverDocument.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true });
}
