import { cn } from "@/lib/cn";
import { normalizeOrderStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PROCESSING: "bg-sky-100 text-sky-800",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-900",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  PAID_STOCK_SHORTAGE: "bg-orange-100 text-orange-900",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const normalized = normalizeOrderStatus(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        STYLES[normalized] || "bg-slate-100 text-slate-700",
      )}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
