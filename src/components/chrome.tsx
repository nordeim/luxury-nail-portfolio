import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { FOOTER_NAV, NAV_LINKS, STUDIO } from "@/data/studio";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { applyTheme, readStoredMode, resolveTheme, writeStoredMode } from "@/lib/theme";
import { cn } from "@/utils/cn";
import type { ThemeMode } from "@/types";

// Header / mobile menu / footer shell.
// Mobile menu contract (docs/implementation-plan.md §4.5, pinned by
// tests/e2e/mobile-navigation.spec.ts):
//   - portaled to <body> (backdrop-filter containing-block trap),
//   - full-screen overlay, brand top-left, close top-right (reference match),
//   - links stacked with gap-* — never space-y with mt-* children (v4 trap 4),
//   - focus trapped, Escape closes, background scroll locked,
//   - link click navigates and dismisses (verified on the reference).

export function BrandMark({ hero }: { hero?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-2xl leading-none tracking-[0.02em]",
        hero ? "text-hero-ink" : "text-foreground",
      )}
      aria-label="Aurelia — home"
    >
      {STUDIO.name}
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(resolveTheme(mode, media.matches));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mode]);

  const cycle = () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
    writeStoredMode(next);
  };

  const isDark = () => document.documentElement.classList.contains("dark");
  const [darkNow, setDarkNow] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDarkNow(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Color theme: ${mode}. Activate to switch.`}
      title={`Theme: ${mode}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
        "border-hairline/70 text-current hover:border-gold hover:text-gold",
        className,
      )}
      data-theme-mode={mode}
      data-theme-dark={darkNow ? "true" : "false"}
    >
      {darkNow ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

export function Header() {
  const { path } = useRouter();
  const { user } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const overlay = path === "/";
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  return (
    <>
      <header
        className={cn(
          overlay
            ? "absolute inset-x-0 top-0 z-(--z-sticky) text-hero-ink"
            : "border-b border-hairline bg-background text-foreground",
        )}
        data-header-overlay={overlay ? "true" : "false"}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <BrandMark hero={overlay} />
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="eyebrow opacity-90 transition-opacity hover:text-gold hover:opacity-100"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link href="/account" className="eyebrow opacity-90 hover:opacity-100">
                Account
              </Link>
            ) : (
              <Link href="/login" className="eyebrow opacity-90 hover:opacity-100">
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-controls={menuId}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu id={menuId} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      data-mobile-menu="open"
      className="fixed inset-0 z-(--z-overlay) flex flex-col bg-background text-foreground"
    >
      <div className="flex h-20 items-center justify-between px-6">
        <BrandMark />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="inline-flex h-10 w-10 items-center justify-center"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-8 px-8 pb-24">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onClose}
            className="font-display text-4xl text-foreground transition-colors hover:text-gold"
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-4 flex flex-col gap-8">
          <AccountMenuLink onClose={onClose} />
        </div>
      </nav>
    </div>,
    document.body,
  );
}

function AccountMenuLink({ onClose }: { onClose: () => void }) {
  const { user } = useStore();
  return (
    <Link
      href={user ? "/account" : "/login"}
      onClick={onClose}
      className="font-display text-4xl text-foreground transition-colors hover:text-gold"
    >
      {user ? "Account" : "Sign In"}
    </Link>
  );
}

export function CtaLink({
  href,
  children,
  tone = "dark",
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "light" | "outline";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "eyebrow group inline-flex items-center gap-3 px-8 py-4 transition-colors",
        tone === "dark" &&
          "bg-band text-band-foreground hover:bg-ink-soft hover:text-background",
        tone === "light" &&
          "bg-hero-pill text-hero-pill-ink hover:bg-surface-raised",
        tone === "outline" &&
          "border border-current bg-transparent hover:border-gold hover:text-gold",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-band text-band-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 md:grid-cols-[2fr_1fr_1fr] lg:px-10">
        <div>
          <p className="font-display text-3xl">{STUDIO.name}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-band-muted">{STUDIO.tagline}</p>
        </div>
        <div>
          <h4 className="eyebrow text-band-muted">Navigate</h4>
          <ul className="mt-5 flex flex-col gap-3">
            {FOOTER_NAV.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-band-muted transition-colors hover:text-band-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="eyebrow text-band-muted">Connect</h4>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-band-muted">
            <li>
              <a
                href="https://instagram.com/aurelia.nails"
                target="_blank"
                rel="noreferrer noopener"
                className="transition-colors hover:text-band-foreground"
              >
                {STUDIO.instagram}
              </a>
            </li>
            <li>{STUDIO.addressLines[1]}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-band-hairline">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-6 text-[0.6875rem] uppercase tracking-[0.18em] text-band-muted md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© 2025 {STUDIO.fullName}. All rights reserved.</p>
          <p>Demo website — Portfolio Concept</p>
        </div>
      </div>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  if (toasts.length === 0) return null;
  return createPortal(
    <div aria-live="polite" className="fixed bottom-6 left-6 z-(--z-toast) flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-fade-in rounded-md bg-band px-5 py-3 text-sm text-band-foreground shadow-toast"
        >
          {toast.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toasts />
    </div>
  );
}
