import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

interface RouterValue {
  path: string;
  search: string;
  hash: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function readLocation() {
  return {
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLoc(readLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    setLoc(readLocation());
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const value = useMemo(
    () => ({ path: loc.path, search: loc.search, hash: loc.hash, navigate }),
    [loc.path, loc.search, loc.hash, navigate],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

export function useQuery(): URLSearchParams {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
}

export function Link({ href, children, className, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onClick?.();
    navigate(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function matchPath(path: string): { name: string; params: Record<string, string> } {
  if (path === "/") return { name: "home", params: {} };
  if (path === "/products") return { name: "products", params: {} };
  const product = /^\/products\/([^/]+)$/.exec(path);
  if (product?.[1]) return { name: "product", params: { slug: decodeURIComponent(product[1]) } };
  // Reference-site URL shape: /product/{id}. Slug deep-links (/products/{slug}) stay supported.
  const productAlt = /^\/product\/([^/]+)$/.exec(path);
  if (productAlt?.[1]) return { name: "product", params: { slug: decodeURIComponent(productAlt[1]) } };
  if (path === "/cart") return { name: "cart", params: {} };
  if (path === "/checkout") return { name: "checkout", params: {} };
  if (path === "/order-success") return { name: "order-success", params: {} };
  if (path === "/account") return { name: "account", params: {} };
  const accountOrder = /^\/account\/orders\/([^/]+)$/.exec(path);
  if (accountOrder?.[1]) return { name: "account-order", params: { id: decodeURIComponent(accountOrder[1]) } };
  if (path === "/login") return { name: "login", params: {} };
  if (path === "/register") return { name: "register", params: {} };
  if (path === "/about") return { name: "about", params: {} };
  if (path === "/contact") return { name: "contact", params: {} };
  if (path === "/track-order") return { name: "track-order", params: {} };
  if (path === "/privacy-policy") return { name: "privacy-policy", params: {} };
  if (path === "/terms-of-service") return { name: "terms-of-service", params: {} };
  if (path === "/refund-policy") return { name: "refund-policy", params: {} };
  if (path === "/cookie-policy") return { name: "cookie-policy", params: {} };
  if (path === "/disclaimer") return { name: "disclaimer", params: {} };
  if (path === "/admin" || path === "/admin/dashboard") return { name: "admin-dashboard", params: {} };
  if (path === "/admin/products") return { name: "admin-products", params: {} };
  if (path === "/admin/orders") return { name: "admin-orders", params: {} };
  if (path === "/admin/analytics") return { name: "admin-analytics", params: {} };
  if (path === "/admin/categories") return { name: "admin-categories", params: {} };
  if (path === "/admin/carousel") return { name: "admin-carousel", params: {} };
  if (path === "/admin/settings") return { name: "admin-settings", params: {} };
  const adminOrder = /^\/admin\/orders\/([^/]+)$/.exec(path);
  if (adminOrder?.[1]) return { name: "admin-order", params: { id: decodeURIComponent(adminOrder[1]) } };
  return { name: "not-found", params: {} };
}
