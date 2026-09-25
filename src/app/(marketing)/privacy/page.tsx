import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Privacy policy | RoadReady Compliance",
  description: "How RoadReady Compliance handles the information submitted through this website.",
};

/**
 * DRAFT - written from what this site actually collects (the demo-request form).
 * TODO(you): have it reviewed before you run ads, and add your legal entity, address and
 * retention periods. Google requires a privacy policy on pages that collect personal data.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Draft - pending legal review.</p>

      <div className="mt-8 flex flex-col gap-6 text-neutral-700">
        <section>
          <h2 className="text-lg font-medium text-neutral-900">What we collect on this website</h2>
          <p className="mt-2">
            If you submit the demo request form we collect the name, company, work email, and optionally the
            phone number and fleet size that you type into it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-neutral-900">Why we collect it</h2>
          <p className="mt-2">
            Only to reply to your request and arrange a demonstration. We do not sell it, and we do not use it
            for unrelated marketing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-neutral-900">Analytics and advertising</h2>
          <p className="mt-2">
            This site may use Google Analytics 4 to understand which pages and advertisements bring visitors
            here. It records usage data such as pages viewed and approximate location, and it records when a
            demo request is submitted. It does not receive the contents of the form.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-neutral-900">Customer data inside the application</h2>
          <p className="mt-2">
            Driver compliance records that customers store in the signed-in application are separate from this
            website. Each company&apos;s records are kept in that company&apos;s own database and are used only to
            provide the service to that company.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-neutral-900">Product usage analytics</h2>
          <p className="mt-2">
            To improve the service we use PostHog to count how its features are used, for example which pages are
            opened, when a roster is imported or when a report is exported. These records contain only the type of
            action, counts, and an internal account ID with its role and company code. They never contain driver records, names,
            license numbers, contact details or anything typed into the application, and we do not record your
            screen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-neutral-900">Your choices</h2>
          <p className="mt-2">
            Write to{" "}
            <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            to ask what we hold about you, to correct it, or to have it deleted.
          </p>
        </section>
      </div>
    </article>
  );
}
