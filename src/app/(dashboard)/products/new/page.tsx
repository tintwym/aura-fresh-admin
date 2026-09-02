"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/lib/api";
import type { ProductFormValues } from "@/lib/types";

export default function NewProductPage() {
  const router = useRouter();

  async function onSubmit(values: ProductFormValues) {
    await createProduct({
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add product</h1>
        <p className="mt-1 text-sm text-slate-500">
          New items appear in the customer shop immediately. Use MMK prices only.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ProductForm submitLabel="Create product" onSubmit={onSubmit} />
      </div>
    </div>
  );
}
