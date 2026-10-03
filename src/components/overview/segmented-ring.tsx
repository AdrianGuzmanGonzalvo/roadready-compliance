import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/compliance";

/** Stroke twins of STATUS_SOLID_CLASS, for SVG arcs. */
export const STATUS_STROKE_CLASS: Record<ComplianceStatus, string> = {
  expired: "stroke-red-500",
  expiring_30: "stroke-amber-400",
  expiring_60: "stroke-orange-500",
  compliant: "stroke-emerald-500",
  missing: "stroke-neutral-300",
};

export interface RingSegment {
  key: string;
  value: number;
  strokeClass: string;
  /** Shown when the pointer rests on this arc. */
  title?: string;
}

const GAP = 2;

/** Donut / progress ring: segments drawn clockwise from 12 o'clock, separated by a small gap. */
export function SegmentedRing({
  segments,
  size,
  thickness,
  label,
  className,
  children,
}: {
  segments: RingSegment[];
  size: number;
  thickness: number;
  /** Text alternative for the whole ring. */
  label: string;
  /** Width classes for a ring that resizes by breakpoint; `size` then only sets its proportions. */
  className?: string;
  children?: ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  const gap = visible.length > 1 ? GAP : 0;

  const arcs = visible.reduce<{ key: string; strokeClass: string; title?: string; dash: number; start: number }[]>(
    (acc, s) => {
      const prev = acc[acc.length - 1];
      const start = prev ? prev.start + prev.dash + gap : 0;
      const dash = Math.max((s.value / total) * circumference - gap, 0.5);
      acc.push({ key: s.key, strokeClass: s.strokeClass, title: s.title, dash, start });
      return acc;
    },
    []
  );

  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      style={className ? undefined : { width: size }}
      role="img"
      aria-label={label}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" fill="none" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-neutral-100" strokeWidth={thickness} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={a.strokeClass}
            strokeWidth={thickness}
            strokeDasharray={`${a.dash} ${circumference - a.dash}`}
            strokeDashoffset={-a.start}
          >
            {a.title && <title>{a.title}</title>}
          </circle>
        ))}
      </svg>
      {/* pointer-events-none: the centre text sits over the whole ring and would swallow the arcs' hover. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
