import type { Segment } from "@/lib/dashboard-stats";

const RADIUS = 42;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Segment[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? GAP : 0;

  let offset = 0;
  const arcs = visible.map((s) => {
    const length = (s.value / total) * CIRCUMFERENCE;
    const arc = {
      ...s,
      dash: Math.max(length - gap, 0.5),
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={a.color}
              strokeWidth={STROKE}
              strokeDasharray={`${a.dash} ${CIRCUMFERENCE}`}
              strokeDashoffset={-a.offset}
            >
              <title>{`${a.label}: ${a.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{centerValue}</span>
          <span className="text-[11px] font-medium text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 truncate text-slate-600">{s.label}</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
