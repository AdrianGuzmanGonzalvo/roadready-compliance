import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | RoadReady Compliance",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="size-5 text-neutral-900" />
          <span className="font-semibold text-neutral-900">RoadReady Compliance</span>
        </div>

        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 mb-6">Last updated: September 4, 2026</p>

        <div className="space-y-5 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-neutral-900 mb-1">Overview</h2>
            <p>
              RoadReady Compliance ("we," "us") provides a driver qualification and compliance
              tracking system used by transportation companies. This page explains what
              information this website collects and how it is used, including information
              collected through advertising on this site.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-1">Information we collect</h2>
            <p>
              Companies that use RoadReady Compliance submit driver records (such as name, license
              information, and compliance form dates) to track regulatory compliance on their own
              behalf. This data is stored in a database isolated to that company and is only
              accessible to that company's authorized users. We do not sell or share this data with
              third parties.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-1">Cookies and advertising</h2>
            <p>
              This site uses Google AdSense to display advertising. Google and its partners may use
              cookies (including the DoubleClick cookie) to serve ads based on your prior visits to
              this or other websites. You can opt out of personalized advertising by visiting{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900"
              >
                Google Ads Settings
              </a>
              , or opt out of third-party vendor use of cookies for personalized advertising by
              visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-900"
              >
                www.aboutads.info
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-1">Data security</h2>
            <p>
              Driver records are stored in encrypted, access-controlled databases. Account access
              requires authentication, and each company's data is kept in a database isolated from
              every other company's.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-1">Contact</h2>
            <p>
              Questions about this policy can be sent to{" "}
              <a href="mailto:privacy@roadready-compliance.example" className="underline hover:text-neutral-900">
                privacy@roadready-compliance.example
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
