"use client";

import { useMemo, useState } from "react";
import type { ProductFormValues } from "@/lib/types";
import { PRODUCT_CATEGORIES, requiresExpiry } from "@/lib/types";
import { cn } from "@/lib/cn";

const empty: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "Produce",
  expiryDate: "",
  imageFile: null,
};

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<ProductFormValues>({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsExpiry = useMemo(
    () => requiresExpiry(values.category, values.name, values.description),
    [values.category, values.name, values.description],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Product name is required.");
      return;
    }
    const price = Number(values.price);
    const stock = Number(values.stock);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be a positive MMK amount.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be zero or a positive whole number.");
      return;
    }
    if (needsExpiry && !values.expiryDate) {
      setError("Meat and dairy products require an expiry date.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            className={inputClass}
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Halal Free-Range Whole Chicken"
            required
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (MMK / Ks)">
          <input
            className={inputClass}
            type="number"
            min={1}
            step={1}
            value={values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
            placeholder="12500"
            required
          />
        </Field>
        <Field label="Stock">
          <input
            className={inputClass}
            type="number"
            min={0}
            step={1}
            value={values.stock}
            onChange={(e) => setValues((v) => ({ ...v, stock: e.target.value }))}
            required
          />
        </Field>
        <Field
          label={needsExpiry ? "Expiry date (required)" : "Expiry date (optional)"}
          className="sm:col-span-2"
        >
          <input
            className={inputClass}
            type="date"
            value={values.expiryDate}
            onChange={(e) => setValues((v) => ({ ...v, expiryDate: e.target.value }))}
            required={needsExpiry}
          />
          {needsExpiry ? (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Meat and dairy must show an expiry date to customers.
            </p>
          ) : null}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            className={cn(inputClass, "min-h-28 resize-y")}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="Short customer-facing description"
          />
        </Field>
        <Field label="Image (optional)" className="sm:col-span-2">
          <input
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-800"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setValues((v) => ({ ...v, imageFile: e.target.files?.[0] ?? null }))
            }
          />
        </Field>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4";
