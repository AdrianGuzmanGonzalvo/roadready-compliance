/**
 * Product analytics: one strongly typed entry point (`trackEvent`) that fans out to
 * pluggable destinations. The event catalog below is the single source of truth —
 * keep it in sync with analytics-plan.md.
 *
 * Privacy rules (non-negotiable — this app stores driver PII):
 * - Event properties are enums, counts and booleans only. Never driver names, license #s,
 *   SSNs, phones, emails, company/roster names, file names, search text or typed input.
 * - GA4 (loaded only by the marketing layout) only ever receives `marketing`-surface events.
 *   Events from the login page and the signed-in app go only to the product-analytics
 *   destinations: PostHog (registered in src/instrumentation-client.ts when
 *   NEXT_PUBLIC_POSTHOG_KEY is set) and the optional first-party NEXT_PUBLIC_ANALYTICS_ENDPOINT.
 */

import { FORM_FIELD_DEFS, type DriverStatusValue } from "@/types/driver";
import type { SessionUserDTO, UserRole } from "@/types/user";
import type { ReportScheduleFrequency } from "@/types/report-schedule";
import type { KpiStatusFilter } from "@/store/ui-store";
import type { ScorecardView } from "@/components/dashboard-new/scorecard-data";

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

// ---------------------------------------------------------------------------
// Event catalog
// ---------------------------------------------------------------------------

/** Which part of the site an event came from. Set by the <PageViewTracker> of each layout. */
export type AnalyticsSurface = "marketing" | "auth" | "app";

type NoProperties = Record<string, never>;

export type ModalName =
  | "upload_excel"
  | "add_driver"
  | "assign_company_roster"
  | "add_company"
  | "edit_company"
  | "add_user"
  | "edit_user"
  | "add_custom_form";

export type ModalLocation =
  | "sidebar"
  | "topbar"
  | "drivers_toolbar"
  | "bulk_actions"
  | "companies_header"
  | "companies_empty_state"
  | "company_card"
  | "users_card"
  | "forms_card";

export type DriverOpenSource = "driver_table" | "expiration_matrix" | "scorecard" | "soon_to_expire_report";

export type FilterName =
  | "driver_status_tab"
  | "form"
  | "expiration_window"
  | "company"
  | "report_form"
  | "report_driver_status";

export type FilterLocation = "drivers_list" | "topbar" | "soon_to_expire_report";

export interface AnalyticsEvents {
  // Acquisition — public marketing pages
  page_view: { path: string };
  cta_clicked: { cta: "request_demo" | "how_it_works" | "login"; location: "header" | "hero" };
  demo_request_submitted: { outcome: "success" | "rejected" | "network_error" };

  // Authentication
  login_submitted: { success: boolean };
  user_logged_out: { location: "sidebar" | "settings" };

  // Navigation & feature discovery inside the app
  modal_opened: { modal: ModalName; location: ModalLocation };
  driver_opened: { source: DriverOpenSource; scorecard_view?: ScorecardView };
  kpi_card_clicked: { kpi: KpiStatusFilter; dashboard: "classic" | "new"; active: boolean };
  scorecard_view_changed: { view: ScorecardView };
  /** `value` must be an enum-like value (use `formKeyForAnalytics` for form keys) — never free text. */
  filter_changed: { filter: FilterName; value: string; location: FilterLocation };
  filters_reset: { location: FilterLocation };

  // Driver records
  driver_import_completed:
    | { success: true; total: number; created: number; updated: number; warning_count: number }
    | { success: false };
  driver_created: { status: DriverStatusValue; has_company: boolean; has_roster: boolean };
  driver_updated: { status_changed: boolean; form_dates_changed: number };
  driver_status_changed: { from: DriverStatusValue; to: DriverStatusValue };
  driver_deleted: { location: "driver_drawer" | "driver_table" };
  drivers_bulk_assigned: { count: number; company_set: boolean; roster_set: boolean };
  drivers_bulk_deleted: { count: number };
  document_uploaded: { file_type: "pdf" | "image" | "other"; size_kb: number; has_custom_label: boolean };
  document_deleted: NoProperties;
  package_form_downloaded: NoProperties;

  // Reports
  report_exported: { report: "drivers_list" | "soon_to_expire"; format: "csv" | "xlsx" | "print"; row_count: number };
  report_schedule_created: { frequency: ReportScheduleFrequency; recipient_count: number };
  report_schedule_toggled: { enabled: boolean };
  report_schedule_deleted: NoProperties;

  // Administration
  company_created: { roster_count: number };
  company_updated: NoProperties;
  company_deleted: { roster_count: number };
  roster_created: NoProperties;
  roster_deleted: NoProperties;
  user_created: { role: UserRole };
  user_updated: { role: UserRole; password_changed: boolean };
  user_deleted: NoProperties;
  form_label_updated: { fields_changed: number; reset: boolean };
  custom_form_created: NoProperties;
  custom_form_updated: NoProperties;
  custom_form_deleted: NoProperties;
}

export type AnalyticsEventName = keyof AnalyticsEvents;

