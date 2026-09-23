"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_EMAIL } from "@/lib/marketing";

type Status = "idle" | "sending" | "sent" | "error";

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

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
        setStatus("error");
        setError(body.error ?? "We could not send your request.");
        return;
      }
      // Conversion signal for GA4 / Google Ads. Fires only after the server accepted the request.
      window.gtag?.("event", "generate_lead", { form: "demo_request" });
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("We could not reach the server.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-medium">Thank you - your request is on its way.</h3>
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={120} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required maxLength={160} autoComplete="organization" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" maxLength={40} autoComplete="tel" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="drivers">How many drivers do you track? (optional)</Label>
        <Input id="drivers" name="drivers" maxLength={40} inputMode="numeric" />
      </div>

      {/* Honeypot: real people never see or fill this. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error ? (
        <p className="text-sm text-red-700">
          {error} You can email us directly at{" "}
          <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending
          </>
        ) : (
          "Request a demo"
        )}
      </Button>
    </form>
  );
}
