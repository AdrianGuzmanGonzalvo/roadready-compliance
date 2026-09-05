import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: driverId, docId } = await params;
  const document = await user.db.driverDocument.findUnique({ where: { id: docId } });
  if (!document || document.driverId !== driverId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const result = await get(document.pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": document.contentType ?? result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${document.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
