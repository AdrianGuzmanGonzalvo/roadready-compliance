export interface RadarAxis {
  key: string;
  label: string;
  /** 0–100, or null when there is nothing to score. */
  value: number | null;
}

const WIDTH = 340;
const HEIGHT = 236;
const CX = WIDTH / 2;
const CY = 120;
const RADIUS = 74;
const RINGS = [25, 50, 75, 100];

function angleOf(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}

function pointAt(i: number, n: number, r: number): [number, number] {
  const a = angleOf(i, n);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function polygon(n: number, radiusFor: (i: number) => number): string {
  return Array.from({ length: n }, (_, i) => pointAt(i, n, radiusFor(i)).map((v) => v.toFixed(1)).join(",")).join(" ");
}

/** Spider chart on a fixed 0–100 scale, one spoke per axis. */
export function RadarChart({ axes, label }: { axes: RadarAxis[]; label: string }) {
  const n = axes.length;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto w-full max-w-[340px] overflow-visible"
      role="img"
      aria-label={label}
    >
      {RINGS.map((pct) => (
        <polygon key={pct} points={polygon(n, () => (RADIUS * pct) / 100)} fill="none" className="stroke-neutral-200" strokeWidth={1} />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, n, RADIUS);
        return <line key={axis.key} x1={CX} y1={CY} x2={x} y2={y} className="stroke-neutral-200" strokeWidth={1} />;
      })}
      {/* The outer ring is 100%; only the midpoint needs a tick label. */}
      <text x={CX + 5} y={CY - RADIUS / 2 + 11} className="fill-neutral-400 text-[9px]">
        50%
      </text>

      <polygon
        points={polygon(n, (i) => (RADIUS * (axes[i].value ?? 0)) / 100)}
        className="fill-blue-600/15 stroke-blue-600"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, n, (RADIUS * (axis.value ?? 0)) / 100);
        return (
          <circle key={axis.key} cx={x} cy={y} r={4} className="fill-blue-600 stroke-white" strokeWidth={2}>
            <title>{`${axis.label}: ${axis.value === null ? "no data" : `${axis.value}%`}`}</title>
          </circle>
        );
      })}

      {axes.map((axis, i) => {
        const a = angleOf(i, n);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const [x, y] = pointAt(i, n, RADIUS + 12);
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        const top = sin < -0.5 ? y - 14 : sin > 0.5 ? y + 10 : y - 3;
        return (
          <text key={axis.key} textAnchor={anchor} className="text-xs">
            <tspan x={x} y={top} className="fill-neutral-500">
              {axis.label}
            </tspan>
            <tspan x={x} dy={13} className="fill-neutral-900 font-semibold">
              {axis.value === null ? "—" : `${axis.value}%`}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
