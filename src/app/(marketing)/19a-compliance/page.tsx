import type { Metadata } from "next";
import { CheckCircle2, FileSpreadsheet, FolderOpen, CalendarClock, ShieldCheck } from "lucide-react";
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
    title: "Import your roster",
    body: "Bring your drivers in from the Excel file you already keep.",
  },
  {
    icon: FolderOpen,
    title: "Attach the records",
    body: "Store each form and its scanned document against the right driver.",
  },
  {
    icon: CalendarClock,
    title: "Watch the dates",
    body: "See expired and soon-to-expire records, and get the list by email on a schedule.",
  },
];

export default function Article19APage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px]"
          style={{ background: "radial-gradient(600px 300px at 50% 0%, rgba(79,70,229,0.07), transparent 70%)" }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <ShieldCheck className="size-3.5" />
            Article 19-A Driver Qualification Records
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Keep every 19-A driver file in one place
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600 text-pretty">
            Driver rosters, the nine required compliance forms and every expiration date, together — so nothing
            is found missing during an audit.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href="#request-demo"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Request a demo
            </a>
            <p className="text-sm text-neutral-500">
              or write to{" "}
              <a className="font-medium text-neutral-700 underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              {CONTACT_PHONE ? (
                <>
                  {" "}
                  ·{" "}
                  <a className="font-medium text-neutral-700 underline underline-offset-4" href={`tel:${CONTACT_PHONE}`}>
                    {CONTACT_PHONE}
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      {/* The nine forms — one quiet line, not nine boxes */}
      <section className="border-y border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">Forms tracked</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {TRACKED_FORMS.map((form, i) => (
              <span key={form}>
                <span className="font-medium text-neutral-800">{form}</span>
                {i < TRACKED_FORMS.length - 1 ? <span className="text-neutral-300"> &nbsp;·&nbsp; </span> : null}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <Icon className="size-5 text-indigo-600" />
              </div>
              <h3 className="mt-4 font-medium text-neutral-900">{title}</h3>
              <p className="mt-1.5 text-sm text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities — a checklist, not a wall of cards */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
          <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-neutral-900">{c.title}</h3>
                  <p className="mt-0.5 text-sm text-neutral-600">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-neutral-500">
            Each company works in its own isolated database and signs in with its own company code.
          </p>
        </div>
      </section>

      {/* Demo request */}
      <section id="request-demo" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-3 lg:pt-2">
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
