"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { fetchAdminOrders, fetchProducts } from "@/lib/api";
import { formatMmk } from "@/lib/currency";
import type { Order, Product } from "@/lib/types";
import { normalizeOrderStatus, requiresExpiry } from "@/lib/types";
import { KpiCard } from "@/components/kpi-card";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5);
    const soldOut = products.filter((p) => (p.stock ?? 0) <= 0);
    const missingExpiry = products.filter(
      (p) => requiresExpiry(p.category || "", p.name, p.description || "") && !p.expiryDate,
    );
    const activeOrders = orders.filter((o) => {
      const s = normalizeOrderStatus(o.status);
      return s !== "COMPLETED" && s !== "CANCELLED";
    });
    const revenue = orders
      .filter((o) => normalizeOrderStatus(o.status) === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

    return {
      productCount: products.length,
      lowStock: lowStock.length,
      soldOut: soldOut.length,
      missingExpiry: missingExpiry.length,
      activeOrders: activeOrders.length,
      revenue,
      recentOrders: [...orders]
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .slice(0, 5),
      attention: [...lowStock, ...soldOut].slice(0, 6),
    };
  }, [products, orders]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live inventory and orders from the Aura Fresh API.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Products"
              value={String(stats.productCount)}
              hint="Active catalog SKUs"
              tone="good"
            />
            <KpiCard
              label="Active orders"
              value={String(stats.activeOrders)}
              hint="Not completed / cancelled"
            />
            <KpiCard
              label="Completed revenue"
              value={formatMmk(stats.revenue)}
              hint="MMK only"
            />
            <KpiCard
              label="Needs attention"
              value={String(stats.lowStock + stats.soldOut + stats.missingExpiry)}
              hint={`${stats.lowStock} low · ${stats.soldOut} sold out · ${stats.missingExpiry} missing expiry`}
              tone={stats.lowStock + stats.soldOut + stats.missingExpiry > 0 ? "warn" : "default"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Stock alerts
                </h2>
                <Link href="/products" className="text-xs font-semibold text-emerald-700 hover:underline">
                  Manage products
                </Link>
              </div>
              {stats.attention.length === 0 ? (
                <p className="text-sm text-slate-500">Inventory looks healthy.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.attention.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.category || "Uncategorized"} · {formatMmk(p.price)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-bold ${
                          (p.stock ?? 0) <= 0 ? "text-rose-600" : "text-amber-700"
                        }`}
                      >
                        {(p.stock ?? 0) <= 0 ? "Sold out" : `${p.stock} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  Recent orders
                </h2>
                <Link href="/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
                  View all
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.recentOrders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {o.user?.username || o.user?.email || "Customer"} ·{" "}
                          {normalizeOrderStatus(o.status).replaceAll("_", " ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-emerald-700">
                        {formatMmk(o.totalPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {stats.missingExpiry > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>{stats.missingExpiry}</strong> meat/dairy item
                {stats.missingExpiry === 1 ? "" : "s"} missing expiry date. Customers need this tag
                before purchase — update them in Products.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Meat and dairy expiry coverage looks good for the customer app.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
