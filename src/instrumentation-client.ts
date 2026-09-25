import posthog from "posthog-js";
import { registerDestination } from "@/lib/analytics";
import { createPostHogDestination } from "@/lib/analytics-posthog";

// Runs in the browser before hydration (see node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/instrumentation-client.md). Without NEXT_PUBLIC_POSTHOG_KEY nothing is loaded.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (POSTHOG_KEY) {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Privacy: only the typed events from src/lib/analytics.ts are sent. Everything automatic stays
      // off — autocapture, rage/dead clicks and heatmaps record element text, and replays record the
      // screen, both of which would include driver PII.
      autocapture: false,
      rageclick: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      disable_session_recording: true,
      capture_pageview: false, // <PageViewTracker> sends page_view
      capture_pageleave: false,
      capture_performance: false,
      capture_exceptions: false,
      disable_surveys: true,
      person_profiles: "identified_only",
    });
    // Lets local testing be filtered out in PostHog (app_env = "development").
    posthog.register({ app_env: process.env.NODE_ENV });
    registerDestination(createPostHogDestination(posthog));
  } catch (err) {
    // Analytics must never block the app from starting.
    if (process.env.NODE_ENV === "development") console.warn("[analytics] PostHog init failed", err);
  }
}
