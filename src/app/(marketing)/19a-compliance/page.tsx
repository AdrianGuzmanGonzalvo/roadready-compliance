import type { Metadata } from "next";
import { CheckCircle2, FileSpreadsheet, FolderOpen, CalendarClock, Users, ShieldCheck, Mail } from "lucide-react";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { CAPABILITIES, TRACKED_FORMS } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Article 19-A Compliance Software | RoadReady Compliance",
  description:
    "Track Article 19-A Driver Qualification Records in one place: driver rosters, the nine required forms and expiration status at a glance.",
  // Served at "/" for signed-out visitors (see proxy.ts) as well as here directly — "/" is canonical.
  alternates: { canonical: "/" },
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

const HERO_HIGHLIGHTS = [
  { icon: Users, title: "Driver rosters", body: "Every file, one place." },
  { icon: ShieldCheck, title: "9 tracked forms", body: "MCSA-5876 through DS-875Y." },
  { icon: CalendarClock, title: "Expiration alerts", body: "Expired and due-soon, at a glance." },
  { icon: Mail, title: "Scheduled reports", body: "The due list, emailed on schedule." },
];

export default function Article19APage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-white">
        {/* Diagonal navy/blue background, right side only */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
          <div
            className="absolute inset-y-0 right-0 w-[62%]"
            style={{
              clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)",
              background: "linear-gradient(160deg, #0B1330 0%, #142257 55%, #1E3A8A 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[62%] opacity-70"
            style={{
              clipPath: "polygon(46% 0, 100% 0, 100% 100%, 30% 100%)",
              background: "linear-gradient(160deg, #1D4ED8 0%, #2563EB 100%)",
            }}
          />
          <div
            className="absolute right-6 top-10 size-40"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.35) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div
            className="absolute right-10 bottom-10 size-32"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.25) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div
            className="absolute left-6 bottom-6 size-32"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(0,0,0,.08) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                <ShieldCheck className="size-4" />
                Article 19-A Driver Qualification Records
              </span>
              <h1 className="mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-neutral-900 sm:text-5xl">
                Simplify 19-A Compliance.
                <br />
                Reduce Risk.
                <br />
                <span className="text-blue-600">Stay RoadReady.</span>
              </h1>
              <p className="mt-5 max-w-md text-base text-neutral-600 text-pretty sm:text-lg">
                Keep every driver&apos;s file, the nine required compliance forms and every expiration date in one
                place — so nothing is found missing during an audit.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#request-demo"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Request a demo
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 px-7 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Floating demo request card */}
            <div id="request-demo" className="scroll-mt-20 lg:pl-4">
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* Quick highlights — its own plain-background section, never under the hero's dark shapes */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {HERO_HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-3 font-semibold text-neutral-900">{title}</h3>
                <p className="mt-0.5 text-sm text-neutral-500">{body}</p>
              </div>
            ))}
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
      <section id="how-it-works" className="mx-auto w-full max-w-4xl scroll-mt-16 px-4 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <Icon className="size-5 text-blue-600" />
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
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-600" />
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
    </>
  );
}
