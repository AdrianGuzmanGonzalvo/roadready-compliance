import type { Metadata } from "next";
import { CalendarClock, FileSpreadsheet, FolderOpen, Mail, ShieldCheck } from "lucide-react";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { CAPABILITIES, CONTACT_EMAIL, CONTACT_PHONE, TRACKED_FORMS } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Article 19-A Compliance Software | RoadReady Compliance",
  description:
    "Track Article 19-A Driver Qualification Records in one place: driver rosters, the nine required forms and expiration status at a glance.",
  alternates: { canonical: "/19a-compliance" },
};

const STEPS = [
  {
    icon: FileSpreadsheet,
    title: "1. Import your roster",
    body: "Bring your drivers in from the Excel file you already keep.",
  },
  {
    icon: FolderOpen,
    title: "2. Attach the records",
    body: "Store each form and its scanned document against the right driver.",
  },
  {
    icon: CalendarClock,
    title: "3. Watch the dates",
    body: "See expired and soon-to-expire records, and get the list by email on a schedule.",
  },
];

export default function Article19APage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        <div className="flex max-w-3xl flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
            <ShieldCheck className="size-3.5" />
            Article 19-A Driver Qualification Records
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep every 19-A driver file in one place
          </h1>
          <p className="text-lg text-neutral-600">
            Driver compliance tracking for Article 19-A fleets: RoadReady Compliance keeps driver rosters, the
            nine required compliance forms and every expiration date in one place, so nothing is found missing
            during an audit.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#request-demo"
              className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request a demo
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-200 px-5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
            >
              <Mail className="size-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
          {CONTACT_PHONE ? (
            <p className="text-sm text-neutral-600">
              Prefer the phone?{" "}
              <a className="font-medium underline underline-offset-4" href={`tel:${CONTACT_PHONE}`}>
                {CONTACT_PHONE}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      {/* The nine forms */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Forms tracked</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {TRACKED_FORMS.map((form) => (
              <li
                key={form}
                className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800"
              >
                {form}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <Icon className="size-5 text-neutral-900" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-medium">{c.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-neutral-600">
            Each company works in its own isolated database and signs in with its own company code.
          </p>
        </div>
      </section>

      {/* Demo request */}
      <section id="request-demo" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Request a demo</h2>
            <p className="text-neutral-600">
              Tell us about your fleet and we will walk you through how your 19-A records would look in
              RoadReady Compliance.
            </p>
            <p className="text-sm text-neutral-500">
              We use your details only to reply to this request. See our{" "}
              <a className="underline underline-offset-4" href="/privacy">
                privacy policy
              </a>
              .
            </p>
          </div>
          <DemoRequestForm />
        </div>
      </section>
    </>
  );
}
