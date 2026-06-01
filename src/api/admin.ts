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
  buyerId: string | null;
  isUsed: boolean;
  isRevoked: boolean;
  usedByUserId: number | null;
  usedByBuyerId: string | null;
  createdAt: string;
  usedAt: string | null;
  expiresAt: string;
}

export interface User {
  id: number;
  buyerId: string;
  buyerName: string;
  contactEmail: string;
  contactName: string;
  phone: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  userCompany: string;
  userBuyerId: string;
  userBuyerName: string;
  userEmail: string;
  isConfirmed: boolean;
  paymentStatus: string;
  shipmentStatus: string;
  createdAt: string;
  reservationsCount: number;
  deliveriesCount: number;
  totalPrice: number;
  totalQuantity: number;
}

export interface ProductReservationInfo {
  productId: string;
  productName: string;
  quantity: number;
  vat: number;
  price: number;
  totalPrice: number;
}

export interface ReservationInfo {
  id: number;
  startTime: string;
  endTime: string;
  picked: boolean;
  products?: ProductReservationInfo[] | null;
}

export interface DeliveryInfo {
  id: number;
  deliveryTime: string;
  delivered: boolean;
  products?: ProductReservationInfo[] | null;
}

export interface OrderDetail {
  success: boolean;
  message: string;
  orderId: number;
  isConfirmed: boolean;
  paymentStatus: string | null;
  shipmentStatus: string | null;
  userId: number | null;
  userBuyerId: string | null;
  userBuyerName: string | null;
  createdAt: string | null;
  reservations?: ReservationInfo[] | null;
  deliveries?: DeliveryInfo[] | null;
  totalPrice: number;
  totalQuantity: number;
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
  buyerId: string,
  expiresInDays: number
): Promise<{ codes: string[]; expiresAt: string }> {
  return request('/invites', {
    method: 'POST',
    body: JSON.stringify({ count, buyerId, expiresInDays }),
  });
}

