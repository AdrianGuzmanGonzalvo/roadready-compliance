import { NextResponse } from "next/server";
import { sendReportEmail, buildDemoRequestConfirmationHtml } from "@/lib/email";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/marketing";

/**
 * Public demo-request endpoint for the marketing landing page.
 *
 * Set DEMO_REQUEST_TO (plus the existing RESEND_API_KEY / RESEND_FROM_EMAIL) to receive the leads.
 * If it is not configured the request is refused with a clear error and the landing page shows the
 * mailto fallback, so a lead is never silently dropped.
 */

const MAX_LENGTHS: Record<string, number> = { name: 120, company: 160, email: 200, phone: 40, drivers: 40 };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill every field, people never see this one.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const fields: Record<string, string> = {};
  for (const [key, max] of Object.entries(MAX_LENGTHS)) {
    const raw = body[key];
    if (typeof raw === "string") fields[key] = raw.trim().slice(0, max);
  }

  if (!fields.name || !fields.company || !fields.email) {
    return NextResponse.json({ error: "Name, company and work email are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email)) {
    return NextResponse.json({ error: "That email address does not look valid." }, { status: 400 });
  }

  const to = process.env.DEMO_REQUEST_TO;
  if (!to || !process.env.RESEND_API_KEY) {
    console.error("[demo-request] Not configured (DEMO_REQUEST_TO / RESEND_API_KEY). Lead received:", fields);
    return NextResponse.json(
      { error: "Demo requests are not configured yet." },
      { status: 503 },
    );
  }

  const rows = Object.entries(fields)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;color:#555;text-transform:capitalize;">${escapeHtml(
          key,
        )}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  try {
    await sendReportEmail({
      to: to.split(",").map((address) => address.trim()).filter(Boolean),
      subject: `Demo request - ${fields.company}`,
      html: `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;color:#1a1a1a;">
        <h2 style="font-size:16px;margin:0 0 12px;">New demo request</h2>
        <table style="border-collapse:collapse;width:100%;">${rows}</table>
        <p style="font-size:12px;color:#999;margin-top:16px;">Sent from the /19a-compliance landing page.</p>
      </div>`,
    });
  } catch (error) {
    console.error("[demo-request] Failed to send:", error, "Lead received:", fields);
    return NextResponse.json({ error: "We could not send your request." }, { status: 502 });
  }

  // Best-effort auto-reply to the lead. The sales notification above already
  // went through, so a failure here (e.g. RESEND_FROM_EMAIL still on Resend's
  // sandbox sender, which can only deliver to the account owner) must not
  // fail the request — it just means the lead doesn't get the confirmation.
  try {
    await sendReportEmail({
      to: [fields.email],
      subject: "We received your RoadReady Compliance demo request",
      html: buildDemoRequestConfirmationHtml({ name: fields.name, contactEmail: CONTACT_EMAIL, contactPhone: CONTACT_PHONE }),
    });
  } catch (error) {
    console.error("[demo-request] Confirmation email to lead failed (check RESEND_FROM_EMAIL is a verified domain):", error);
  }

  return NextResponse.json({ ok: true });
}
