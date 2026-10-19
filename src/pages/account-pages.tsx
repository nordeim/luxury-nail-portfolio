import { useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Search,
  Truck,
  User,
} from "lucide-react";
import { BrandMark, Field, PrimaryButton, inputClass } from "@/components/chrome";
import { ProductCard } from "@/components/product";
import { BRAND } from "@/data/catalog";
import {
  deliveryWindow,
  formatMoney,
  isEmail,
  isZip,
  statusLabel,
  trackingUrl,
  validateRedirectPath,
} from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/types";
import { cn } from "@/utils/cn";

function AuthCard({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useStore();
  const { navigate } = useRouter();
  const query = useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const message =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, email.split("@")[0] ?? "Guest");
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    navigate(validateRedirectPath(query.get("redirect")));
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BrandMark compact={false} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome to HomeNest Kitchen" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue" : "Join the house in seconds"}
          </p>
        </div>
        {error && (
          <p className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <Field id="auth-email" label="Email">
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={inputClass()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field id="auth-password" label="Password">
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              placeholder="••••••••"
              className={inputClass()}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {mode === "register" && (
            <Field id="auth-confirm" label="Confirm password">
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className={inputClass()}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          )}
          <PrimaryButton type="submit" className="w-full" disabled={pending}>
            {pending
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </PrimaryButton>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Need an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
      {mode === "login" && (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Demo customer: john@example.com / Demo1234!
          <br />
          Demo admin: admin@homenest.kitchen / Admin1234!
        </p>
      )}
    </div>
  );
}

export function LoginPage() {
  return <AuthCard mode="login" />;
}

export function RegisterPage() {
  return <AuthCard mode="register" />;
}

const STEPS: { key: OrderStatus[]; label: string; caption: string; icon: typeof Package }[] = [
  { key: ["pending"], label: "Order Placed", caption: "We've received your order", icon: CheckCircle2 },
  { key: ["paid"], label: "Confirmed", caption: "Your order has been confirmed", icon: Check },
  { key: ["processing"], label: "Processing", caption: "Your order is being prepared", icon: Clock },
  { key: ["in_transit"], label: "Shipped", caption: "Your order is on the way", icon: Truck },
  { key: ["delivered"], label: "Delivered", caption: "Order delivered successfully", icon: PackageCheck },
];

function stepIndexFor(status: OrderStatus): number {
  if (status === "cancelled" || status === "refunded") return -1;
  const index = STEPS.findIndex((step) => step.key.includes(status));
  return index === -1 ? 0 : index;
}

export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = stepIndexFor(status);
  if (current === -1) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        This order was {statusLabel(status).toLowerCase()}. Contact us if anything looks off.
      </p>
    );
  }
  return (
    <ol className="relative flex flex-col gap-0 py-1" aria-label="Order progress">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const Icon = step.icon;
        return (
          <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="pt-1">
              <span className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", active || done ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </span>
                {active && <span className="text-xs font-medium text-primary">(Current)</span>}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{step.caption}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderItems({ order }: { order: Order }) {
  return (
    <>
      <ul className="flex flex-col gap-4 px-6 py-5">
        {order.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4">
            <img
              src={item.image}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg border border-border bg-muted object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} × {formatMoney(item.unitCents)}
              </p>
            </div>
            <span className="font-bold text-foreground">{formatMoney(item.unitCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-border px-6 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-muted-foreground">{formatMoney(order.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className={order.shippingCents === 0 ? "text-accent" : "text-muted-foreground"}>
            {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-bold text-foreground">Total</dt>
          <dd className="font-bold text-foreground">{formatMoney(order.totalCents)}</dd>
        </div>
      </dl>
    </>
  );
}

function DeliveryInfo({ order }: { order: Order }) {
  return (
    <div className="border-t border-border px-6 py-5">
      <h3 className="text-sm font-bold text-foreground">Delivery Information</h3>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" /> {order.shippingAddress.name}
        </li>
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> {order.email}
        </li>
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.state} {order.shippingAddress.zip}, {order.shippingAddress.country}
          </span>
        </li>
      </ul>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {title && (
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

/* F41-24 → F42-13 (s42 supersession): the reference list is a space-y-3
   wrapper of ONE CARD PER ORDER (the s41 "ONE card" reading was a
   single-order-list artifact — re-measured 2026-10-15 with two orders).
   Row internals hold from s41: p-5 flex items-center gap-4, number
   16px/600, status pill 12px/600, meta 12px/400 — with hover:bg-muted/30
   rows linking to the order detail (superset navigation, PAD §5.6 #20 —
   the reference's rows expand in place; function exceeds via the detail
   page). */
function OrderRow({ order }: { order: Order }) {
  return (
    <li className="overflow-hidden rounded-[16px] border border-border-soft bg-card">
      <Link
        href={`/account/orders/${order.id}`}
        className="flex w-full items-center gap-4 p-5 transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{order.number}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.placedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            <span aria-hidden> · </span>
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
            {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground">{formatMoney(order.totalCents)}</span>
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            order.status === "delivered"
              ? "bg-accent-soft text-accent"
              : order.status === "cancelled" || order.status === "refunded"
                ? "bg-destructive/10 text-destructive"
                : "bg-badge/15 text-foreground",
          )}
        >
          {statusLabel(order.status)}
        </span>
      </Link>
    </li>
  );
}

export function AccountPage() {
  const { user, ready, logout, orders, wishlist, products, updateProfile, changePassword, saveAddress, deleteAddress } =
    useStore();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<"orders" | "profile" | "addresses" | "saved">("orders");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Parameters<typeof saveAddress>[0] | null>(null);

  if (!ready) {
    return null;
  }

  if (!user) {
    return <AuthCard mode="login" />;
  }

  const mine = orders.filter((order) => order.userId === user.id);
  const saved = products.filter((product) => wishlist.includes(product.id) && product.visible);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      {/* R5-06: the row wraps and the identity block has a min-width floor —
          long names/emails used to push the Log out control off-viewport on
          phones (pinned by tests/e2e/account-layout.spec.ts).
          F41-22 (s41): the reference chrome — rounded-2xl(16px) border/50
          hairline, NO shadow, 20px identity gap, a lucide-USER avatar,
          a 20px h1, and the CREAM role pill visible at all widths. */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border-soft bg-card p-6">
        <div className="flex min-w-0 items-center gap-5">
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-film text-primary">
            <User className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <h1 className="break-words font-display text-xl font-bold text-foreground">{user.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 break-all text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {user.role}
          </span>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["orders", "profile", "addresses", "saved"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border",
            )}
            onClick={() => setTab(key)}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">Order History</h2>
          {mine.length === 0 ? (
            <div className="rounded-[16px] border border-border-soft bg-card py-14 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.4} />
              <p className="mt-4 text-base font-semibold text-foreground">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start shopping to see your orders here.</p>
              <Link
                href="/products"
                className="mt-5 inline-flex h-11 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul data-orders-list className="space-y-3">
              {mine.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div className=" grid max-w-lg gap-6">
          <Card>
            <form
              className="grid gap-4 p-6"
              onSubmit={(event) => {
                event.preventDefault();
                const err = updateProfile(name, email);
                setProfileMsg(err ?? "Profile updated.");
              }}
            >
              <Field id="profile-name" label="Name">
                <input id="profile-name" className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field id="profile-email" label="Email">
                <input
                  id="profile-email"
                  type="email"
                  className={inputClass()}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}
              <PrimaryButton type="submit" className="w-fit">
                Save
              </PrimaryButton>
            </form>
          </Card>
          <Card>
            <form
              className="grid gap-4 p-6"
              onSubmit={async (event) => {
                event.preventDefault();
                if (pw.next !== pw.confirm) {
                  setPwMsg("Passwords do not match.");
                  return;
                }
                if (pw.next.length < 8) {
                  setPwMsg("Password must be at least 8 characters.");
                  return;
                }
                const err = await changePassword(pw.current, pw.next);
                setPwMsg(err ?? "Password updated.");
                if (!err) setPw({ current: "", next: "", confirm: "" });
              }}
            >
              <h2 className="font-display text-xl font-bold text-foreground">Change password</h2>
              <Field id="pw-current" label="Current password">
                <input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass()}
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                />
              </Field>
              <Field id="pw-next" label="New password">
                <input
                  id="pw-next"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass()}
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
              </Field>
              <Field id="pw-confirm" label="Confirm">
                <input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass()}
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
              </Field>
              {pwMsg && <p className="text-sm text-muted-foreground">{pwMsg}</p>}
              <PrimaryButton type="submit" className="w-fit">
                Update password
              </PrimaryButton>
            </form>
          </Card>
        </div>
      )}

      {tab === "addresses" && (
        <div className="">
          <ul className="grid gap-4 sm:grid-cols-2">
            {user.addresses.map((address) => (
              <li key={address.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="font-semibold text-foreground">
                  {address.label}{" "}
                  {address.isDefault && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Default</span>}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city} {address.state} {address.zip}
                </p>
                <div className="mt-3 flex gap-4 text-sm font-medium">
                  <button type="button" className="text-primary hover:underline" onClick={() => setEditing(address)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAddress(address.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <PrimaryButton
            className="mt-6 w-fit"
            onClick={() =>
              setEditing({
                id: `a-${Date.now()}`,
                label: "Home",
                name: user.name,
                line1: "",
                line2: "",
                city: "",
                state: "",
                zip: "",
                country: "United States",
                isDefault: user.addresses.length === 0,
              })
            }
          >
            Add address
          </PrimaryButton>
          {editing && (
            <form
              className="mt-6 grid max-w-lg gap-3 rounded-xl border border-border bg-card p-6 shadow-card"
              onSubmit={(event) => {
                event.preventDefault();
                if (editing.line1.trim().length < 4 || !isZip(editing.zip)) return;
                saveAddress(editing);
                setEditing(null);
              }}
            >
              <Field id="addr-label" label="Label">
                <input
                  id="addr-label"
                  className={inputClass()}
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                />
              </Field>
              <Field id="addr-line1" label="Street">
                <input
                  id="addr-line1"
                  className={inputClass()}
                  value={editing.line1}
                  onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="addr-city" label="City">
                  <input
                    id="addr-city"
                    className={inputClass()}
                    value={editing.city}
                    onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                  />
                </Field>
                <Field id="addr-zip" label="ZIP">
                  <input
                    id="addr-zip"
                    className={inputClass()}
                    value={editing.zip}
                    onChange={(e) => setEditing({ ...editing, zip: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={editing.isDefault}
                  onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                />
                Default address
              </label>
              <div className="flex gap-3">
                <PrimaryButton type="submit">Save</PrimaryButton>
                <button
                  type="button"
                  className="h-12 px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="">
          {saved.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-14 text-center shadow-card">
              <p className="text-sm text-muted-foreground">Nothing saved yet. Tap the heart on any product.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountOrderPage({ id }: { id: string }) {
  const { user, ready, orders } = useStore();
  if (!ready) {
    return null;
  }
  const order = orders.find((item) => item.id === id);
  if (!user || !order || order.userId !== user.id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Order not found</h1>
      </div>
    );
  }
  const href = trackingUrl(order.carrier, order.trackingNumber);
  const windowLabel = deliveryWindow(order.placedAt, order.status);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to account
      </Link>
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Order Number</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{order.number}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Placed on{" "}
              {new Date(order.placedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="rounded-full bg-badge/15 px-3 py-1.5 text-sm font-semibold text-foreground">
            {statusLabel(order.status)}
          </span>
        </div>
        {order.trackingNumber && (
          <p className="mt-4 text-sm text-muted-foreground">
            Tracking: {order.carrier}{" "}
            {href ? (
              <a href={href} className="font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-semibold text-foreground">{order.trackingNumber}</span>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Card title="Order Progress">
          <div className="px-6 py-5">
            <OrderProgress status={order.status} />
          </div>
        </Card>
        <Card title="Items Ordered">
          <OrderItems order={order} />
        </Card>
        {windowLabel && (
          <p className="text-sm text-muted-foreground">
            <Truck className="mr-1.5 inline h-4 w-4 text-primary" />
            Estimated delivery: <span className="font-semibold text-foreground">{windowLabel}</span>
          </p>
        )}
        <ol className="rounded-xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-card">
          {order.timeline.map((event) => (
            <li key={event.at + event.label} className="flex justify-between gap-4 py-1">
              <span>{event.label}</span>
              <span className="text-xs">{new Date(event.at).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function TrackOrderPage() {
  const { orders } = useStore();
  const [number, setNumber] = useState("");
  const [found, setFound] = useState<Order | null | "miss">(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const match = orders.find(
      (order) => order.number.toLowerCase() === number.trim().toLowerCase(),
    );
    setFound(match ?? "miss");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* F41-26 (s41): 56px (w-14) disc + 28px (w-7) icon, h1 text-3xl
          30px, sub 16px — the reference entry shell. */}
      <div className="text-center space-y-2">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-film">
          <Package className="h-7 w-7 text-primary" strokeWidth={1.7} />
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Track Your Order</h1>
        <p className="text-base text-muted-foreground">
          Enter your order number to see the current status
        </p>
      </div>

      <form className="mx-auto mt-8 flex max-w-xl gap-3" onSubmit={onSubmit} role="search">
        <label htmlFor="track-number" className="sr-only">
          Order number
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="track-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. ORD-ABC123"
            className="h-9 w-full rounded-[9999px] border border-border bg-transparent pl-11 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[9999px] bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Track
        </button>
      </form>

      {found === "miss" && (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive" role="alert">
          No matching order. Check the number on your confirmation page.
        </p>
      )}

      {found && found !== "miss" && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Order Number
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">{found.number}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Placed on{" "}
                  {new Date(found.placedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-badge/15 px-3 py-1.5 text-sm font-semibold text-foreground">
                {statusLabel(found.status)}
              </span>
            </div>
          </div>

          <Card title="Order Progress">
            <div className="px-6 py-5">
              <OrderProgress status={found.status} />
            </div>
          </Card>

          {found.paymentLast4 === "COD" && found.status !== "delivered" && (
            <div className="rounded-xl border border-badge/40 bg-badge/10 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                Cash on Delivery
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Amount due: <span className="font-bold text-primary">{formatMoney(found.totalCents)}</span>
              </p>
            </div>
          )}

          <Card title="Items Ordered">
            <OrderItems order={found} />
          </Card>

          <Card>
            <DeliveryInfo order={found} />
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Demo note: orders live in this browser's local storage. {BRAND.email} can help with anything else.
          </p>
        </div>
      )}
    </div>
  );
}
