import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { ShieldCheck } from "lucide-react";
import { CONTACT_EMAIL, GA_MEASUREMENT_ID } from "@/lib/marketing";

/**
 * Public (unauthenticated) pages: landing page and privacy policy.
 * Analytics is loaded ONLY here, never inside the signed-in application.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white text-neutral-900">
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
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/19a-compliance" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-indigo-600" />
            RoadReady Compliance
          </Link>
          <Link
            href="/login"
            className="text-sm text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
          >
            Customer sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
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
