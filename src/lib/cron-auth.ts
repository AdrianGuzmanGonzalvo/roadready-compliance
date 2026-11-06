import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * For the /api/cron routes (called by docker/daily.sh, public otherwise): null when the request carries
 * "Authorization: Bearer <CRON_SECRET>", else the response to send back. Compared in constant time.
 */
export function rejectUnlessCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
