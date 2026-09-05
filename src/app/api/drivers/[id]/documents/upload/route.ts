import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: driverId } = await params;
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getSessionUser();
        if (!user) throw new Error("Not authenticated");
        if (!pathname.startsWith(`${user.tenantCode}/drivers/${driverId}/`)) {
          throw new Error("Invalid upload path");
        }

        return {
          access: "private",
          addRandomSuffix: true,
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
        };
      },
      onUploadCompleted: async () => {
        // No-op: this webhook never fires in local dev (Vercel can't reach
        // localhost), so the DriverDocument row is instead created by an
        // explicit follow-up POST from the client once upload() resolves.
        // Keeping persistence there means identical behavior locally and in prod.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
