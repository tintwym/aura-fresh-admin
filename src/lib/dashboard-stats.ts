import type { Order, Product } from "./types";
import { normalizeOrderStatus, requiresExpiry } from "./types";

export const LOW_STOCK_THRESHOLD = 5;

/** Orders that never turned into money: unpaid checkouts and cancellations. */
const NON_REVENUE_STATUSES = new Set(["PENDING", "CANCELLED"]);

export type TrendPoint = { label: string; fullLabel: string; value: number };
export type Segment = { label: string; value: number; color: string };

export type TopProduct = {
  id: string;
  name: string;
  category: string;
  image?: string;
  revenue: number;
  sold: number;
  share: number;
};

export type InventorySnapshot = {
  outOfStock: number;
  lowStock: number;
  inStock: number;
  total: number;
  missingExpiry: number;
};

export type Kpi = { value: number; delta: number | null };

export type DashboardStats = {
  revenue: Kpi;
  orders: Kpi;
  customers: Kpi;
  avgOrderValue: Kpi;
  monthlyTrend: TrendPoint[];
  dailyTrend: TrendPoint[];
  statusBreakdown: Segment[];
  customerSegments: Segment[];
  customerCount: number;
  topProducts: TopProduct[];
  recentOrders: Order[];
  inventory: InventorySnapshot;
};

