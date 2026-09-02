"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/product-form";
import { fetchProduct, updateProduct } from "@/lib/api";
import type { Product, ProductFormValues } from "@/lib/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchProduct(params.id);
        if (!cancelled) setProduct(p);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onSubmit(values: ProductFormValues) {
    await updateProduct(params.id, {
      name: values.name.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      category: values.category,
      expiryDate: values.expiryDate || undefined,
      imageFile: values.imageFile,
    });
    router.push("/products");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/products"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit product</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update stock, category, and expiry for the customer app.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading || !product ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <ProductForm
            key={product.id}
            submitLabel="Save changes"
            initial={{
              name: product.name || "",
              description: product.description || "",
              price: String(product.price ?? ""),
              stock: String(product.stock ?? 0),
              category: product.category || "Other",
              expiryDate: product.expiryDate || "",
              imageFile: null,
            }}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </div>
  );
}
