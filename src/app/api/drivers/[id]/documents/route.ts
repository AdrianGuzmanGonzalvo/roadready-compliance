import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { isPlainDocumentPath } from "@/lib/document-storage";

/** Control characters (newlines included) never belong in a label or a filename that ends up in a response header. */
function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength) : "";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireWriteAccess();
  if (user instanceof NextResponse) return user;

  const { id: driverId } = await params;
  const body = await req.json().catch(() => null);

  const label = cleanText(body?.label, 200);
  const filename = cleanText(body?.filename, 255);
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : null;
  const size = typeof body?.size === "number" ? body.size : 0;

  if (!label || !filename || !pathname) {
    return NextResponse.json({ error: "label, filename, and pathname are required" }, { status: 400 });
  }
  // Exactly one file inside this driver's own folder, as the upload route names it.
  const folder = `${user.tenantCode}/drivers/${driverId}/`;
  if (!pathname.startsWith(folder) || pathname.slice(folder.length).includes("/") || !isPlainDocumentPath(pathname)) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  const driver = await user.db.driver.findUnique({ where: { id: driverId }, select: { id: true } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const document = await user.db.driverDocument.create({
    data: { driverId, label, filename, pathname, contentType, size },
  });

  return NextResponse.json(
    {
      document: {
        id: document.id,
        label: document.label,
        filename: document.filename,
        contentType: document.contentType,
        size: document.size,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
