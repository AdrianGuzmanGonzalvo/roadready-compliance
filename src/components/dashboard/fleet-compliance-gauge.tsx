"use client";

import { summarizeDriverStatuses } from "@/lib/compliance";
import { useFormFieldDefs } from "@/hooks/use-form-labels";
import type { DriverDTO } from "@/types/driver";

const ARC_RADIUS = 96;
const ARC_LENGTH = Math.PI * ARC_RADIUS;

export function FleetComplianceGauge({ drivers }: { drivers: DriverDTO[] }) {
  const formFieldDefs = useFormFieldDefs();
  const active = drivers.filter((d) => d.status === "ACTIVE");
  const summary = summarizeDriverStatuses(active, new Date(), formFieldDefs);

  const tracked = summary.total - summary.missing;
  const pct = tracked > 0 ? Math.round((summary.compliant / tracked) * 100) : 0;
  const offset = ARC_LENGTH - (pct / 100) * ARC_LENGTH;

  const rows = [
    { label: "Compliant", count: summary.compliant, dot: "bg-emerald-400" },
    { label: "Expiring in 60 days", count: summary.expiring60, dot: "bg-orange-400" },
    { label: "Expiring in 30 days", count: summary.expiring30, dot: "bg-amber-400" },
    { label: "Expired", count: summary.expired, dot: "bg-red-400" },
  ];

  return (
    <div className="rounded-2xl bg-neutral-900 p-6 text-white relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120px 120px at 90% -10%, rgba(255,255,255,.12), transparent 70%)" }}
      />
      <div className="relative text-sm font-semibold text-neutral-300">Fleet Compliance Score</div>

      <div className="relative flex justify-center mt-1.5">
        <svg width="220" height="130" viewBox="0 0 220 130">
          <path d="M14 116 A96 96 0 0 1 206 116" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="16" strokeLinecap="round" />
          <path
            d="M14 116 A96 96 0 0 1 206 116"
            fill="none"
            stroke="#34D399"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute top-[58px] left-0 right-0 text-center">
          <div className="text-4xl font-extrabold tracking-tight">{pct}%</div>
          <div className="text-[11.5px] font-semibold text-neutral-400 mt-0.5">of active drivers fully compliant</div>
        </div>
      </div>

      <div className="relative mt-2 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2 text-neutral-300">
              <span className={`size-2 rounded-full ${r.dot}`} />
              {r.label}
            </span>
            <span className="font-bold">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
