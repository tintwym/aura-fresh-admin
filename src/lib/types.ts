export type ProductImage = {
  id?: string;
  path?: string;
  altText?: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string | null;
  expiryDate?: string | null;
  images?: ProductImage[];
  deleted?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItem = {
  id?: string;
  quantity?: number;
  price?: number;
  product?: Product | null;
};

export type Order = {
  id: string;
  totalPrice?: number;
  status?: string;
  orderItems?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  expiryDate: string;
  imageFile: File | null;
};

export const PRODUCT_CATEGORIES = [
  "Meat",
  "Dairy",
  "Produce",
  "Bakery",
  "Pantry",
  "Beverages",
  "Other",
] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export function requiresExpiry(category: string, name = "", description = ""): boolean {
  const hay = `${category} ${name} ${description}`.toLowerCase();
  return (
    hay.includes("meat") ||
    hay.includes("dairy") ||
    hay.includes("chicken") ||
    hay.includes("beef") ||
    hay.includes("pork") ||
    hay.includes("fish") ||
    hay.includes("milk") ||
    hay.includes("cheese") ||
    hay.includes("yogurt") ||
    hay.includes("butter")
  );
}

export function isDeletedProduct(p: Product): boolean {
  return Boolean(p.deleted ?? p.isDeleted);
}

export function normalizeOrderStatus(status?: string | null): string {
  if (!status) return "PENDING";
  return status.trim().toUpperCase().replace(/[\s-]+/g, "_");
}
