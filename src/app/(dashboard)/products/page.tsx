"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { deleteProduct, fetchProducts } from "@/lib/api";
import { formatMmk } from "@/lib/currency";
import type { Product } from "@/lib/types";
import { requiresExpiry } from "@/lib/types";

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const searchParam = useSearchParams().get("q");
  useEffect(() => {
    if (searchParam !== null) setQuery(searchParam);
  }, [searchParam]);

  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category?.trim()).filter((c): c is string => Boolean(c)),
    );
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catOk =
        category === "All" ||
        (p.category || "").localeCompare(category, undefined, { sensitivity: "accent" }) === 0;
      if (!catOk) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  async function onDelete(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? Customers will no longer see it.`)) return;
    setDeletingId(product.id);
    setError(null);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Catalog for the customer app — prices in Ks (MMK). Tag expiry for meat & dairy.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Expiry</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading products…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const needs = requiresExpiry(p.category || "", p.name, p.description || "");
                  const img = p.images?.[0]?.path;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-slate-100">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{p.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {p.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.category || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatMmk(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            (p.stock ?? 0) <= 0
                              ? "font-bold text-rose-600"
                              : (p.stock ?? 0) <= 5
                                ? "font-bold text-amber-700"
                                : "text-slate-700"
                          }
                        >
                          {p.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {needs ? (
                          p.expiryDate ? (
                            <span className="text-slate-700">{p.expiryDate}</span>
                          ) : (
                            <span className="font-semibold text-amber-700">Missing</span>
                          )
                        ) : (
                          <span className="text-slate-400">{p.expiryDate || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === p.id}
                            onClick={() => void onDelete(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
