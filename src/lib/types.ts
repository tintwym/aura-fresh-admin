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

/** Supermarket-style aisle labels for the admin product form. */
export const PRODUCT_CATEGORIES = [
  "Fresh Fruit",
  "Fresh Vegetables",
  "Herbs & Spices",
  "Poultry",
  "Seafood",
  "Fresh Meat",
  "Dairy & Eggs",
  "Tofu & Plant Protein",
  "Bakery & Bread",
  "Rice & Grains",
  "Noodles & Pasta",
  "Pulses & Legumes",
  "Cooking Oils",
  "Sauces & Condiments",
  "Spreads & Sweeteners",
  "Breakfast & Cereals",
  "Snacks & Biscuits",
  "Tea & Coffee",
  "Soft Drinks & Juices",
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
  const cat = category.toLowerCase();
  if (
    cat.includes("poultry") ||
    cat.includes("seafood") ||
    cat.includes("fresh meat") ||
    cat === "meat" ||
    (cat.includes("meat") && !cat.includes("plant")) ||
    cat.includes("dairy") ||
    cat.includes("eggs")
  ) {
    return true;
  }

  // Name heuristics — skip sauces/oils/bakery snacks so "fish sauce" / "butter cookies" stay clean
  if (
    cat.includes("sauce") ||
    cat.includes("condiment") ||
    cat.includes("oil") ||
    cat.includes("bakery") ||
    cat.includes("snack") ||
    cat.includes("biscuit")
  ) {
    return false;
  }

  const hay = `${name} ${description}`.toLowerCase();
  return (
    hay.includes("chicken") ||
    hay.includes("beef") ||
    hay.includes("pork") ||
    hay.includes("mutton") ||
    hay.includes("prawn") ||
    hay.includes("shrimp") ||
    /\bfish\b/.test(hay) ||
    hay.includes("seafood") ||
    /\bmilk\b/.test(hay) ||
    hay.includes("cheese") ||
    hay.includes("yogurt") ||
    hay.includes("yoghurt")
  );
}

export function isDeletedProduct(p: Product): boolean {
  return Boolean(p.deleted ?? p.isDeleted);
}

export function normalizeOrderStatus(status?: string | null): string {
  if (!status) return "PENDING";
  return status.trim().toUpperCase().replace(/[\s-]+/g, "_");
}
