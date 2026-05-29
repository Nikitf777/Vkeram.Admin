const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = localStorage.getItem('adminKey');
  if (key) headers['X-Admin-Key'] = key;

  const res = await fetch(`${API_BASE}/api/Admin${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export interface Invite {
  id: number;
  code: string;
  companyName: string | null;
  isUsed: boolean;
  usedByUserId: number | null;
  createdAt: string;
  usedAt: string | null;
  expiresAt: string;
}

export interface User {
  id: number;
  companyName: string;
  contactEmail: string;
  contactName: string;
  phone: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  userCompany: string;
  userEmail: string;
  confirmationStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  createdAt: string;
  reservationsCount: number;
  deliveriesCount: number;
}

export function setAdminKey(key: string) {
  localStorage.setItem('adminKey', key);
}

export function getAdminKey(): string {
  return localStorage.getItem('adminKey') || '';
}

export async function fetchInvites(): Promise<Invite[]> {
  const data = await request<{ success: boolean; invites: Invite[] }>('/invites');
  return data.invites;
}

export async function createInvite(
  count: number,
  companyName: string,
  expiresInDays: number
): Promise<{ codes: string[]; expiresAt: string }> {
  return request('/invites', {
    method: 'POST',
    body: JSON.stringify({ count, companyName, expiresInDays }),
  });
}

export async function fetchUsers(): Promise<User[]> {
  const data = await request<{ success: boolean; users: User[] }>('/users');
  return data.users;
}

export async function fetchOrders(): Promise<Order[]> {
  const data = await request<{ success: boolean; orders: Order[] }>('/orders');
  return data.orders;
}

export async function fetchUser(id: number): Promise<User> {
  const data = await request<{ success: boolean; user: User }>(`/users/${id}`);
  return data.user;
}

export async function fetchUserOrders(userId: number): Promise<Order[]> {
  const data = await request<{ success: boolean; orders: Order[] }>(`/users/${userId}/orders`);
  return data.orders;
}

export interface ProductWithPrice {
  id: string;
  name: string;
  price: number | null;
}

export interface ProductPriceEntry {
  id: number;
  productId: string;
  price: number;
  createdAt: string;
}

export async function fetchProducts(): Promise<ProductWithPrice[]> {
  const url = `${API_BASE}/api/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
  return res.json();
}

export async function fetchProduct(id: string): Promise<ProductWithPrice> {
  const url = `${API_BASE}/api/products/${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch product (${res.status})`);
  return res.json();
}

export async function fetchProductPriceHistory(productId: string): Promise<ProductPriceEntry[]> {
  const data = await request<{ success: boolean; prices: ProductPriceEntry[] }>(
    `/products/${encodeURIComponent(productId)}/prices`
  );
  return data.prices;
}

export async function addProductPrice(productId: string, price: number): Promise<void> {
  await request('/product-prices', {
    method: 'POST',
    body: JSON.stringify({ productId, price }),
  });
}

export interface ProductImage {
  id: number;
  productId: string;
  fileName: string;
  contentType: string;
  createdAt: string;
}

export function getImageUrl(productId: string, imageId: number): string {
  return `${API_BASE}/api/products/${encodeURIComponent(productId)}/images/${imageId}/file`;
}

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const url = `${API_BASE}/api/products/${encodeURIComponent(productId)}/images`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch images (${res.status})`);
  return res.json();
}

export async function uploadProductImage(productId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  const key = localStorage.getItem('adminKey');
  const res = await fetch(`${API_BASE}/api/Admin/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    headers: key ? { 'X-Admin-Key': key } : {},
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Upload failed (${res.status})`);
  }
}

export async function deleteProductImage(productId: string, imageId: number): Promise<void> {
  await request(`/products/${encodeURIComponent(productId)}/images/${imageId}`, {
    method: 'DELETE',
  });
}
