import type { PostHog } from "posthog-js";
import type { AnalyticsDestination } from "@/lib/analytics";

/**
 * Forwards the typed events from src/lib/analytics.ts to PostHog. `page_view` is sent as
 * PostHog's own `$pageview` so its built-in page and path reports work.
 */
export function createPostHogDestination(posthog: PostHog): AnalyticsDestination {
  return {
    name: "posthog",
    send: (p) => {
      posthog.capture(p.event === "page_view" ? "$pageview" : p.event, {
        ...p.properties,
        surface: p.context.surface,
        role: p.context.role,
        tenant: p.context.tenant,
      });
    },
    identify: (identity) => {
      if (!identity.user_id) return;
      posthog.identify(identity.user_id, { role: identity.role, tenant: identity.tenant });
    },
    reset: () => posthog.reset(),
  };
}