// ---------------------------------------------------------------------------
// Payload & destinations
// ---------------------------------------------------------------------------

export interface AnalyticsIdentity {
  /** Internal, pseudonymous user id — never the username. */
  user_id?: string;
  role?: UserRole;
  /** 4-digit tenant (company) code, for per-account analysis. */
  tenant?: string;
}

export interface AnalyticsContext extends AnalyticsIdentity {
  surface: AnalyticsSurface;
  path: string;
  session_id: string;
}

export interface AnalyticsPayload<E extends AnalyticsEventName = AnalyticsEventName> {
  event: E;
  properties: AnalyticsEvents[E];
  context: AnalyticsContext;
  timestamp: string;
}

/** Adapter for one analytics backend. Add vendors (PostHog, Mixpanel...) with `registerDestination`. */
export interface AnalyticsDestination {
  name: string;
  send(payload: AnalyticsPayload): void;
  identify?(identity: AnalyticsIdentity): void;
  reset?(): void;
}

const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ?? "";
const DEBUG = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
const SESSION_KEY = "rr-analytics-session";

const consoleDestination: AnalyticsDestination = {
  name: "console",
  send: (p) => console.info(`[analytics] ${p.event}`, p.properties, p.context),
};

/** Bridges to the gtag already loaded by the marketing layout. GA4 records its own page views. */
const ga4Destination: AnalyticsDestination = {
  name: "ga4",
  send: (p) => {
    if (p.context.surface !== "marketing" || p.event === "page_view" || !window.gtag) return;
    window.gtag("event", p.event, p.properties);
  },
};

/**
 * First-party collector: POSTs each payload as a JSON string. The body is sent as
 * text/plain (CORS-safelisted, so no preflight) — the collector should parse it as JSON.
 */
const endpointDestination: AnalyticsDestination = {
  name: "endpoint",
  send: (p) => {
    const body = JSON.stringify(p);
    if (navigator.sendBeacon?.(ENDPOINT, body)) return;
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
  },
};

const destinations: AnalyticsDestination[] = [
  ...(DEBUG ? [consoleDestination] : []),
  ga4Destination,
  ...(ENDPOINT ? [endpointDestination] : []),
];

/** Adds a destination; returns a function that removes it again. */
export function registerDestination(destination: AnalyticsDestination): () => void {
  destinations.push(destination);
  return () => {
    const i = destinations.indexOf(destination);
    if (i !== -1) destinations.splice(i, 1);
  };
}

function forEachDestination(fn: (d: AnalyticsDestination) => void) {
  for (const d of destinations) {
    try {
      fn(d);
    } catch (err) {
      // Analytics must never break the UI.
      if (DEBUG) console.warn(`[analytics] destination "${d.name}" failed`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let surface: AnalyticsSurface = "marketing";
let identity: AnalyticsIdentity = {};
let lastPageView: string | null = null;
let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
  } catch {
    // storage blocked — fall through to an in-memory id
  }
  if (!sessionId) {
    sessionId = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      // in-memory only
    }
  }
  return sessionId;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Records one event. Client-only; a no-op during server rendering. */
export function trackEvent<E extends AnalyticsEventName>(event: E, properties: AnalyticsEvents[E]): void {
  if (typeof window === "undefined") return;
  const payload: AnalyticsPayload<E> = {
    event,
    properties,
    context: { surface, path: window.location.pathname, session_id: getSessionId(), ...identity },
    timestamp: new Date().toISOString(),
  };
  forEachDestination((d) => d.send(payload));
}

/**
 * Records `page_view` for a pathname (never the query string, which can hold filters/search).
 * Deduped so React Strict Mode's double effects and same-path re-renders count once.
 */
export function trackPageView(path: string, pageSurface: AnalyticsSurface): void {
  surface = pageSurface;
  const key = `${pageSurface}:${path}`;
  if (key === lastPageView) return;
  lastPageView = key;
  trackEvent("page_view", { path });
}

/** Attaches the signed-in user to every later event. Takes only non-PII fields. */
export function identifyUser(user: Pick<SessionUserDTO, "id" | "role" | "tenantCode">): void {
  if (identity.user_id === user.id && identity.role === user.role && identity.tenant === user.tenantCode) return;
  identity = { user_id: user.id, role: user.role, tenant: user.tenantCode };
  forEachDestination((d) => d.identify?.(identity));
}

/** Call on sign-out: forgets the user and starts a fresh session. */
export function resetAnalytics(): void {
  identity = {};
  sessionId = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing stored
  }
  forEachDestination((d) => d.reset?.());
}

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

const BUILT_IN_FORM_KEYS = new Set<string>(FORM_FIELD_DEFS.map((f) => f.key));

/** Built-in form keys are code identifiers; custom-form keys are derived from typed labels, so they're masked. */
export function formKeyForAnalytics(key: string): string {
  return key === "ALL" || BUILT_IN_FORM_KEYS.has(key) ? key : "custom";
}

export function fileTypeForAnalytics(contentType: string): AnalyticsEvents["document_uploaded"]["file_type"] {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("image/")) return "image";
  return "other";
}
