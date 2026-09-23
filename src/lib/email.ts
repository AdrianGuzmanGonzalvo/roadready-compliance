import { Resend } from "resend";
import type { DueSoonEntry } from "@/lib/compliance";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(apiKey);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
}

/** Builds the HTML body for a "Soon to Expire" digest email. */
export function buildSoonToExpireEmailHtml(params: {
  tenantName: string;
  entries: DueSoonEntry[];
  appUrl: string;
}): string {
  const { tenantName, entries, appUrl } = params;
  const expiredCount = entries.filter((e) => e.status === "expired").length;
  const expiringCount = entries.length - expiredCount;

  const rows = entries
    .slice(0, 50)
    .map((e) => {
      const badgeColor = e.status === "expired" ? "#b91c1c" : "#b45309";
      const badgeBg = e.status === "expired" ? "#fef2f2" : "#fffbeb";
      const days = e.daysRemaining < 0 ? `${Math.abs(e.daysRemaining)}d overdue` : `${e.daysRemaining}d left`;
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(e.lastName)}, ${escapeHtml(e.firstName)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;color:#555;">${escapeHtml(e.company ?? "—")}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(e.formLabel)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;">${formatDate(e.date)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;color:${badgeColor};background:${badgeBg};border:1px solid ${badgeColor}33;">${days}</span>
        </td>
      </tr>`;
    })
    .join("");

  const truncatedNote =
    entries.length > 50 ? `<p style="font-size:12px;color:#999;">Showing the 50 most urgent of ${entries.length} total. See the full report in the app.</p>` : "";

  return `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
    <div style="padding:20px 0;border-bottom:2px solid #171717;margin-bottom:16px;">
      <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:.05em;">RoadReady Compliance</p>
      <h1 style="margin:4px 0 0;font-size:20px;">Soon to Expire — ${escapeHtml(tenantName)}</h1>
    </div>
    <p style="font-size:14px;color:#444;">
      <strong style="color:#b91c1c;">${expiredCount} expired</strong> and
      <strong style="color:#b45309;">${expiringCount} expiring within 30 days</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:#666;text-transform:uppercase;border-bottom:2px solid #eee;">Driver</th>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:#666;text-transform:uppercase;border-bottom:2px solid #eee;">Company</th>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:#666;text-transform:uppercase;border-bottom:2px solid #eee;">Form</th>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:#666;text-transform:uppercase;border-bottom:2px solid #eee;">Due</th>
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:#666;text-transform:uppercase;border-bottom:2px solid #eee;">Status</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#999;font-size:13px;">Nothing expired or expiring soon 🎉</td></tr>`}</tbody>
    </table>
    ${truncatedNote}
    <a href="${appUrl}/reports/soon-to-expire" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#171717;color:white;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">View full report</a>
    <p style="margin-top:24px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px;">
      You're receiving this because a scheduled report is configured in RoadReady Compliance. Manage schedules under Reports → Soon to Expire.
    </p>
  </div>`;
}

/** Builds the auto-reply sent to a lead right after they submit the demo-request form. */
export function buildDemoRequestConfirmationHtml(params: { name: string; contactEmail: string; contactPhone: string }): string {
  const { name, contactEmail, contactPhone } = params;
  const firstName = escapeHtml(name.trim().split(/\s+/)[0] || name);
  return `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
    <div style="padding:20px 0;border-bottom:2px solid #171717;margin-bottom:16px;">
      <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:.05em;">RoadReady Compliance</p>
      <h1 style="margin:4px 0 0;font-size:20px;">Thanks, ${firstName} — we've got your request</h1>
    </div>
    <p style="font-size:14px;color:#444;line-height:1.6;">
      We received your demo request for RoadReady Compliance and will reach out within one business day to
      schedule a walkthrough for your fleet.
    </p>
    <p style="font-size:14px;color:#444;line-height:1.6;">
      In the meantime, if anything is urgent, reply to this email or reach us directly:
    </p>
    <p style="font-size:14px;color:#444;">
      <a href="mailto:${contactEmail}" style="color:#171717;font-weight:600;">${contactEmail}</a>${
        contactPhone ? ` &nbsp;·&nbsp; <a href="tel:${contactPhone}" style="color:#171717;font-weight:600;">${escapeHtml(contactPhone)}</a>` : ""
      }
    </p>
    <p style="margin-top:24px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px;">
      You're receiving this because you requested a demo at roadready-compliance.vercel.app/19a-compliance.
    </p>
  </div>`;
}

export async function sendReportEmail(params: { to: string[]; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? "RoadReady Compliance <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
