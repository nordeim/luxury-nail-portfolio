import type { CartLine, OrderStatus, Product } from "@/types";

// Reference parity (measured live 2026-10-12): free shipping at $50, flat rate
// under the threshold, and no tax line in cart/checkout summaries.
export const FREE_SHIPPING_THRESHOLD = 5_000;
export const FLAT_SHIPPING_CENTS = 999;
export const TAX_BPS = 0;
export const PROMO_CODE = "NEST10";
export const PROMO_MIN_SPEND = 4_000;
export const PROMO_BPS = 1_000;

export function formatMoney(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars}.${remainder.toString().padStart(2, "0")}`;
}

export function discountPercent(priceCents: number, compareAtCents: number | null): number {
  if (!compareAtCents || compareAtCents <= priceCents) return 0;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

export function lineSubtotal(priceCents: number, quantity: number): number {
  const qty = Math.max(0, Math.floor(quantity));
  return priceCents * qty;
}

export function cartSubtotal(lines: CartLine[], products: Product[]): number {
  return lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return sum;
    return sum + lineSubtotal(product.priceCents, line.quantity);
  }, 0);
}

export function promoDiscount(subtotalCents: number, code: string | null): {
  discountCents: number;
  appliedCode: string | null;
  notice: string | null;
} {
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) {
    return { discountCents: 0, appliedCode: null, notice: null };
  }
  if (normalized !== PROMO_CODE) {
    return { discountCents: 0, appliedCode: null, notice: "That code is not recognized." };
  }
  if (subtotalCents < PROMO_MIN_SPEND) {
    return {
      discountCents: 0,
      appliedCode: null,
      notice: `NEST10 needs a ${formatMoney(PROMO_MIN_SPEND)} merchandise subtotal.`,
    };
  }
  return {
    discountCents: Math.round((subtotalCents * PROMO_BPS) / 10_000),
    appliedCode: PROMO_CODE,
    notice: null,
  };
}

export function shippingCents(merchandiseCents: number): number {
  if (merchandiseCents <= 0) return 0;
  return merchandiseCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_CENTS;
}

export function taxCents(taxableCents: number): number {
  if (taxableCents <= 0) return 0;
  return Math.round((taxableCents * TAX_BPS) / 10_000);
}

export function cartTotals(lines: CartLine[], products: Product[], code: string | null) {
  const subtotalCents = cartSubtotal(lines, products);
  const promo = promoDiscount(subtotalCents, code);
  const afterDiscount = Math.max(0, subtotalCents - promo.discountCents);
  const ship = shippingCents(afterDiscount);
  const tax = taxCents(afterDiscount);
  return {
    subtotalCents,
    discountCents: promo.discountCents,
    appliedCode: promo.appliedCode,
    notice: promo.notice,
    shippingCents: ship,
    taxCents: tax,
    totalCents: afterDiscount + ship + tax,
  };
}

export function clampQuantity(desired: number, stock: number): number {
  if (!Number.isFinite(desired)) return 1;
  const qty = Math.floor(desired);
  if (qty < 1) return 0;
  return Math.min(qty, Math.max(0, stock));
}

export function mergeCartLine(lines: CartLine[], productId: string, delta: number, stock: number): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) {
    const quantity = clampQuantity(delta, stock);
    if (quantity <= 0) return lines;
    return [...lines, { productId, quantity }];
  }
  const quantity = clampQuantity(existing.quantity + delta, stock);
  if (quantity <= 0) return lines.filter((line) => line.productId !== productId);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}

export function nextOrderNumber(existing: string[], now = new Date()): string {
  const year = now.getUTCFullYear();
  const prefix = `ORD-${year}-`;
  let max = 0;
  for (const number of existing) {
    if (!number.startsWith(prefix)) continue;
    const n = Number.parseInt(number.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isZip(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

export function cardDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 19);
}

export function formatCardNumber(value: string): string {
  return cardDigits(value)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isCardNumberValid(value: string): boolean {
  return cardDigits(value).length >= 13;
}

export function isExpiryValid(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // Cards are valid through the last day of the expiry month: the first
  // millisecond of the following month is the expiry instant. The clock is
  // injectable so the rolling window stays deterministically testable.
  const expiryInstant = Date.UTC(year, month, 1);
  return expiryInstant > now.getTime();
}

/**
 * Capability token for guest order views. 128 bits from the platform CSPRNG,
 * hex-encoded (URL-safe). Replaces the former ~59-bit `Math.random` token
 * (remediation-plan.md F-11 / follow-up #3).
 */
export function generateGuestToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function trackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const encoded = encodeURIComponent(trackingNumber.trim());
  const key = carrier.trim().toLowerCase();
  if (key === "ups") return `https://www.ups.com/track?tracknum=${encoded}`;
  if (key === "fedex") return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  if (key === "usps") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  if (key === "dhl") return `https://www.dhl.com/en/express/tracking.html?AWB=${encoded}`;
  return null;
}

export function addBusinessDays(fromIso: string, days: number): Date {
  const date = new Date(fromIso);
  let added = 0;
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return date;
}

export function formatWindow(from: Date, to: Date): string {
  const monthFrom = from.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const monthTo = to.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const dayFrom = from.getUTCDate();
  const dayTo = to.getUTCDate();
  const yearTo = to.getUTCFullYear();
  if (from.getUTCFullYear() === to.getUTCFullYear() && monthFrom === monthTo) {
    return `${monthFrom} ${dayFrom} – ${dayTo}, ${yearTo}`;
  }
  if (from.getUTCFullYear() === to.getUTCFullYear()) {
    return `${monthFrom} ${dayFrom} – ${monthTo} ${dayTo}, ${yearTo}`;
  }
  return `${monthFrom} ${dayFrom}, ${from.getUTCFullYear()} – ${monthTo} ${dayTo}, ${yearTo}`;
}

export function deliveryWindow(placedAt: string, status: OrderStatus): string | null {
  if (status === "delivered" || status === "cancelled" || status === "refunded") return null;
  const start = addBusinessDays(placedAt, 3);
  const end = addBusinessDays(placedAt, 7);
  return formatWindow(start, end);
}

export function validateRedirectPath(value: string | null): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/account";
  return value;
}

export function starFloor(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, Math.floor(rating)));
}