const STATUS_SEGMENTS: { status: string; label: string; color: string }[] = [
  { status: "COMPLETED", label: "Completed", color: "#059669" },
  { status: "PROCESSING", label: "Processing", color: "#0ea5e9" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery", color: "#14b8a6" },
  { status: "PENDING", label: "Pending", color: "#a78bfa" },
  { status: "PAID_STOCK_SHORTAGE", label: "Stock shortage", color: "#f59e0b" },
  { status: "CANCELLED", label: "Cancelled", color: "#f43f5e" },
];

const DAY_MS = 86_400_000;

function orderDate(o: Order): Date | null {
  if (!o.createdAt) return null;
  const d = new Date(o.createdAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isRevenueOrder(o: Order): boolean {
  return !NON_REVENUE_STATUSES.has(normalizeOrderStatus(o.status));
}

function orderTotal(o: Order): number {
  const n = Number(o.totalPrice ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function customerKey(o: Order): string | null {
  const u = o.user;
  return u?.id || u?.email || u?.username || null;
}

export function customerName(o: Order): string {
  const u = o.user;
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return full || u?.username || u?.email || "Guest";
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function monthStart(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

function inRange(d: Date | null, start: Date, end: Date): boolean {
  return d !== null && d >= start && d < end;
}

export function computeDashboardStats(
  products: Product[],
  orders: Order[],
  now = new Date(),
): DashboardStats {
  const thisMonth = monthStart(now);
  const lastMonth = monthStart(now, -1);
  const nextMonth = monthStart(now, 1);

  const revenueOrders = orders.filter(isRevenueOrder);
  const thisMonthRevenueOrders = revenueOrders.filter((o) => inRange(orderDate(o), thisMonth, nextMonth));
  const lastMonthRevenueOrders = revenueOrders.filter((o) => inRange(orderDate(o), lastMonth, thisMonth));
  const sum = (list: Order[]) => list.reduce((acc, o) => acc + orderTotal(o), 0);

  const totalRevenue = sum(revenueOrders);
  const thisMonthRevenue = sum(thisMonthRevenueOrders);
  const lastMonthRevenue = sum(lastMonthRevenueOrders);

  const thisMonthOrders = orders.filter((o) => inRange(orderDate(o), thisMonth, nextMonth)).length;
  const lastMonthOrders = orders.filter((o) => inRange(orderDate(o), lastMonth, thisMonth)).length;

  const avg = (total: number, count: number) => (count > 0 ? total / count : 0);

  // Per-customer history drives both the customer KPI and the segment donut.
  const history = new Map<string, { count: number; first: Date | null; last: Date | null }>();
  for (const o of orders) {
    const key = customerKey(o);
    if (!key || normalizeOrderStatus(o.status) === "CANCELLED") continue;
    const d = orderDate(o);
    const entry = history.get(key) ?? { count: 0, first: null, last: null };
    entry.count += 1;
    if (d && (!entry.first || d < entry.first)) entry.first = d;
    if (d && (!entry.last || d > entry.last)) entry.last = d;
    history.set(key, entry);
  }

  let newThisMonth = 0;
  let newLastMonth = 0;
  const segmentCounts = { vip: 0, fresh: 0, returning: 0, oneTime: 0, inactive: 0 };
  for (const { count, first, last } of history.values()) {
    if (inRange(first, thisMonth, nextMonth)) newThisMonth += 1;
    if (inRange(first, lastMonth, thisMonth)) newLastMonth += 1;

    const daysSinceFirst = first ? (now.getTime() - first.getTime()) / DAY_MS : Infinity;
    const daysSinceLast = last ? (now.getTime() - last.getTime()) / DAY_MS : Infinity;
    if (count >= 5) segmentCounts.vip += 1;
    else if (daysSinceFirst <= 30) segmentCounts.fresh += 1;
    else if (daysSinceLast > 90) segmentCounts.inactive += 1;
    else if (count >= 2) segmentCounts.returning += 1;
    else segmentCounts.oneTime += 1;
  }

  const monthlyTrend: TrendPoint[] = Array.from({ length: 12 }, (_, i) => {
    const start = monthStart(now, i - 11);
    const end = monthStart(now, i - 10);
    return {
      label: start.toLocaleString("en-US", { month: "short" }),
      fullLabel: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
      value: sum(revenueOrders.filter((o) => inRange(orderDate(o), start, end))),
    };
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyTrend: TrendPoint[] = Array.from({ length: 30 }, (_, i) => {
    const start = new Date(today.getTime() - (29 - i) * DAY_MS);
    const end = new Date(start.getTime() + DAY_MS);
    return {
      label: start.toLocaleString("en-US", { month: "short", day: "numeric" }),
      fullLabel: start.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      value: sum(revenueOrders.filter((o) => inRange(orderDate(o), start, end))),
    };
  });

  const statusCounts = new Map<string, number>();
  for (const o of orders) {
    const s = normalizeOrderStatus(o.status);
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
  }
  const statusBreakdown = STATUS_SEGMENTS.map(({ status, label, color }) => ({
    label,
    color,
    value: statusCounts.get(status) ?? 0,
  }));

  const productsById = new Map(products.map((p) => [p.id, p]));
  const sales = new Map<string, TopProduct>();
  for (const o of revenueOrders) {
    for (const item of o.orderItems ?? []) {
      const product = item.product ?? undefined;
      const id = product?.id;
      if (!id) continue;
      const qty = Number(item.quantity ?? 0);
      const unit = Number(item.price ?? product?.price ?? 0);
      const catalog = productsById.get(id);
      const entry = sales.get(id) ?? {
        id,
        name: catalog?.name || product?.name || "Unknown product",
        category: catalog?.category || product?.category || "Uncategorized",
        image: catalog?.images?.[0]?.path || product?.images?.[0]?.path,
        revenue: 0,
        sold: 0,
        share: 0,
      };
      entry.revenue += unit * qty;
      entry.sold += qty;
      sales.set(id, entry);
    }
  }
  const itemRevenue = Array.from(sales.values()).reduce((acc, p) => acc + p.revenue, 0);
  const topProducts = Array.from(sales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ ...p, share: itemRevenue > 0 ? (p.revenue / itemRevenue) * 100 : 0 }));

  const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0).length;
  const lowStock = products.filter(
    (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD,
  ).length;

  return {
    revenue: { value: totalRevenue, delta: percentChange(thisMonthRevenue, lastMonthRevenue) },
    orders: { value: orders.length, delta: percentChange(thisMonthOrders, lastMonthOrders) },
    customers: { value: history.size, delta: percentChange(newThisMonth, newLastMonth) },
    avgOrderValue: {
      value: avg(totalRevenue, revenueOrders.length),
      delta: percentChange(
        avg(thisMonthRevenue, thisMonthRevenueOrders.length),
        avg(lastMonthRevenue, lastMonthRevenueOrders.length),
      ),
    },
    monthlyTrend,
    dailyTrend,
    statusBreakdown,
    customerSegments: [
      { label: "New customers", value: segmentCounts.fresh, color: "#059669" },
      { label: "Returning", value: segmentCounts.returning, color: "#0ea5e9" },
      { label: "VIP (5+ orders)", value: segmentCounts.vip, color: "#8b5cf6" },
      { label: "One-time", value: segmentCounts.oneTime, color: "#f59e0b" },
      { label: "Inactive (90d+)", value: segmentCounts.inactive, color: "#f472b6" },
    ],
    customerCount: history.size,
    topProducts,
    recentOrders: [...orders]
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 5),
    inventory: {
      outOfStock,
      lowStock,
      inStock: products.length - outOfStock,
      total: products.length,
      missingExpiry: products.filter(
        (p) => requiresExpiry(p.category || "", p.name, p.description || "") && !p.expiryDate,
      ).length,
    },
  };
}
