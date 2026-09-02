import { clearAdminAuth, getAdminToken } from "./auth";
import type { Order, Product } from "./types";
import { isDeletedProduct } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function apiUrl(path: string): string {
  const relative = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${relative}`;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`;
}

async function request(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  if (authenticated) {
    const token = getAdminToken();
    if (!token) throw new ApiError(401, "Admin sign-in required.");
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError(0, "Cannot reach Aura Fresh API. Is the backend running on port 8080?");
  }

  if (res.status === 401 && authenticated) {
    clearAdminAuth();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }
  return res;
}

export async function loginAdmin(username: string, password: string): Promise<string> {
  const res = await request("/auth/admins/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new ApiError(500, "Login response missing token.");
  return data.token;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await request("/products/index");
  const data = (await res.json()) as Product[];
  return Array.isArray(data) ? data.filter((p) => !isDeletedProduct(p)) : [];
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await request(`/products/show/${id}`);
  return (await res.json()) as Product;
}

export type ProductWriteInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  expiryDate?: string;
  imageFile?: File | null;
};

function toProductFormData(input: ProductWriteInput): FormData {
  const form = new FormData();
  form.set("name", input.name);
  form.set("description", input.description || "");
  form.set("price", String(input.price));
  form.set("stock", String(input.stock));
  if (input.category) form.set("category", input.category);
  if (input.expiryDate) form.set("expiryDate", input.expiryDate);
  if (input.imageFile) form.append("images", input.imageFile);
  return form;
}

export async function createProduct(input: ProductWriteInput): Promise<Product> {
  const res = await request(
    "/products/store",
    { method: "POST", body: toProductFormData(input) },
    true,
  );
  return (await res.json()) as Product;
}

export async function updateProduct(id: string, input: ProductWriteInput): Promise<Product> {
  const res = await request(
    `/products/update/${id}`,
    { method: "PUT", body: toProductFormData(input) },
    true,
  );
  return (await res.json()) as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await request(`/products/delete/${id}`, { method: "DELETE" }, true);
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await request("/orders/admin", {}, true);
  const data = (await res.json()) as Order[];
  return Array.isArray(data) ? data : [];
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await request(
    `/orders/admin/${orderId}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    true,
  );
  return (await res.json()) as Order;
}
