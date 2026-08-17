import { CartCoupon, CartTotals } from "./cart";

export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
  options: { name: string; value: string }[];
}

export interface OrderAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  email?: string;   // only on billing
  phone?: string;
}

export interface AppOrder {
  id: string;
  orderKey: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  totals: CartTotals;           // reuses same totals shape as cart
  coupons: CartCoupon[];
  paymentMethod: string;
  paymentMethodTitle: string;
  shippingMethod: string;
  customerNote: string;
  needsPayment: boolean;
  isPaid: boolean;
}