export type CategoryId =
  | "cookware"
  | "bakeware"
  | "kitchen-tools"
  | "storage"
  | "appliances"
  | "dining"
  | "cleaning"
  | "decor";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  reviewCount: number;
  stock: number;
  visible: boolean;
  featured: boolean;
  isNew: boolean;
  image: string;
  gallery: string[];
  badge: string | null;
  materials: string[];
  features: string[];
  description: string;
  shippingNote: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  /**
   * Salted WebCrypto digest — `s1$<salt>$<sha256(salt:password)>` (see
   * src/lib/password.ts). Pre-session-5 records were plaintext under a
   * `password` field; they are normalized on rehydrate and migrated to a
   * digest on the next successful login (upgrade-on-login).
   */
  passwordHash: string;
  addresses: Address[];
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  unitCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  userId: string | null;
  email: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  promoCode: string | null;
  shippingAddress: Omit<Address, "id" | "isDefault" | "label">;
  /* Session-42 (F42-10, remediation §31 D3): optional additive field — the
     reference's success page renders a phone row in Delivery Information.
     Old persisted orders hydrate without it (no row rendered); the catalog
     seed is untouched, so no STORAGE_KEY bump. */
  phone?: string;
  paymentLast4: string;
  carrier: string | null;
  trackingNumber: string | null;
  timeline: { at: string; label: string }[];
  guestToken: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  kicker: string;
  body: string;
  cta: string;
  href: string;
  image: string;
  active: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
