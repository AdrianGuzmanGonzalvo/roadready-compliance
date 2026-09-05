"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  slot: string;
  className?: string;
}

/**
 * A single Google AdSense ad unit. Renders nothing if
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID isn't set (e.g. local dev), so an
 * unconfigured environment never shows broken/placeholder ad markup. The
 * loader script itself lives once in the root layout (src/app/layout.tsx).
 */
export function AdBanner({ slot, className }: AdBannerProps) {
  const pushedRef = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet, or blocked by an ad blocker — no-op.
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
