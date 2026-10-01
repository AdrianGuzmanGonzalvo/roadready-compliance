"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AreaPoint {
  key: string;
  /** Axis label, e.g. "Oct". */
  label: string;
  /** Optional second axis line, e.g. the year under the first month and each January. */
  sublabel?: string;
  /** Tooltip heading, e.g. "Oct 2026". */
  title: string;
  value: number;
  /** Optional extra tooltip line. */
  detail?: string;
}

/** Rounds the axis top up to a 1/2/5 step so the gridlines land on clean numbers. */
function niceScale(max: number): { top: number; ticks: number[] } {
  const rough = Math.max(max, 1) / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return { top, ticks };
}

/**
 * Single-series area chart. The shapes live in a stretched SVG; labels, dots and the
 * tooltip are HTML positioned by percentage, so text never distorts as the card resizes.
 */
export function AreaChart({ points, unit, caption }: { points: AreaPoint[]; unit: string; caption: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const n = points.length;
  const values = points.map((p) => p.value);
  const { top, ticks } = niceScale(Math.max(0, ...values));
  const xs = points.map((_, i) => ((i + 0.5) / n) * 100);
  const ys = values.map((v) => 100 - (v / top) * 100);
  const line = points.map((_, i) => `${xs[i]},${ys[i]}`).join(" ");
  const peak = values.indexOf(Math.max(...values));
  const active = hovered === null ? null : points[hovered];

  return (
    <div className="flex gap-2 pt-5">
      <div className="relative h-44 w-7 shrink-0" aria-hidden>
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-neutral-400"
            style={{ top: `${100 - (t / top) * 100}%` }}
          >
            {t.toLocaleString()}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-44" onMouseLeave={() => setHovered(null)}>
          <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {ticks.map((t) => {
              const y = 100 - (t / top) * 100;
              return (
                <line key={t} x1={0} x2={100} y1={y} y2={y} className="stroke-neutral-100" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              );
            })}
            <polygon points={`${xs[0]},100 ${line} ${xs[n - 1]},100`} className="fill-blue-600/10" />
            <polyline
              points={line}
              fill="none"
              className="stroke-blue-600"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {hovered !== null && <div className="absolute inset-y-0 w-px bg-neutral-300" style={{ left: `${xs[hovered]}%` }} />}

          {points.map((p, i) => (
            <span
              key={p.key}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 ring-2 ring-white transition-[width,height]",
                hovered === i ? "size-3" : "size-2"
              )}
              style={{ left: `${xs[i]}%`, top: `${ys[i]}%` }}
            />
          ))}

          {/* Direct label on the peak only — the axis and tooltip carry the rest. */}
          {hovered === null && values[peak] > 0 && (
            <span
              className="absolute -translate-x-1/2 -translate-y-full pb-2 text-[11px] font-semibold text-neutral-700"
              style={{ left: `${xs[peak]}%`, top: `${ys[peak]}%` }}
            >
              {values[peak].toLocaleString()}
            </span>
          )}

          <div className="absolute inset-0 flex">
            {points.map((p, i) => (
              <div key={p.key} className="flex-1" onMouseEnter={() => setHovered(i)} />
            ))}
          </div>

          {active && hovered !== null && (
            <div
              className={cn(
                "pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs shadow-md",
                hovered > n - 3 ? "-translate-x-full" : hovered > 1 && "-translate-x-1/2"
              )}
              style={{ left: `${xs[hovered]}%`, top: `calc(${ys[hovered]}% - 10px)` }}
            >
              <p className="font-medium text-neutral-500">{active.title}</p>
              <p className="font-semibold text-neutral-900">
                {active.value.toLocaleString()} {unit}
              </p>
              {active.detail && <p className="text-neutral-500">{active.detail}</p>}
            </div>
          )}
        </div>

        <div className="mt-2 flex" aria-hidden>
          {points.map((p, i) => (
            <div key={p.key} className="flex-1 text-center text-[10px] leading-tight text-neutral-400">
              <span className={cn("block", i % 2 === 1 && "max-sm:invisible")}>{p.label}</span>
              {p.sublabel && <span className="block text-neutral-300">{p.sublabel}</span>}
            </div>
          ))}
        </div>

        {/* sr-only goes on a wrapper: a table ignores the 1px width and would widen the page. */}
        <div className="sr-only">
          <table>
            <caption>{caption}</caption>
            <tbody>
              {points.map((p) => (
                <tr key={p.key}>
                  <th scope="row">{p.title}</th>
                  <td>
                    {p.value} {unit}
                    {p.detail ? ` (${p.detail})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