export async function revokeInvites(ids: number[]): Promise<void> {
  await request('/invites/revoke', {
    method: 'POST',
    body: JSON.stringify({ ids }),
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

export async function fetchOrderDetail(orderId: number): Promise<OrderDetail> {
  return request<OrderDetail>(`/orders/${orderId}`);
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

export interface AdminProduct {
  id: string;
  name: string;
  price: number | null;
  vat: number;
  isHidden: boolean;
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

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  return request('/products');
}

export async function updateProductHidden(productId: string, isHidden: boolean): Promise<void> {
  await request(`/products/${encodeURIComponent(productId)}/hidden`, {
    method: 'PATCH',
    body: JSON.stringify({ status: isHidden }),
  });
}

export async function fetchProduct(id: string): Promise<AdminProduct> {
  return request<AdminProduct>(`/products/${encodeURIComponent(id)}`);
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

export interface ProductCharacteristic {
  id: number;
  productId: string;
  sizeLengthMm: number | null;
  sizeWidthMm: number | null;
  sizeHeightMm: number | null;
  weightKg: number | null;
  strengthGrade: string | null;
  frostResistance: string | null;
  waterAbsorption: string | null;
  thermalConductivity: number | null;
  radiationQuality: string | null;
  quantityPerPallet: number | null;
  standard: string | null;
  color: string | null;
  brickType: string | null;
  minimumOrderQuantity: number | null;
}

export interface SaveProductCharacteristicData {
  sizeLengthMm?: number | null;
  sizeWidthMm?: number | null;
  sizeHeightMm?: number | null;
  weightKg?: number | null;
  strengthGrade?: string | null;
  frostResistance?: string | null;
  waterAbsorption?: string | null;
  thermalConductivity?: number | null;
  radiationQuality?: string | null;
  quantityPerPallet?: number | null;
  standard?: string | null;
  color?: string | null;
  brickType?: string | null;
  minimumOrderQuantity?: number | null;
}

export async function fetchProductCharacteristics(productId: string): Promise<ProductCharacteristic | null> {
  const data = await request<{ characteristics: ProductCharacteristic | null }>(
    `/products/${encodeURIComponent(productId)}?includeCharacteristics=true`
  );
  return data.characteristics ?? null;
}

export async function saveProductCharacteristic(productId: string, data: SaveProductCharacteristicData): Promise<void> {
  await request(`/products/${encodeURIComponent(productId)}/characteristics`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export interface DefaultWorkingHoursData {
  startTime: string;
  endTime: string;
}

export interface BreakData {
  id: number;
  startTime: string;
  endTime: string;
}

export async function fetchDefaultWorkingHours(): Promise<DefaultWorkingHoursData & { id: number }> {
  const data = await request<{ success: boolean; workingHours: { id: number; startTime: string; endTime: string } }>('/default-working-hours');
  return { id: data.workingHours.id, startTime: data.workingHours.startTime, endTime: data.workingHours.endTime };
}

export async function updateDefaultWorkingHours(settings: DefaultWorkingHoursData): Promise<void> {
  await request('/default-working-hours', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchBreaks(): Promise<BreakData[]> {
  const data = await request<{ success: boolean; breaks: BreakData[] }>('/breaks');
  return data.breaks;
}

export async function createBreak(settings: DefaultWorkingHoursData): Promise<BreakData> {
  const data = await request<{ success: boolean; break: BreakData }>('/breaks', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return data.break;
}

export async function updateBreak(id: number, settings: DefaultWorkingHoursData): Promise<void> {
  await request(`/breaks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function deleteBreak(id: number): Promise<void> {
  await request(`/breaks/${id}`, {
    method: 'DELETE',
  });
}

export interface DaysSettings {
  days: number;
  countWorkingDaysOnly: boolean;
}

export async function fetchMinimumBookingDays(): Promise<DaysSettings & { id: number }> {
  const data = await request<{ success: boolean; minimumBookingDays: { id: number; days: number; countWorkingDaysOnly: boolean } }>('/minimum-booking-days');
  return { id: data.minimumBookingDays.id, days: data.minimumBookingDays.days, countWorkingDaysOnly: data.minimumBookingDays.countWorkingDaysOnly };
}

export async function updateMinimumBookingDays(settings: DaysSettings): Promise<void> {
  await request('/minimum-booking-days', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchMinimumDeliveryDays(): Promise<DaysSettings & { id: number }> {
  const data = await request<{ success: boolean; minimumDeliveryDays: { id: number; days: number; countWorkingDaysOnly: boolean } }>('/minimum-delivery-days');
  return { id: data.minimumDeliveryDays.id, days: data.minimumDeliveryDays.days, countWorkingDaysOnly: data.minimumDeliveryDays.countWorkingDaysOnly };
}

export async function updateMinimumDeliveryDays(settings: DaysSettings): Promise<void> {
  await request('/minimum-delivery-days', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchMaximumBookingDays(): Promise<DaysSettings & { id: number }> {
  const data = await request<{ success: boolean; maximumBookingDays: { id: number; days: number; countWorkingDaysOnly: boolean } }>('/maximum-booking-days');
  return { id: data.maximumBookingDays.id, days: data.maximumBookingDays.days, countWorkingDaysOnly: data.maximumBookingDays.countWorkingDaysOnly };
}

export async function updateMaximumBookingDays(settings: DaysSettings): Promise<void> {
  await request('/maximum-booking-days', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchMaximumDeliveryDays(): Promise<DaysSettings & { id: number }> {
  const data = await request<{ success: boolean; maximumDeliveryDays: { id: number; days: number; countWorkingDaysOnly: boolean } }>('/maximum-delivery-days');
  return { id: data.maximumDeliveryDays.id, days: data.maximumDeliveryDays.days, countWorkingDaysOnly: data.maximumDeliveryDays.countWorkingDaysOnly };
}

export async function updateMaximumDeliveryDays(settings: DaysSettings): Promise<void> {
  await request('/maximum-delivery-days', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchAllowBooking(): Promise<{ id: number; isAllowed: boolean }> {
  const res = await fetch(`${API_BASE}/api/Orders/allow-booking`);
  if (!res.ok) throw new Error(`Failed to fetch allow booking (${res.status})`);
  const data = await res.json();
  return data.allowBooking;
}

export async function updateAllowBooking(isAllowed: boolean): Promise<void> {
  await request('/allow-booking', {
    method: 'PATCH',
    body: JSON.stringify({ isAllowed }),
  });
}

export async function fetchAllowDelivery(): Promise<{ id: number; isAllowed: boolean }> {
  const res = await fetch(`${API_BASE}/api/Orders/allow-delivery`);
  if (!res.ok) throw new Error(`Failed to fetch allow delivery (${res.status})`);
  const data = await res.json();
  return data.allowDelivery;
}

export async function updateAllowDelivery(isAllowed: boolean): Promise<void> {
  await request('/allow-delivery', {
    method: 'PATCH',
    body: JSON.stringify({ isAllowed }),
  });
}

export async function fetchHideProductsWithoutPrice(): Promise<{ id: number; isEnabled: boolean }> {
  const data = await request<{ success: boolean; hideProductsWithoutPrice: { id: number; isEnabled: boolean } }>('/hide-products-without-price');
  return data.hideProductsWithoutPrice;
}

export async function updateHideProductsWithoutPrice(isEnabled: boolean): Promise<void> {
  await request('/hide-products-without-price', {
    method: 'PATCH',
    body: JSON.stringify({ isEnabled }),
  });
}

export async function fetchReservationDuration(): Promise<{ id: number; durationMinutes: number }> {
  const data = await request<{ success: boolean; reservationDuration: { id: number; durationMinutes: number } }>('/reservation-duration');
  return data.reservationDuration;
}

export async function updateReservationDuration(durationMinutes: number): Promise<void> {
  await request('/reservation-duration', {
    method: 'PATCH',
    body: JSON.stringify({ durationMinutes }),
  });
}

export interface OrderLimitsData {
  minOrderPrice: number;
  maxOrderPrice: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  minReservationQuantity: number;
  maxReservationQuantity: number;
  minDeliveryQuantity: number;
  maxDeliveryQuantity: number;
  minProductReservationQuantity: number;
  maxProductReservationQuantity: number;
}

export async function fetchOrderLimits(): Promise<OrderLimitsData & { id: number }> {
  const data = await request<{ success: boolean; orderLimits: OrderLimitsData & { id: number } }>('/order-limits');
  return data.orderLimits;
}

export async function updateOrderLimits(limits: OrderLimitsData): Promise<void> {
  await request('/order-limits', {
    method: 'PATCH',
    body: JSON.stringify(limits),
  });
}

export interface AutoConfirmOrdersData {
  isEnabled: boolean;
  maxAutoConfirmPrice: number;
  maxAutoConfirmQuantity: number;
}

export async function fetchAutoConfirmOrders(): Promise<AutoConfirmOrdersData & { id: number }> {
  const data = await request<{ success: boolean; autoConfirmOrders: AutoConfirmOrdersData & { id: number } }>('/auto-confirm-orders');
  return data.autoConfirmOrders;
}

export async function updateAutoConfirmOrders(settings: AutoConfirmOrdersData): Promise<void> {
  await request('/auto-confirm-orders', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function confirmOrder(orderId: number): Promise<void> {
  await request(`/orders/${orderId}/confirm`, {
    method: 'POST',
  });
}

export async function updateOrderStatus(orderId: number, paymentStatus?: string, shipmentStatus?: string): Promise<void> {
  await request(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ paymentStatus, shipmentStatus }),
  });
}

export async function updatePaymentStatus(orderId: number, status: string): Promise<void> {
  await request(`/orders/${orderId}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateReservationStatus(reservationId: number, status: boolean): Promise<void> {
  await request(`/reservations/${reservationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateDeliveryStatus(deliveryId: number, status: boolean): Promise<void> {
  await request(`/deliveries/${deliveryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface Buyer {
  id: string;
  name: string;
  registeredUsers: number;
}

export interface BuyerUser {
  id: number;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface BuyerOrder {
  id: number;
  userId?: number;
  userName: string;
  isConfirmed: boolean;
  paymentStatus: string;
  shipmentStatus: string;
  createdAt: string;
  reservationsCount: number;
  deliveriesCount: number;
  totalPrice: number;
  totalQuantity: number;
}

export interface BuyerDetail {
  id: string;
  name: string;
  users: BuyerUser[];
  orders: BuyerOrder[];
}

const buyersRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = localStorage.getItem('adminKey');
  if (key) headers['X-Admin-Key'] = key;

  const res = await fetch(`${API_BASE}/api/Buyers${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

export async function fetchBuyers(onlyWithUsers?: boolean): Promise<Buyer[]> {
  const params = onlyWithUsers ? '?onlyWithUsers=true' : '';
  const data = await buyersRequest<{ success: boolean; buyers: Buyer[] }>(params);
  return data.buyers;
}

export interface ReservationItem {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  picked: boolean;
  orderId: number;
  isConfirmed: boolean;
  userBuyerId: string | null;
  userBuyerName: string | null;
}

export interface DeliveryItem {
  id: number;
  deliveryTime: string;
  delivered: boolean;
  orderId: number;
  isConfirmed: boolean;
}

export async function fetchReservations(minDate?: string, maxDate?: string): Promise<ReservationItem[]> {
  const params = new URLSearchParams();
  if (minDate) params.set('minDate', minDate);
  if (maxDate) params.set('maxDate', maxDate);
  const qs = params.toString();
  const data = await request<{ success: boolean; reservations: ReservationItem[] }>(
    `/reservations${qs ? `?${qs}` : ''}`
  );
  return data.reservations;
}

export async function fetchDeliveries(minDate?: string, maxDate?: string): Promise<DeliveryItem[]> {
  const params = new URLSearchParams();
  if (minDate) params.set('minDate', minDate);
  if (maxDate) params.set('maxDate', maxDate);
  const qs = params.toString();
  const data = await request<{ success: boolean; deliveries: DeliveryItem[] }>(
    `/deliveries${qs ? `?${qs}` : ''}`
  );
  return data.deliveries;
}

export async function fetchBuyerDetail(id: string): Promise<BuyerDetail> {
  const data = await buyersRequest<{ success: boolean; buyer: BuyerDetail }>(`/${encodeURIComponent(id)}`);
  return data.buyer;
}
