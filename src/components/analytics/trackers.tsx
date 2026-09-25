"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  identifyUser,
  trackEvent,
  trackPageView,
  type AnalyticsEventName,
  type AnalyticsEvents,
  type AnalyticsSurface,
} from "@/lib/analytics";

/**
 * Emits `page_view` on mount and on every client-side navigation under the layout that
 * renders it. Mounted once per route group so each event carries the right surface.
 */
export function PageViewTracker({ surface }: { surface: AnalyticsSurface }) {
  const pathname = usePathname();

  React.useEffect(() => {
    trackPageView(pathname, surface);
  }, [pathname, surface]);

  return null;
}

/** Attaches the signed-in user (id, role, tenant code — never the username) to later events. */
export function AnalyticsIdentity() {
  const { data: user } = useCurrentUser();

  React.useEffect(() => {
    if (user) identifyUser(user);
  }, [user]);

  return null;
}

type TrackedLinkProps<E extends AnalyticsEventName> = Omit<React.ComponentPropsWithoutRef<"a">, "href" | "onClick"> & {
  href: string;
  event: E;
  properties: AnalyticsEvents[E];
};

/**
 * A link that records an event when clicked, so Server Components can track CTAs without
 * becoming Client Components. App routes ("/...") use next/link; hashes and external URLs
 * stay plain anchors.
 */
export function TrackedLink<E extends AnalyticsEventName>({ href, event, properties, ...rest }: TrackedLinkProps<E>) {
  const onClick = () => trackEvent(event, properties);
  return href.startsWith("/") ? (
    <Link href={href} onClick={onClick} {...rest} />
  ) : (
    <a href={href} onClick={onClick} {...rest} />
  );
}
