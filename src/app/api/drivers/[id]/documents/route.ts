import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: driverId } = await params;
  const body = await req.json().catch(() => null);

  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const filename = typeof body?.filename === "string" ? body.filename : "";
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : null;
  const size = typeof body?.size === "number" ? body.size : 0;

  if (!label || !filename || !pathname) {
    return NextResponse.json({ error: "label, filename, and pathname are required" }, { status: 400 });
  }
  if (!pathname.startsWith(`${user.tenantCode}/drivers/${driverId}/`)) {
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
