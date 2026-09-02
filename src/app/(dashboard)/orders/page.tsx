"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminOrders, updateOrderStatus } from "@/lib/api";
import { formatMmk } from "@/lib/currency";
import type { Order } from "@/lib/types";
import { ORDER_STATUSES, normalizeOrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchAdminOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = [...orders].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    if (filter === "ALL") return sorted;
    return sorted.filter((o) => normalizeOrderStatus(o.status) === filter);
  }, [orders, filter]);

  async function onStatusChange(order: Order, status: string) {
    setUpdatingId(order.id);
    setError(null);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Advance delivery status for customer grocery orders.
          </p>
        </div>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading orders…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No orders in this filter.
          </div>
        ) : (
          filtered.map((order) => {
            const items = order.orderItems ?? [];
            const customer =
              [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
              order.user?.username ||
              order.user?.email ||
              "Customer";
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h2>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {customer}
                      {order.createdAt
                        ? ` · ${new Date(order.createdAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">
                      {formatMmk(order.totalPrice)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {items.length} line{items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  {items.map((item, idx) => (
                    <li
                      key={item.id || `${order.id}-${idx}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-slate-700">
                        {item.product?.name || "Item"} × {item.quantity ?? 0}
                        {item.product?.expiryDate ? (
                          <span className="ml-2 text-xs text-slate-400">
                            exp {item.product.expiryDate}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-semibold text-slate-800">
                        {formatMmk(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    Update status
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                      value={normalizeOrderStatus(order.status)}
                      disabled={updatingId === order.id}
                      onChange={(e) => void onStatusChange(order, e.target.value)}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  {updatingId === order.id ? (
                    <span className="text-xs text-slate-500">Saving…</span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
