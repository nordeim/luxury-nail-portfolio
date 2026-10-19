import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  House,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { BRAND, FOOTER_LEGAL, FOOTER_QUICK_LINKS, NAV_LINKS, productById } from "@/data/catalog";
import { formatMoney } from "@/lib/commerce";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

export function BrandMark({ compact }: { compact?: boolean }) {
  // Session-34 re-measurement: the reference's header brand mark is a 36px
  // rounded-xl (12px) primary square, 20px stroke-2 house glyph,
  // shadow-sm → shadow-md on group hover, beside a 20px/700 Playfair
  // wordmark with default letter-spacing (no tracking-tight).
  return (
    <span className="flex items-center gap-2.5 group">
      {/* rounded-[12px] not rounded-xl: the reference's v3-era rounded-xl
          computes 0.75rem=12px, while this build's v4 --radius-xl is
          1.25rem=20px — a one-notch scale shift (trap-log class §6/§8;
          measure computed styles, never eyeball class names). */}
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-sm transition-shadow group-hover:shadow-md">
        <House className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="font-display text-xl font-bold text-foreground">
        {compact ? BRAND.name : BRAND.name}
      </span>
    </span>
  );
}

export function Header() {
  const { path, navigate } = useRouter();
  const { cartCount, setCartOpen, user, setSearchOpen, searchOpen, visibleProducts } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // The menu's search control matches the reference's compact muted pill at
  // rest; tapping it expands the working input (functional superset — the
  // reference's pill is inert).
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // APG combobox state (session 5, R5-02): which suggestion the arrow keys
  // have activated. -1 = none active. The DOM focus stays in the input; the
  // active option is exposed via aria-activedescendant + aria-selected.
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return visibleProducts
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.category.replace("-", " ").includes(q) ||
          product.materials.some((material) => material.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, visibleProducts]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [path, setSearchOpen]);

  useEffect(() => {
    if (menuOpen) return;
    setMenuSearchOpen(false);
  }, [menuOpen]);

  // Expanding the pill hands focus straight to the revealed input.
  useEffect(() => {
    if (menuSearchOpen) document.getElementById("mobile-search")?.focus();
  }, [menuSearchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // Move focus into the modal panel (first focusable: the search pill, or
    // the search input once expanded).
    document
      .querySelector<HTMLElement>(
        '#mobile-nav-holder input, #mobile-nav-holder button:not([tabindex="-1"]), #mobile-nav-holder a[href]',
      )
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Focus trap: cycle Tab/Shift+Tab within the modal panel so keyboard
      // users cannot reach the dimmed background page (aria-modal contract).
      const holder = document.getElementById("mobile-nav-holder");
      if (!holder) return;
      const focusables = Array.from(
        holder.querySelectorAll<HTMLElement>(
          'a[href], input:not([disabled]), button:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && holder.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so keyboard users keep their place.
      previouslyFocused?.focus?.();
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMenuOpen(false);
    setSearchOpen(false);
    setActiveIndex(-1);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  // WAI-ARIA 1.2 combobox, listbox-popup variant (session 5, R5-02). The
  // overlay previously had no keyboard path to its suggestions at all.
  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (matches.length === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % matches.length); // -1 → 0, last wraps to first
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1)); // -1/0 → last
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(matches.length - 1);
        break;
      case "Enter": {
        if (activeIndex < 0) return; // default form submit → /products?search=
        event.preventDefault();
        const product = matches[activeIndex];
        if (!product) return;
        setMenuOpen(false);
        setSearchOpen(false);
        setActiveIndex(-1);
        navigate(`/product/${product.id}`);
        break;
      }
    }
  };

  return (
    <header className="sticky top-0 z-[300] border-b border-border-soft bg-panel backdrop-blur-xl">
      {/* Session-36 (F36-05) re-measurement: the reference's sticky nav paints
          rgba(255,255,255,0.8) with a 24px backdrop frost and a 0.5-alpha
          hairline — bg-panel (white/80, alpha-baked) + backdrop-blur-xl (24px
          in the v4 scale) + border-border-soft. Was bg-card/95 + blur(8px) +
          solid border (v1 port, never measured). Trap #5 unchanged: any
          backdrop-filter still creates the containing block — the mobile
          menu stays portaled to <body>. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="rounded-md" aria-label="HomeNest home">
            <BrandMark />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="hidden h-11 items-center gap-2 rounded-full border border-border bg-muted px-4 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen(!searchOpen);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
          >
            <Search className="h-4 w-4" />
            Search products...
          </button>
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground md:inline-flex lg:hidden"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen(!searchOpen);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
          >
            <Search strokeWidth={2} />
          </button>
          <Link
            href="/account"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-white"
            aria-label={user ? "Account" : "Sign in"}
          >
            {/* Session-26 re-measurement: the reference renders a plain dark
                lucide-user glyph in BOTH auth states (logged in as the
                owner-supplied User-role account) — no green avatar disc.
                Session-38 (F38-12): the :hover treatment is the shared
                action-row green disc (accent bg, white glyph, 150ms —
                measured live, same family as the trigger/cart buttons). */}
            <UserRound className="h-5 w-5" strokeWidth={2} />
          </Link>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-white"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-white md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {/* Session-27 re-measurement (2026-10-14, agent-browser @390×844,
                logged in with the owner-supplied account): the reference's
                trigger flipped BACK to a bare dark icon in BOTH states —
                36×36 transparent button, rgb(29,24,22) glyph, 16px
                lucide-menu / X, no inner span (verified on /, /products,
                /product/1, closed and open). This surface has now measured
                green (s3/4) → bare (s5) → green (s26) → bare (s27) — an
                oscillating reference; the clone follows the latest
                measurement per the follow-the-latest-measurement doctrine.
                The button keeps the 44px touch-target posture (registered
                a11y superset): the reference's mobile row shrinks to 36px
                buttons with 16px glyphs, while the clone's row keeps the
                desktop-geometry 44px buttons uniformly (account 20px glyph,
                cart 24px), so the trigger glyph stays 20px to keep the row's
                proportional language coherent.
                Session-36 (F36-02): the reference's :hover treatment (both
                states, measured after moving the pointer off the button) is
                an accent-green disc with a white glyph at 150ms —
                hover:bg-accent hover:text-white transition-colors (default
                150ms). The RESTING pin stays the bare icon. */}
            {menuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id={searchId} className="border-t border-border bg-card px-4 py-3 sm:px-6">
          <form onSubmit={submitSearch} className="mx-auto max-w-7xl" role="search">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                id="site-search"
                role="combobox"
                aria-expanded={matches.length > 0}
                aria-autocomplete="list"
                aria-controls={matches.length > 0 ? "site-search-listbox" : undefined}
                aria-activedescendant={
                  activeIndex >= 0 && matches.length > 0 ? `site-search-opt-${activeIndex}` : undefined
                }
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1); // new query, fresh activation
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Search products..."
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {/*
              R14-01 (session 14): polite live region announcing result-count
              changes. Sightless SR users previously got no feedback that the
              suggestion list appeared/changed — the visual list alone is not
              announced while focus stays in the combobox (APG combobox,
              listbox-popup variant). Visually hidden (sr-only): zero impact on
              the reference parity pins.
            */}
            <div role="status" aria-live="polite" className="sr-only">
              {query.trim()
                ? matches.length === 0
                  ? "No products match that search."
                  : `${matches.length} ${matches.length === 1 ? "product matches" : "products match"} your search.`
                : ""}
            </div>
            {query.trim() && matches.length === 0 && (
              <div className="mt-2 rounded-xl border border-border bg-card p-1 shadow-pop">
                <p className="px-4 py-3 text-sm text-muted-foreground">No products match that search.</p>
              </div>
            )}
            {matches.length > 0 && (
              <ul
                id="site-search-listbox"
                className="mt-2 overflow-visible rounded-xl border border-border bg-card p-1 shadow-pop"
                role="listbox"
                aria-label="Suggested products"
              >
                {matches.map((product, index) => (
                  <li
                    key={product.id}
                    role="option"
                    id={`site-search-opt-${index}`}
                    aria-selected={index === activeIndex}
                  >
                    <Link
                      href={`/product/${product.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted",
                        index === activeIndex && "bg-muted",
                      )}
                      onClick={() => setSearchOpen(false)}
                    >
                      <img src={product.image} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
                      <span className="font-medium">{product.name}</span>
                      <span className="ml-auto font-semibold text-primary">{formatMoney(product.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          menuOpen ? (
            <div
              className="fixed inset-x-0 top-16 z-[350] md:hidden"
              id="mobile-nav-holder"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <button
                type="button"
                tabIndex={-1}
                className="fixed inset-0 top-16 -z-10 h-[calc(100vh-4rem)] cursor-default bg-transparent"
                aria-label="Close menu overlay"
                onClick={() => setMenuOpen(false)}
              />
              <nav
                id="mobile-nav"
                className="border-b border-border-soft bg-card"
                aria-label="Mobile"
              >
                {/* Session-36 (F36-03/04) re-measurement: the reference's panel
                    BODY is solid bg-card with a 0.5-alpha bottom hairline (the
                    session-4 "translucent white/80" pin had measured the nav
                    ROOT — the header row — not the panel body; pixel-verified:
                    pure rgb(255,255,255) with zero content bleed-through).
                    Structure: a px-4 py-4 container (the pill wrapper mb-3,
                    links gap-1) mirrors the reference's px-4 py-4 space-y-1. */}
                <div className="px-4 py-4">
                {menuSearchOpen ? (
                  <form onSubmit={submitSearch} role="search" className="mb-3">
                    <label htmlFor="mobile-search" className="sr-only">
                      Search products
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="mobile-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search products..."
                        className="h-11 w-full rounded-full border border-border bg-muted pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[9999px] bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80"
                      aria-label="Search products"
                      onClick={() => setMenuSearchOpen(true)}
                    >
                      {/* Session-36 (F36-04): the reference's resting pill is
                          `flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-muted` (40×28 icon pill on mobile — the label span
                          is `hidden sm:inline`, so the words only render
                          ≥640px where the md:hidden panel is still open).
                          Was a 40×40 icon disc. The tap-to-expand superset
                          stays (PAD §5.6 #13). */}
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Search products...</span>
                    </button>
                  </div>
                )}
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((item) => {
                    const active = path === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex min-h-11 items-center rounded-md px-4 text-sm font-medium",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/account"
                      className="flex min-h-11 items-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      {user ? "Account" : "Sign in"}
                    </Link>
                  </li>
                </ul>
                </div>
              </nav>
            </div>
          ) : null,
          document.body,
        )}
    </header>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, products, setLineQty, removeLine, totals } = useStore();
  const { navigate } = useRouter();
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // Move focus into the modal dialog (first focusable = the close button).
    const drawer = drawerRef.current;
    drawer
      ?.querySelector<HTMLElement>('a[href], button:not([disabled]):not([tabindex="-1"])')
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCartOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Focus trap: cycle Tab/Shift+Tab within the dialog so keyboard users
      // cannot reach the dimmed background page (aria-modal contract).
      const panel = drawerRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]):not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && panel.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so keyboard users keep their place.
      previouslyFocused?.focus?.();
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  /* Session-43 (F43-01…F43-08, remediation §32): the reference's cart icon
     NAVIGATES to /cart — it has no drawer — so this panel is a registered
     superset (PAD §5.6 #22). Per the "supersets keep the measured row
     spec" doctrine (§31 D5), the internals speak the s41-MEASURED cart
     design language (§30 F41-14…F20): 16px hairline cards with square
     80×80 images, muted-pill 24px-button steppers, the inline 16px
     trash-2, the OS footer (h2 18px/700, Total 18px/700) and the h-10
     pill CTA. The panel canvas is bg-background (cream) so the white
     cards read exactly as they do on the page. */
  return (
    <div className="fixed inset-0 z-[500]">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close cart"
        onClick={() => setCartOpen(false)}
      />
      <aside
        ref={drawerRef}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        {/* F43-02/F43-08: the heading is exactly "Your Cart" — the count
            lives on the header badge (F41-15), never the heading. The row
            keeps h-16 with the 0.5-alpha hairline and the 36px close
            control of the measured button family. */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-soft bg-card px-4">
          <h2 className="font-display text-xl font-bold text-foreground">Your Cart</h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 && (
            <div className="py-10 text-center">
              <h3 className="font-display text-lg font-bold text-foreground">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">No items in cart. Start shopping to fill it up.</p>
            </div>
          )}
          <ul className="flex flex-col gap-4">
            {cart.map((line) => {
              const product = productById(line.productId, products);
              if (!product) return null;
              return (
                /* F43-03: the measured card chrome — 16px radius, 0.5-alpha
                   hairline, p-4 gap-4, NO shadow; the 80×80 image is SQUARE. */
                <li
                  key={line.productId}
                  className="flex gap-4 rounded-[16px] border border-border-soft bg-card p-4"
                >
                  <img src={product.image} alt="" width={80} height={80} className="h-20 w-20 object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                      {product.category.replace("-", " ")}
                    </p>
                    <p className="mt-1 text-base font-bold text-primary">{formatMoney(product.priceCents)}</p>
                    {/* F43-05: the MUTED pill stepper — 24×24 buttons, 12px
                        glyphs, 14px/600 value (F41-18). */}
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
                  {/* F43-04/F43-06: the measured right column — 14px/700 line
                      total above the inline 16px trash-2 (F41-17/19). */}
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
        </div>
        {/* F43-07: the measured OS language — h2 18px/700, Total 18px/700,
            the h-10 40px pill CTA (the page's pillButtonClass spec, D3
            keeps the summary compact: no shipping/COD/promo here — the
            full OS lives one tap away on /cart). */}
        <div className="shrink-0 space-y-4 border-t border-border-soft bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">{formatMoney(totals.subtotalCents)}</dd>
            </div>
          </dl>
          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatMoney(totals.totalCents)}</span>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9999px] bg-primary px-8 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              setCartOpen(false);
              navigate("/checkout");
            }}
            disabled={cart.length === 0}
          >
            Checkout
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setCartOpen(false);
              navigate("/cart");
            }}
          >
            View full cart
          </button>
        </div>
      </aside>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[800] flex flex-col gap-2" role="status">
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="pointer-events-auto max-w-xs rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-toast"
        >
          {toast.text}
        </p>
      ))}
    </div>
  );
}

export function ChatButton() {
  const { navigate } = useRouter();
  return (
    <button
      type="button"
      className="fixed bottom-5 right-5 z-[420] inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform hover:scale-105"
      aria-label="Chat with us"
      onClick={() => navigate("/contact")}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}

export function Footer() {
  // Session-34 re-measurement (2026-10-14, agent-browser, logged in,
  // 390×844 + 1440×900): the reference footer is a "quiet" variant on the
  // session-30 bg-foreground canvas — full text-background color modulated
  // by ELEMENT opacity (70% links/tagline/contact, 50% bottom bar), Playfair
  // 16px/600 h4 column headings, a 20px brand wordmark beside a BARE 24px
  // primary house glyph (no orange square — that treatment is header-only),
  // orange 16px Mail/Phone/MapPin contact icons, a contained 1px
  // background/10 divider and a text-xs/50% bottom bar. The contact email
  // and phone stay mailto:/tel: links — a functional superset with identical
  // resting visuals (registered divergence).
  return (
    <footer className="mt-16 bg-footer text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <House className="h-6 w-6 text-primary" strokeWidth={2} />
              <span className="font-display text-xl font-bold">{BRAND.name}</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">{BRAND.tagline}</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-display text-base font-semibold">Quick Links</h4>
            <ul className="space-y-2.5">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm opacity-70 transition-all hover:opacity-100 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-display text-base font-semibold">Policies</h4>
            <ul className="space-y-2.5">
              {FOOTER_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm opacity-70 transition-all hover:opacity-100 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-display text-base font-semibold">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm opacity-70">
                <Mail className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <a href={`mailto:${BRAND.email}`} className="transition-colors hover:text-primary">
                  {BRAND.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm opacity-70">
                <Phone className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <a href={`tel:${BRAND.phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-primary">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm opacity-70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <span>{BRAND.address}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="my-8 h-px w-full bg-footer-rule" />
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs opacity-50">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy-policy"
              className="text-xs opacity-50 transition-opacity hover:opacity-100"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-xs opacity-50 transition-opacity hover:opacity-100"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-xs opacity-50 transition-opacity hover:opacity-100"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function FeatureBar() {
  const items = [
    { icon: Truck, title: "Free Shipping", body: "On orders over $50" },
    { icon: ShieldCheck, title: "Secure Payment", body: "100% protected checkout" },
    { icon: RotateCcw, title: "Easy Returns", body: "30-day return policy" },
    { icon: Headphones, title: "24/7 Support", body: "Dedicated customer care" },
  ];
  /* Session-38 (F38-08) — the measured reference spec: compact p-4 gap-3
     cards on 16px radius (v3 rounded-2xl) with a 0.5-alpha hairline and
     NO shadow; 44px (w-11) discs with 12px radius (v3 rounded-xl — v4's
     computes 20px, trap #6) on an alpha-baked primary film; 20px stroke-2
     glyphs; semibold titles + 12px subs; grid-cols-2 md:grid-cols-4; the
     section itself carries no vertical padding (the page rhythm owns
     spacing — home wraps everything in space-y-16). */
  return (
    <section aria-label="Store highlights" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-[16px] border border-border-soft bg-card p-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-film text-primary">
              <item.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PageShell({ children, admin }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[800] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {!admin && <Footer />}
      <CartDrawer />
      <Toaster />
      {!admin && <ChatButton />}
    </div>
  );
}

export function Field({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function inputClass(error?: boolean) {
  return cn(
    "h-12 w-full rounded-lg border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground",
    error ? "border-destructive" : "border-border",
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 min-w-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 min-w-[44px] items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
