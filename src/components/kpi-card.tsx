import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  delta,
  deltaLabel = "vs last month",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  /** Percent change; `null` means there was no baseline to compare against. */
  delta?: number | null;
  deltaLabel?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
      {delta !== undefined ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs">
          {delta === null ? (
            <span className="font-semibold text-emerald-600">New</span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                up ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {up ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
          <span className="text-slate-400">{deltaLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
