import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { ShieldCheck } from "lucide-react";
import { CONTACT_EMAIL, GA_MEASUREMENT_ID } from "@/lib/marketing";
import { PageViewTracker, TrackedLink } from "@/components/analytics/trackers";

/**
 * Public (unauthenticated) pages: landing page and privacy policy.
 * GA4 is loaded ONLY here, never inside the signed-in application — src/lib/analytics.ts
 * forwards only marketing-surface events to it.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white text-neutral-900">
      <PageViewTracker surface="marketing" />
      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      ) : null}

      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <ShieldCheck className="size-7 text-blue-600" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-neutral-900">ROADREADY</span>
              <span className="block text-[10px] font-semibold tracking-widest text-neutral-500">COMPLIANCE</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <TrackedLink
              href="/login"
              event="cta_clicked"
              properties={{ cta: "login", location: "header" }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Login
            </TrackedLink>
            <TrackedLink
              href="#request-demo"
              event="cta_clicked"
              properties={{ cta: "request_demo", location: "header" }}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Request a demo
            </TrackedLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>RoadReady Compliance</span>
          <div className="flex items-center gap-4">
            <a className="underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <Link className="underline-offset-4 hover:underline" href="/privacy">
              Privacy policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
