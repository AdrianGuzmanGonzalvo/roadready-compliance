import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import type { SessionUserDTO } from "@/types/user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dto: SessionUserDTO = { id: user.id, username: user.username, role: user.role, tenantCode: user.tenantCode };
  return NextResponse.json(dto);
}
