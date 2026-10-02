"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  ReceiptText,
  ShoppingCart,
  TriangleAlert,
  Users,
} from "lucide-react";
import { fetchAdminOrders, fetchProducts } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatMmk } from "@/lib/currency";
import { LOW_STOCK_THRESHOLD, computeDashboardStats, customerName } from "@/lib/dashboard-stats";
import type { Order, Product } from "@/lib/types";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { Select } from "@/components/select";

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function orderSummary(o: Order): string {
  const items = o.orderItems ?? [];
  const first = items[0]?.product?.name;
  if (!first) return `${items.length} item${items.length === 1 ? "" : "s"}`;
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
}

function Panel({
  title,
  href,
  action,
  controls,
  className,
  children,
}: {
  title: string;
  href?: string;
  action?: React.ReactNode;
  controls?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {action}
        </div>
        {controls}
        {href ? (
          <Link href={href} className="text-xs font-semibold text-emerald-700 hover:underline">
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"monthly" | "daily">("monthly");
  const [now] = useState(() => new Date());
  const [username, setUsername] = useState("");

  useEffect(() => {
    setUsername(getAdminSession()?.username || "");
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, o] = await Promise.all([fetchProducts(), fetchAdminOrders()]);
        if (!cancelled) {
          setProducts(p);
          setOrders(o);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => computeDashboardStats(products, orders, now), [products, orders, now]);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateRange = `${monthStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const revenueDelta = stats.revenue.delta;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {greeting(now)}
            {username ? `, ${username}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Here&apos;s what&apos;s happening with your store
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track sales, orders, customers and stock in real time.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm sm:self-auto">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {dateRange}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
          <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm sm:col-span-2 xl:col-span-3" />
          <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm sm:col-span-2 xl:col-span-1" />
        </div>
      ) : (
        <>
          {stats.inventory.missingExpiry > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>{stats.inventory.missingExpiry}</strong> meat/dairy item
                {stats.inventory.missingExpiry === 1 ? " is" : "s are"} missing an expiry date. Customers
                need this tag before purchase —{" "}
                <Link href="/products" className="font-semibold underline">
                  update them in Products
                </Link>
                .
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total revenue"
              value={formatMmk(stats.revenue.value)}
              icon={CircleDollarSign}
              tone="emerald"
              delta={stats.revenue.delta}
            />
            <KpiCard
              label="Total orders"
              value={stats.orders.value.toLocaleString("en-US")}
              icon={ShoppingCart}
              tone="sky"
              delta={stats.orders.delta}
            />
            <KpiCard
              label="Customers"
              value={stats.customers.value.toLocaleString("en-US")}
              icon={Users}
              tone="violet"
              delta={stats.customers.delta}
              deltaLabel="new vs last month"
            />
            <KpiCard
              label="Avg. order value"
              value={formatMmk(stats.avgOrderValue.value)}
              icon={ReceiptText}
              tone="amber"
              delta={stats.avgOrderValue.delta}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel
              title="Sales trend"
              className="xl:col-span-2"
              action={
                revenueDelta !== null && revenueDelta !== 0 ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      revenueDelta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                    )}
                  >
                    <ArrowUpRight className={cn("h-3 w-3", revenueDelta < 0 && "rotate-90")} />
                    {revenueDelta > 0 ? "+" : ""}
                    {revenueDelta.toFixed(1)}%
                  </span>
                ) : null
              }
              controls={
                <Select
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "daily", label: "Last 30 days" },
                  ]}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  aria-label="Trend range"
                />
              }
            >
              <SalesTrendChart data={range === "monthly" ? stats.monthlyTrend : stats.dailyTrend} />
            </Panel>

            <Panel title="Order status" href="/orders">
              <DonutChart
                segments={stats.statusBreakdown}
                centerValue={stats.orders.value.toLocaleString("en-US")}
                centerLabel="Total orders"
              />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title="Top products" href="/products" className="xl:col-span-2">
              {stats.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No paid orders yet.</p>
              ) : (
                <ol className="divide-y divide-slate-100">
                  {stats.topProducts.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <span className="w-4 text-sm font-semibold text-slate-400">{i + 1}</span>
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatMmk(p.revenue)}</p>
                        <p className="text-xs text-slate-500">{p.sold.toLocaleString("en-US")} sold</p>
                      </div>
                      <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-center text-[11px] font-bold text-emerald-700 sm:inline-block">
                        {p.share.toFixed(0)}% of sales
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title="Customer segments">
              <DonutChart
                segments={stats.customerSegments}
                centerValue={stats.customerCount.toLocaleString("en-US")}
                centerLabel="Customers"
              />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title="Recent orders" href="/orders" className="xl:col-span-2">
              {stats.recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No orders yet.</p>
              ) : (
                <div className="-mx-5 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-2.5">Order ID</th>
                        <th className="px-3 py-2.5">Customer</th>
                        <th className="px-3 py-2.5">Product</th>
                        <th className="px-3 py-2.5">Amount</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-5 py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentOrders.map((o) => {
                        const name = customerName(o);
                        return (
                          <tr key={o.id} className="text-slate-700">
                            <td className="px-5 py-3 font-semibold text-slate-900">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                    avatarColor(name),
                                  )}
                                >
                                  {initials(name)}
                                </span>
                                <span className="max-w-[140px] truncate font-medium">{name}</span>
                              </div>
                            </td>
                            <td className="max-w-[180px] truncate px-3 py-3">{orderSummary(o)}</td>
                            <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">
                              {formatMmk(o.totalPrice)}
                            </td>
                            <td className="px-3 py-3">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                              {formatDate(o.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Inventory snapshot" href="/products">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Out of stock",
                    value: stats.inventory.outOfStock,
                    icon: PackageX,
                    tone: "bg-rose-50 text-rose-600",
                  },
                  {
                    label: `Low stock (≤${LOW_STOCK_THRESHOLD})`,
                    value: stats.inventory.lowStock,
                    icon: TriangleAlert,
                    tone: "bg-amber-50 text-amber-600",
                  },
                  {
                    label: "In stock",
                    value: stats.inventory.inStock,
                    icon: PackageCheck,
                    tone: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label: "Total products",
                    value: stats.inventory.total,
                    icon: Boxes,
                    tone: "bg-slate-100 text-slate-600",
                  },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-xl border border-slate-100 p-3.5">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-slate-500">{label}</p>
                    <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
