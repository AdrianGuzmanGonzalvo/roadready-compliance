"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_EMAIL } from "@/lib/marketing";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Self-contained "floating card": renders its own title, fields and submit
 * button as one card, so callers don't need to wrap it in another one.
 */
export function DemoRequestForm() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        trackEvent("demo_request_submitted", { outcome: "rejected" });
        setStatus("error");
        setError(body.error ?? "We could not send your request.");
        return;
      }
      // Conversion signal for GA4 / Google Ads. Fires only after the server accepted the request.
      window.gtag?.("event", "generate_lead", { form: "demo_request" });
      trackEvent("demo_request_submitted", { outcome: "success" });
      form.reset();
      setStatus("sent");
    } catch {
      trackEvent("demo_request_submitted", { outcome: "network_error" });
      setStatus("error");
      setError("We could not reach the server.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl shadow-blue-950/10 sm:p-7">
        <h2 className="text-lg font-bold text-neutral-900">Thank you — your request is on its way.</h2>
        <p className="mt-2 text-sm text-neutral-600">
          We will get back to you by email. If it is urgent, write to{" "}
          <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl shadow-blue-950/10 sm:p-7">
      <h2 className="text-lg font-bold text-neutral-900">Request a Personalized Demo</h2>
      <p className="mt-1 text-sm text-neutral-500">
        See how RoadReady keeps your 19-A files audit-ready. Fill out the form below.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required maxLength={120} autoComplete="name" placeholder="John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              placeholder="john@company.com"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">Company name</Label>
            <Input id="company" name="company" required maxLength={160} autoComplete="organization" placeholder="Acme Transportation" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drivers">Drivers tracked (optional)</Label>
            <Input id="drivers" name="drivers" maxLength={40} inputMode="numeric" placeholder="e.g. 50" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input id="phone" name="phone" maxLength={40} autoComplete="tel" placeholder="+1 (555) 123-4567" />
        </div>

        {/* Honeypot: real people never see or fill this. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

        {error ? (
          <p className="text-sm text-red-700">
            {error} You can email us directly at{" "}
            <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        ) : null}

        <Button type="submit" disabled={status === "sending"} className="w-full bg-blue-600 hover:bg-blue-700">
          {status === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending
            </>
          ) : (
            "Request My Demo"
          )}
        </Button>
      </form>
    </div>
  );
}
