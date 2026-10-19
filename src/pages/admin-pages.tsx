import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Field, PrimaryButton, inputClass } from "@/components/chrome";
import { CATEGORIES } from "@/data/catalog";
import { formatMoney, statusLabel } from "@/lib/commerce";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { STORAGE_KEY } from "@/lib/storage-key";
import type { OrderStatus } from "@/types";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/carousel", label: "Carousel" },
  { href: "/admin/settings", label: "Settings" },
] as const;

function AdminFrame({ title, children }: { title: string; children: ReactNode }) {
  const { user, ready } = useStore();
  const { path, navigate } = useRouter();

  useEffect(() => {
    // Gate on `ready`: on a hard refresh the persisted session hydrates after
    // mount — navigating before that kicks logged-in admins out to /login.
    if (ready && !user) navigate(`/login?redirect=${encodeURIComponent(path)}`);
  }, [navigate, path, ready, user]);

  if (!ready || !user) {
    return null;
  }
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Staff only</h1>
        <p className="mt-3 text-muted-foreground">This console is gated to atelier operators.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="w-full lg:w-52">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Admin</p>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Admin">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center px-3 text-sm ${path === item.href ? "bg-card text-foreground" : "text-muted-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <div className="mt-8">{children}</div>
      </section>
    </div>
  );
}

export function AdminDashboard() {
  const { orders, products, users } = useStore();
  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalCents, 0);
  return (
    <AdminFrame title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue", value: formatMoney(revenue) },
          { label: "Orders", value: String(orders.length) },
          { label: "Products", value: String(products.length) },
          { label: "Customers", value: String(users.filter((item) => item.role === "customer").length) },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-display text-3xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </AdminFrame>
  );
}

export function AdminProducts() {
  const { products, updateProduct } = useStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const list = products.filter((product) => {
    const matchesQ = !q || product.name.toLowerCase().includes(q.toLowerCase());
    const matchesCat = category === "all" || product.category === category;
    return matchesQ && matchesCat;
  });
  return (
    <AdminFrame title="Products">
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" className={inputClass()} />
        <select className="h-12 border border-border bg-card px-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {list.length === 0 && <p className="text-muted-foreground">No products match.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Visible</th>
            </tr>
          </thead>
          <tbody>
            {list.map((product) => (
              <tr key={product.id} className="border-b border-border">
                <td className="py-3">{product.name}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    className="h-10 w-20 border border-border px-2"
                    value={product.stock}
                    onChange={(e) => updateProduct(product.id, { stock: Number(e.target.value) })}
                    aria-label={`${product.name} stock`}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => updateProduct(product.id, { visible: !product.visible })}
                  >
                    {product.visible ? "Visible" : "Hidden"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminFrame>
  );
}

export function AdminOrders() {
  const { orders } = useStore();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const list = orders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const needle = q.trim().toLowerCase();
    const matchesQ = !needle || order.number.toLowerCase().includes(needle) || order.email.includes(needle);
    return matchesStatus && matchesQ;
  });
  return (
    <AdminFrame title="Orders">
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number or email" className={inputClass()} />
        <select className="h-12 border border-border bg-card px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["pending", "paid", "processing", "in_transit", "delivered", "cancelled", "refunded"].map((value) => (
            <option key={value} value={value}>
              {statusLabel(value as OrderStatus)}
            </option>
          ))}
        </select>
      </div>
      {list.length === 0 && <p className="text-muted-foreground">No orders match those filters.</p>}
      <ul className="divide-y divide-border">
        {list.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-primary">
              {order.number}
            </Link>
            <span className="text-sm text-muted-foreground">{order.email}</span>
            <span className="text-sm">{statusLabel(order.status)}</span>
            <span className="font-mono text-sm">{formatMoney(order.totalCents)}</span>
          </li>
        ))}
      </ul>
    </AdminFrame>
  );
}

