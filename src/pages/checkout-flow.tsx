import { useMemo, useState } from "react";
import {
  Banknote,
  ChevronRight,
  CreditCard,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { PrimaryButton } from "@/components/chrome";
import { productById } from "@/data/catalog";
import {
  deliveryWindow,
  formatCardNumber,
  formatExpiry,
  formatMoney,
  isCardNumberValid,
  isEmail,
  isExpiryValid,
  isZip,
} from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

/* Session-42 (F42-05, remediation §31 D2): the success page's COD notice is
   the LARGE amber variant, measured 2026-10-15 — bg-amber-50 /
   border-amber-200 / rounded-2xl(16px) / p-5 / flex gap-4 with a 40px
   amber-100 disc holding a 20px amber-600 Banknote, a 16px/600 amber-900
   title and a 14px/400 amber-700 body (the amount in a <strong>).
   Token-backed; separate from the cart's compact variant
   (CartCodNotice below) — supersedes the s41 D5 hold. */
function SuccessCodNotice({ totalCents }: { totalCents: number }) {
  return (
    <div data-cod-success className="flex gap-4 rounded-[16px] border border-cod-border bg-cod-bg p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9999px] bg-cod-disc">
        <Banknote className="h-5 w-5 text-cod-disc-icon" strokeWidth={2} />
      </div>
      <div>
        <p className="text-base font-semibold text-cod-title-strong">Cash on Delivery</p>
        <p className="mt-0.5 text-sm text-cod-body">
          Please have <strong className="font-bold">{formatMoney(totalCents)}</strong> ready when your order arrives.
          Our delivery team will collect payment at your door.
        </p>
      </div>
    </div>
  );
}

/* Session-41 (F41-20): the reference cart OS carries the AMBER COD box —
   bg-amber-50 / border-amber-200 / amber-800 title / amber-700 body at
   12px, rounded-xl p-3. Token-backed (see --color-cod-* in index.css);
   the compact CART variant — the success page ships the large variant
   above (session-42 D2). */
function CartCodNotice({ totalCents }: { totalCents: number }) {
  return (
    <div data-cod className="rounded-[12px] border border-cod-border bg-cod-bg p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-cod-title">
        💵 Cash on Delivery
      </p>
      <p className="mt-0.5 text-xs text-cod-body">
        Pay when your order arrives — <span className="font-semibold">{formatMoney(totalCents)}</span> due at your door.
      </p>
    </div>
  );
}

/* Session-41 (F41-11/F41-20): the reference primary pill — h-10 40px,
   rounded-full, 14px/500, the v3 `shadow` geometry (measured on both the
   Place Order and Proceed controls). */
const pillButtonClass =
  "inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9999px] bg-primary px-8 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] transition-colors hover:bg-primary/90";

/* Session-41 (F41-06): the shadcn v3 field spec — h-9 36px, text-base
   16px, 12px radius, transparent bg, border-input, px-3 py-1. The shared
   inputClass/PrimaryButton stay 48px for the admin/auth/account surfaces
   (D1 — the s40 contact-form doctrine). */
const checkoutFieldClass = (invalid = false) =>
  `h-9 w-full rounded-[12px] border ${invalid ? "border-destructive" : "border-border"} bg-transparent px-3 py-1 text-base text-foreground shadow-sm placeholder:text-muted-foreground`;

/* Session-41 (F41-07): the reference Country select renders at 14px
   (the shadcn select keeps text-sm). */
const selectFieldClass = "appearance-none text-sm";

export function CartPage() {
  const { cart, products, setLineQty, removeLine, totals, promoCode, setPromo } = useStore();
  const { navigate } = useRouter();
  const [code, setCode] = useState(promoCode ?? "");
  const [promoOpen, setPromoOpen] = useState(Boolean(promoCode));

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">No items in cart. Start shopping to fill it up.</p>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse Products
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* F41-15: the reference h1 is exactly "Your Cart" at 30px — the
          item count lives on the drawer badge, not the page heading. */}
      <h1 className="font-display text-3xl font-bold text-foreground">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {cart.map((line) => {
              const product = productById(line.productId, products);
              if (!product) return null;
              return (
                /* F41-16: rounded-2xl(16px) border/50 hairline card, NO
                   shadow; the 80×80 image is SQUARE (no radius, no border). */
                <li key={line.productId} className="flex gap-4 rounded-[16px] border border-border-soft bg-card p-4">
                  <img src={product.image} alt="" width={80} height={80} className="h-20 w-20 object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                      {product.category.replace("-", " ")}
                    </p>
                    <p className="mt-1 text-base font-bold text-primary">{formatMoney(product.priceCents)}</p>
                    <div className="mt-3 flex items-center gap-2 rounded-full bg-muted px-2 py-1">
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-[9999px] text-foreground"
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-[9999px] text-foreground"
                        aria-label={`Increase ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {/* F41-17: the right column — line total + inline controls. */}
                  <div className="flex flex-col items-end justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {formatMoney(product.priceCents * line.quantity)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-[9999px] text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Continue Shopping
          </Link>
        </div>

        <aside className="h-fit space-y-4 rounded-[16px] border border-border-soft bg-card p-6">
          {/* F41-20: 1px bg-border dividers (not <hr>), Total 18px/700. */}
          <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>
          <div className="h-px shrink-0 bg-border" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">{formatMoney(totals.subtotalCents)}</dd>
            </div>
            {totals.discountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({totals.appliedCode})</dt>
                <dd className="font-medium text-accent">−{formatMoney(totals.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className={cn("font-medium", totals.shippingCents === 0 ? "text-accent" : "text-foreground")}>
                {totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
              </dd>
            </div>
          </dl>
          <div className="h-px shrink-0 bg-border" />
          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatMoney(totals.totalCents)}</span>
          </div>

          <CartCodNotice totalCents={totals.totalCents} />

          {/* Registered superset (PAD §5.6 #2): the collapsed promo entry —
              space-y-4 on the aside owns the block rhythm (no mt double-space). */}
          <div>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              aria-expanded={promoOpen}
              onClick={() => setPromoOpen((open) => !open)}
            >
              Have a promo code?
            </button>
            {promoOpen && (
              <div className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className={checkoutFieldClass()}
                />
                <PrimaryButton className="h-12 px-5" onClick={() => setPromo(code)}>
                  Apply
                </PrimaryButton>
              </div>
            )}
            {totals.notice && (
              <p className="mt-2 text-sm text-destructive" role="status" aria-label="Promotion notice">
                {totals.notice}
              </p>
            )}
            {totals.appliedCode && (
              <p className="mt-2 text-sm text-accent" role="status" aria-label="Promotion status">
                {totals.appliedCode} applied.
              </p>
            )}
          </div>

          <Link href="/checkout" className={pillButtonClass}>
            Proceed to Checkout
            <ChevronRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
  payment: "cod" | "card";
  card: string;
  expiry: string;
  cvc: string;
};

export function CheckoutPage() {
  const { cart, products, totals, user, placeOrder } = useStore();
  const { navigate } = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultAddress = user?.addresses.find((item) => item.isDefault) ?? user?.addresses[0];
  const [form, setForm] = useState<CheckoutForm>({
    name: defaultAddress?.name ?? user?.name ?? "",
    phone: "",
    email: user?.email ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    zip: defaultAddress?.zip ?? "",
    country: defaultAddress?.country ?? "United States",
    notes: "",
    payment: "cod",
    card: "",
    expiry: "",
    cvc: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">No items in cart</h1>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse Products
        </PrimaryButton>
      </div>
    );
  }

  const set = (key: keyof CheckoutForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Full name is required.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (form.email && !isEmail(form.email)) next.email = "Enter a valid email.";
    if (form.line1.trim().length < 4) next.line1 = "Street address is too short.";
    if (form.city.trim().length < 2) next.city = "City is required.";
    if (form.state.trim().length < 2) next.state = "State is required.";
    if (form.zip.trim() && !isZip(form.zip)) next.zip = "Use a 5-digit ZIP.";
    if (form.payment === "card") {
      if (!isCardNumberValid(form.card)) next.card = "Enter a card number of at least 13 digits.";
      if (!isExpiryValid(form.expiry)) next.expiry = "Use MM/YY.";
      if (form.cvc.replace(/\D/g, "").length < 3) next.cvc = "CVC needs 3 digits.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPlace = () => {
    if (!validate()) return;
    setPending(true);
    setError(null);
    const result = placeOrder({
      email: form.email,
      phone: form.phone,
      last4:
        form.payment === "card"
          ? form.card.replace(/\D/g, "").slice(-4)
          : "COD",
      address: {
        name: form.name,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/order-success?order=${encodeURIComponent(result.order.number)}&token=${result.order.guestToken}`);
  };

  const summary = (
    /* F41-10: rounded-2xl(16px) border/50 hairline, NO shadow, sticky
        top-24; 1px bg-border dividers (not <hr>); the item list caps at
        max-h-64 and scrolls; the Total row is 18px/700 with no seam. */
    <aside className="sticky top-24 h-fit space-y-4 rounded-[16px] border border-border-soft bg-card p-6">
      <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>
      <div className="h-px shrink-0 bg-border" />
      <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {cart.map((line) => {
          const product = productById(line.productId, products);
          if (!product) return null;
          return (
            <li key={line.productId} className="flex items-center gap-3">
              <img src={product.image} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {line.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatMoney(product.priceCents * line.quantity)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="h-px shrink-0 bg-border" />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium text-foreground">{formatMoney(totals.subtotalCents)}</dd>
        </div>
        {totals.discountCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount ({totals.appliedCode})</dt>
            <dd className="font-medium text-accent">−{formatMoney(totals.discountCents)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className={cn("font-medium", totals.shippingCents === 0 ? "text-accent" : "text-foreground")}>
            {totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
          </dd>
        </div>
      </dl>
      <div className="h-px shrink-0 bg-border" />
      <div className="flex justify-between text-lg font-bold text-foreground">
        <span>Total</span>
        <span>{formatMoney(totals.totalCents)}</span>
      </div>
      <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" /> Fast delivery
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure
        </span>
      </div>
      <button type="button" className={pillButtonClass} onClick={onPlace} disabled={pending}>
        {pending ? "Placing..." : "Place Order"}
        {!pending && <ChevronRight className="h-4 w-4" />}
      </button>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </aside>
  );

  /* F41-04/05: the reference section card — rounded-2xl(16px) border/50
     hairline, NO shadow, space-y-4 rhythm, h2 text-lg 18px/600. */
  const card = (title: string, children: React.ReactNode) => (
    <section className="space-y-4 rounded-[16px] border border-border-soft bg-card p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Checkout</h1>
      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {card(
            "Contact Information",
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="co-name" className="text-sm font-medium leading-none text-foreground">
                  Full Name *
                </label>
                <input
                  id="co-name"
                    autoComplete="name"
                    required
                    placeholder="John Doe"
                    className={cn(checkoutFieldClass(Boolean(fieldErrors.name)))}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                {fieldErrors.name && <p className="text-sm text-destructive" role="alert">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="co-phone" className="text-sm font-medium leading-none text-foreground">
                  Phone Number *
                </label>
                <input
                  id="co-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className={cn(checkoutFieldClass(Boolean(fieldErrors.phone)))}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                {fieldErrors.phone && <p className="text-sm text-destructive" role="alert">{fieldErrors.phone}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="co-email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={checkoutFieldClass(Boolean(fieldErrors.email))}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                {fieldErrors.email && <p className="text-sm text-destructive" role="alert">{fieldErrors.email}</p>}
              </div>
            </div>,
          )}

          {card(
            "Shipping Address",
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <label htmlFor="co-line1" className="text-sm font-medium text-foreground">
                  Street Address *
                </label>
                <input
                  id="co-line1"
                  autoComplete="address-line1"
                  required
                  placeholder="123 Main Street"
                  className={checkoutFieldClass(Boolean(fieldErrors.line1))}
                  value={form.line1}
                  onChange={(e) => set("line1", e.target.value)}
                />
                {fieldErrors.line1 && <p className="text-sm text-destructive" role="alert">{fieldErrors.line1}</p>}
              </div>
              <div className="space-y-2 sm:col-span-3">
                <label htmlFor="co-line2" className="text-sm font-medium text-foreground">
                  Apartment, Suite, etc. (optional)
                </label>
                <input
                  id="co-line2"
                  autoComplete="address-line2"
                  placeholder="Apt 4B"
                  className={checkoutFieldClass()}
                  value={form.line2}
                  onChange={(e) => set("line2", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="co-city" className="text-sm font-medium text-foreground">
                  City *
                </label>
                <input
                  id="co-city"
                  autoComplete="address-level2"
                  required
                  placeholder="New York"
                  className={checkoutFieldClass(Boolean(fieldErrors.city))}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
                {fieldErrors.city && <p className="text-sm text-destructive" role="alert">{fieldErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="co-state" className="text-sm font-medium text-foreground">
                  State
                </label>
                <input
                  id="co-state"
                  autoComplete="address-level1"
                  placeholder="NY"
                  className={checkoutFieldClass(Boolean(fieldErrors.state))}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
                {fieldErrors.state && <p className="text-sm text-destructive" role="alert">{fieldErrors.state}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="co-zip" className="text-sm font-medium text-foreground">
                  ZIP Code
                </label>
                <input
                  id="co-zip"
                  autoComplete="postal-code"
                  placeholder="10001"
                  className={checkoutFieldClass(Boolean(fieldErrors.zip))}
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                />
                {fieldErrors.zip && <p className="text-sm text-destructive" role="alert">{fieldErrors.zip}</p>}
              </div>
              <div className="space-y-2 sm:col-span-3">
                <label htmlFor="co-country" className="text-sm font-medium text-foreground">
                  Country
                </label>
                <select
                  id="co-country"
                  autoComplete="country-name"
                  className={cn(checkoutFieldClass(), selectFieldClass)}
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  {["United States", "Canada", "United Kingdom", "Australia", "Singapore"].map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>,
          )}

          {card(
            "Payment Method",
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                role="radio"
                aria-checked={form.payment === "cod"}
                onClick={() => set("payment", "cod")}
                className={cn(
                  "flex items-center gap-4 rounded-[12px] border-2 p-4 text-left transition-colors",
                  form.payment === "cod" ? "border-primary bg-primary-faint" : "border-border-soft hover:bg-muted",
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[9999px] bg-primary-film text-primary">
                  <Banknote className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-foreground">Cash on Delivery</span>
                  <span className="block text-sm text-muted-foreground">
                    Pay with cash when your order arrives
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border-2",
                    form.payment === "cod" ? "border-primary" : "border-border",
                  )}
                >
                  {form.payment === "cod" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={form.payment === "card"}
                onClick={() => set("payment", "card")}
                className={cn(
                  "flex items-center gap-4 rounded-[12px] border-2 p-4 text-left transition-colors",
                  form.payment === "card" ? "border-primary bg-primary-faint" : "border-border-soft hover:bg-muted",
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[9999px] bg-primary-film text-primary">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-foreground">Credit / Debit Card</span>
                  <span className="block text-sm text-muted-foreground">
                    Demo checkout — card data never leaves this browser
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border-2",
                    form.payment === "card" ? "border-primary" : "border-border",
                  )}
                >
                  {form.payment === "card" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
              {form.payment === "card" && (
                <div className="grid gap-4 rounded-xl border border-border bg-muted/50 p-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="co-card" className="text-sm font-medium text-foreground">
                      Card number
                    </label>
                    <input
                      id="co-card"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      className={checkoutFieldClass(Boolean(fieldErrors.card))}
                      value={formatCardNumber(form.card)}
                      onChange={(e) => set("card", e.target.value)}
                    />
                    {fieldErrors.card && <p className="text-sm text-destructive" role="alert">{fieldErrors.card}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="co-expiry" className="text-sm font-medium text-foreground">
                      Expiry
                    </label>
                    <input
                      id="co-expiry"
                      autoComplete="cc-exp"
                      placeholder="12/28"
                      className={checkoutFieldClass(Boolean(fieldErrors.expiry))}
                      value={form.expiry}
                      onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                    />
                    {fieldErrors.expiry && (
                      <p className="text-sm text-destructive" role="alert">{fieldErrors.expiry}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="co-cvc" className="text-sm font-medium text-foreground">
                      CVC
                    </label>
                    <input
                      id="co-cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      className={checkoutFieldClass(Boolean(fieldErrors.cvc))}
                      value={form.cvc}
                      onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                    {fieldErrors.cvc && <p className="text-sm text-destructive" role="alert">{fieldErrors.cvc}</p>}
                  </div>
                </div>
              )}
            </div>,
          )}

          {card(
            "Order Notes (optional)",
            <div className="space-y-2">
              <label htmlFor="co-notes" className="sr-only">
                Order notes
              </label>
              <textarea
                id="co-notes"
                rows={3}
                placeholder="Any special delivery instructions..."
                className="min-h-[60px] w-full rounded-[12px] border border-border bg-transparent px-3 py-2 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>,
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}

export function OrderSuccessPage() {
  const query = useQuery();
  const { orders, user } = useStore();
  const number = query.get("order");
  const token = query.get("token");
  const order = useMemo(
    () => orders.find((item) => item.number === number && (item.guestToken === token || item.userId === user?.id)),
    [number, orders, token, user?.id],
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">We cannot show that order</h1>
        <p className="mt-3 text-muted-foreground">The confirmation link is missing or expired.</p>
      </div>
    );
  }

  const windowLabel = deliveryWindow(order.placedAt, order.status);
  const isCod = order.paymentLast4 === "COD";

  return (
    /* F42-01: max-w-2xl py-12 space-y-8 — one 32px rhythm (v4 space-y =
       margin-block-end on non-last children, trap #4). */
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      {/* F42-02/03: text-center space-y-4 header with NO icon disc — the
          reference renders none (the v1 80px accent disc removed,
          remediation §31 D4). */}
      <div className="space-y-4 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Order Placed!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your order. We'll start processing it right away.
          </p>
        </div>
        {/* F42-04: bg-primary/5 + border-primary/20 + px-5 py-2 — alpha-baked
            tokens (v4 /NN would color-mix in oklab, trap #8). */}
        <p
          data-order-pill
          className="inline-flex items-center gap-2 rounded-[9999px] border border-primary-line bg-primary-faint px-5 py-2"
        >
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Order #{order.number}</span>
        </p>
      </div>

      {isCod && <SuccessCodNotice totalCents={order.totalCents} />}

      {/* F42-06/07: 16px-radius hairline card, NO shadow, overflow-hidden;
          the header band is bg-muted/30 (the --color-gallery token) with a
          Playfair 16px/600 h2. */}
      <section data-success-card className="overflow-hidden rounded-[16px] border border-border-soft bg-card">
        <div data-card-band className="border-b border-border-soft bg-gallery p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Order Details</h2>
        </div>
        {/* F42-08: p-5 space-y-3 items — 48px SQUARE images (no radius, no
            border), 14px/500 names, 12px qty, 14px/600 prices. */}
        <div data-order-items className="space-y-3 p-5">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <img src={item.image} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatMoney(item.unitCents * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="h-px shrink-0 bg-border" />
        {/* F42-09: p-5 space-y-2 text-sm — muted 14px/400 rows, the Total
            row 16px/700, "Free" MUTED (not green); the promo Discount row
            (superset #2) rides the same muted spec (§31 D5). */}
        <div data-order-totals className="space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-muted-foreground">{formatMoney(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-muted-foreground">−{formatMoney(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-muted-foreground">
              {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>{formatMoney(order.totalCents)}</span>
          </div>
        </div>
        <div className="h-px shrink-0 bg-border" />
        {/* F42-10: p-5 space-y-3 — h3 Inter 14px/600; FOUR 14px/400 muted
            rows with 16px primary icons (package/phone/mail/map-pin) — the
            phone row is new (Order.phone, §31 D3). */}
        <div data-delivery-info className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">Delivery Information</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-primary" /> {order.shippingAddress.name}
            </li>
            {order.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" /> {order.phone}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" /> {order.email}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip},{" "}
                {order.shippingAddress.country}
              </span>
            </li>
          </ul>
          {/* Registered divergence #6 (superset): the reference ships no
              estimated-delivery row; this one rides the measured row spec. */}
          {windowLabel && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Estimated delivery: <span className="font-semibold text-foreground">{windowLabel}</span>
              </span>
            </p>
          )}
        </div>
      </section>

      {/* F42-11: flex-col sm:flex-row gap-3 with h-9 36px px-4 pills —
          outline (shadow-sm = the pinned v3 geometry) + primary (the v3
          default-shadow geometry, same string as pillButtonClass). The
          reference ships real links; the clone's Link keeps the router. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-[9999px] border border-border bg-transparent px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Back to Home
        </Link>
        <Link
          href="/products"
          className="inline-flex h-9 items-center justify-center rounded-[9999px] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] transition-colors hover:bg-primary/90"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
