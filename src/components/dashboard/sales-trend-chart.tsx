"use client";

import { useState } from "react";
import { formatMmk, formatMmkCompact } from "@/lib/currency";
import type { TrendPoint } from "@/lib/dashboard-stats";

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 56 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const TICKS = 5;

function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value / (TICKS - 1)) ?? 10;
  return step * magnitude * (TICKS - 1);
}

/** Catmull-Rom spline as cubic Béziers, with control points clamped so the curve never dips below zero. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const floor = PAD.top + PLOT_H;
  const clamp = (y: number) => Math.min(Math.max(y, PAD.top), floor);
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const stepX = data.length > 1 ? PLOT_W / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + PLOT_H - (d.value / max) * PLOT_H,
  }));
  const line = smoothPath(points);
  const area =
    points.length > 1
      ? `${line} L ${points[points.length - 1].x} ${PAD.top + PLOT_H} L ${points[0].x} ${PAD.top + PLOT_H} Z`
      : "";
  const labelEvery = data.length > 12 ? Math.ceil(data.length / 8) : 1;
  const focus = active ?? data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const focusPoint = points[focus];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label="Revenue trend"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: TICKS }, (_, i) => {
          const value = (max / (TICKS - 1)) * i;
          const y = PAD.top + PLOT_H - (value / max) * PLOT_H;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#eef2f6" />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                {value === 0 ? "0" : formatMmkCompact(value).replace(" Ks", "")}
              </text>
            </g>
          );
        })}

        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={d.fullLabel}
              x={points[i].x}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[11px]"
            >
              {d.label}
            </text>
          ) : null,
        )}

        {area ? <path d={area} fill="url(#trend-fill)" /> : null}
        <path d={line} fill="none" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" />

        {focusPoint ? (
          <g>
            <line
              x1={focusPoint.x}
              x2={focusPoint.x}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <circle cx={focusPoint.x} cy={focusPoint.y} r={6} fill="#fff" stroke="#059669" strokeWidth={3} />
          </g>
        ) : null}

        {points.map((p, i) => (
          <rect
            key={data[i].fullLabel}
            x={p.x - stepX / 2}
            y={PAD.top}
            width={Math.max(stepX, 1)}
            height={PLOT_H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </svg>

      {focusPoint ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-center shadow-lg"
          style={{
            left: `${(focusPoint.x / WIDTH) * 100}%`,
            top: `calc(${(focusPoint.y / HEIGHT) * 100}% - 12px)`,
          }}
        >
          <p className="whitespace-nowrap text-xs font-bold text-white">{formatMmk(data[focus].value)}</p>
          <p className="whitespace-nowrap text-[10px] text-slate-300">{data[focus].fullLabel}</p>
        </div>
      ) : null}
    </div>
  );
}
