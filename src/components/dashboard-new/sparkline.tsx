function pointsFor(counts: number[], width: number, height: number): string {
  const max = Math.max(1, ...counts);
  const step = counts.length > 1 ? width / (counts.length - 1) : width;
  return counts
    .map((c, i) => {
      const x = i * step;
      const y = height - (c / max) * (height - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({
  counts,
  colorClass = "stroke-neutral-300",
  width = 72,
  height = 26,
}: {
  counts: number[];
  colorClass?: string;
  width?: number;
  height?: number;
}) {
  if (counts.every((c) => c === 0)) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <line x1={0} y1={height - 1.5} x2={width} y2={height - 1.5} className="stroke-neutral-200" strokeWidth={1.5} />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden fill="none">
      <polyline
        points={pointsFor(counts, width, height)}
        className={colorClass}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
