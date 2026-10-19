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
  // Canonical routes are lowercase; the reference router is case-insensitive
  // ("/Gallery" and "/gallery" both render — Verified) so matching normalizes.
  const normalized = path.toLowerCase();
  if (normalized === "/" || normalized === "/home") return { name: "home", params: {} };
  if (normalized === "/gallery") return { name: "gallery", params: {} };
  if (normalized === "/services") return { name: "services", params: {} };
  if (normalized === "/about") return { name: "about", params: {} };
  if (normalized === "/booking") return { name: "booking", params: {} };
  if (normalized === "/login") return { name: "login", params: {} };
  if (normalized === "/register") return { name: "register", params: {} };
  if (normalized === "/reset") return { name: "reset", params: {} };
  if (normalized === "/account") return { name: "account", params: {} };
  if (normalized === "/admin/bookings") return { name: "admin-bookings", params: {} };
  return { name: "not-found", params: {} };
}