export function AdminOrderDetail({ id }: { id: string }) {
  const { orders, updateOrderStatus } = useStore();
  const order = orders.find((item) => item.id === id);
  const [carrier, setCarrier] = useState(order?.carrier ?? "UPS");
  const [tracking, setTracking] = useState(order?.trackingNumber ?? "");
  if (!order) {
    return (
      <AdminFrame title="Order">
        <p>Not found.</p>
      </AdminFrame>
    );
  }
  return (
    <AdminFrame title={order.number}>
      <p className="text-sm text-muted-foreground">
        {order.email} · {order.shippingAddress.line1}, {order.shippingAddress.city}
      </p>
      <ul className="mt-6 text-sm">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between py-1">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-mono">{formatMoney(item.unitCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <label className="mt-6 block text-sm">
        Status
        <select
          className="ml-2 h-11 border border-border bg-card px-2"
          value={order.status}
          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
        >
          {["pending", "paid", "processing", "in_transit", "delivered", "cancelled", "refunded"].map((value) => (
            <option key={value} value={value}>
              {statusLabel(value as OrderStatus)}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-6 grid max-w-md gap-3">
        <Field id="carrier" label="Carrier">
          <input id="carrier" className={inputClass()} value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        </Field>
        <Field id="tracking" label="Tracking number">
          <input id="tracking" className={inputClass()} value={tracking} onChange={(e) => setTracking(e.target.value)} />
        </Field>
        <PrimaryButton
          className="w-fit"
          onClick={() => updateOrderStatus(order.id, "in_transit", { carrier, trackingNumber: tracking })}
        >
          Save tracking
        </PrimaryButton>
      </div>
      <ol className="mt-8 text-sm text-muted-foreground">
        {order.timeline.map((event) => (
          <li key={event.at + event.label}>
            {event.label} · {new Date(event.at).toLocaleString()}
          </li>
        ))}
      </ol>
    </AdminFrame>
  );
}

export function AdminAnalytics() {
  const { orders, products } = useStore();
  const units = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
      }
    }
    return [...map.entries()]
      .map(([id, qty]) => ({ name: products.find((product) => product.id === id)?.name ?? id, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [orders, products]);
  return (
    <AdminFrame title="Analytics">
      <h2 className="font-display text-xl">Units moved</h2>
      <ul className="mt-4">
        {units.map((row) => (
          <li key={row.name} className="flex justify-between border-b border-border py-2 text-sm">
            <span>{row.name}</span>
            <span className="font-mono">{row.qty}</span>
          </li>
        ))}
        {units.length === 0 && <li className="text-muted-foreground">No sales yet.</li>}
      </ul>
    </AdminFrame>
  );
}

export function AdminCategories() {
  return (
    <AdminFrame title="Categories">
      <ul className="grid gap-3">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="border border-border p-4">
            <p className="font-medium text-foreground">{category.name}</p>
            <p className="text-sm text-muted-foreground">{category.blurb}</p>
          </li>
        ))}
      </ul>
    </AdminFrame>
  );
}

export function AdminCarousel() {
  const { carousel, updateCarousel } = useStore();
  return (
    <AdminFrame title="Carousel">
      <ul className="grid gap-4">
        {carousel.map((slide, index) => (
          <li key={slide.id} className="border border-border p-4">
            <Field id={`slide-title-${slide.id}`} label="Title">
              <input
                id={`slide-title-${slide.id}`}
                className={inputClass()}
                value={slide.title}
                onChange={(e) => {
                  const next = carousel.map((item, i) => (i === index ? { ...item, title: e.target.value } : item));
                  updateCarousel(next);
                }}
              />
            </Field>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={slide.active}
                onChange={(e) => {
                  const next = carousel.map((item, i) => (i === index ? { ...item, active: e.target.checked } : item));
                  updateCarousel(next);
                }}
              />
              Active
            </label>
          </li>
        ))}
      </ul>
    </AdminFrame>
  );
}

export function AdminSettings() {
  return (
    <AdminFrame title="Settings">
      <p className="text-sm text-muted-foreground">
        Storefront origin is this browser. Catalog persistence is local (<code>{STORAGE_KEY}</code>). Demo payments
        never hit a network. Database pointer: file:../db/custom.db
      </p>
    </AdminFrame>
  );
}
