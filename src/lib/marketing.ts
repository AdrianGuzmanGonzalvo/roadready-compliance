/**
 * Public marketing page configuration.
 *
 * TODO(you): replace CONTACT_EMAIL / CONTACT_PHONE with the real ones (or set the env vars).
 * Google Ads requires a reachable contact method and a privacy policy on pages that collect
 * personal data, and visitors convert better when they can reach a human.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "REPLACE_ME@example.com";
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";

/** GA4 measurement id (G-XXXXXXX). When unset, no analytics script is loaded at all. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/**
 * The nine tracked compliance forms. These are the forms the application itself tracks -
 * keep this list in sync with the app, and do not add forms that are not supported.
 */
export const TRACKED_FORMS = [
  "MCSA-5876",
  "DS-703",
  "DS-704",
  "License Expiration",
  "DS-870",
  "DS-872",
  "DS-873",
  "DS-875",
  "DS-875Y",
] as const;

/** Product capabilities that exist today. Every claim on the landing page must map to one of these. */
export const CAPABILITIES = [
  {
    title: "Driver rosters in one place",
    body: "Keep every driver's qualification record together, with the company each one belongs to.",
  },
  {
    title: "The nine tracked forms",
    body: "MCSA-5876, DS-703, DS-704, License Expiration, DS-870, DS-872, DS-873, DS-875 and DS-875Y.",
  },
  {
    title: "Expiration status at a glance",
    body: "See what is expired and what is coming due, without opening a single folder.",
  },
  {
    title: "Import your roster from Excel",
    body: "Bring drivers in from the spreadsheet you already maintain instead of retyping them.",
  },
  {
    title: "Store the supporting documents",
    body: "Attach the scanned document to the driver and the form it belongs to.",
  },
  {
    title: "Scheduled email reports",
    body: "Have the soon-to-expire list delivered to your inbox on a schedule you choose.",
  },
] as const;
