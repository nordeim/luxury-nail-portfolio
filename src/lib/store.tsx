import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CAROUSEL, DEMO_USERS, PRODUCTS, productById } from "@/data/catalog";
import { STORAGE_KEY } from "@/lib/storage-key";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password";
import {
  cartTotals,
  clampQuantity,
  generateGuestToken,
  mergeCartLine,
  nextOrderNumber,
  statusLabel,
} from "@/lib/commerce";
import type {
  Address,
  CarouselSlide,
  CartLine,
  CategoryId,
  Order,
  OrderStatus,
  Product,
  ToastMessage,
  User,
} from "@/types";

interface PersistedState {
  users: User[];
  sessionUserId: string | null;
  cart: CartLine[];
  wishlist: string[];
  orders: Order[];
  products: Product[];
  carousel: CarouselSlide[];
  promoCode: string | null;
  newsletter: string[];
}

function seedState(): PersistedState {
  return {
    users: DEMO_USERS,
    sessionUserId: null,
    cart: [],
    wishlist: [],
    orders: [],
    products: PRODUCTS,
    carousel: CAROUSEL,
    promoCode: null,
    newsletter: [],
  };
}

// Legacy persisted records (pre session-5) kept the password under a
// `password` field as plaintext. Normalize the shape so the store only ever
// reads `passwordHash`; the value stays plaintext until upgrade-on-login
// migrates it (the v4 storage-key bump re-seeds most clients anyway).
function normalizeUser(raw: User): User {
  const { password: legacyPassword, ...rest } = raw as User & { password?: string };
  if (legacyPassword !== undefined && !rest.passwordHash) {
    return { ...rest, passwordHash: legacyPassword };
  }
  return rest as User;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const seed = seedState();
    return {
      users: (parsed.users?.length ? parsed.users : seed.users).map(normalizeUser),
      sessionUserId: parsed.sessionUserId ?? null,
      cart: parsed.cart ?? [],
      wishlist: parsed.wishlist ?? [],
      orders: parsed.orders ?? [],
      products: parsed.products?.length ? parsed.products : seed.products,
      carousel: parsed.carousel?.length ? parsed.carousel : seed.carousel,
      promoCode: parsed.promoCode ?? null,
      newsletter: parsed.newsletter ?? [],
    };
  } catch {
    return seedState();
  }
}

interface StoreValue {
  ready: boolean;
  products: Product[];
  carousel: CarouselSlide[];
  cart: CartLine[];
  wishlist: string[];
  orders: Order[];
  users: User[];
  user: User | null;
  promoCode: string | null;
  toasts: ToastMessage[];
  cartOpen: boolean;
  searchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  totals: ReturnType<typeof cartTotals>;
  cartCount: number;
  toast: (text: string) => void;
  addToCart: (productId: string, quantity?: number) => string | null;
  setLineQty: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  setPromo: (code: string | null) => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (name: string, email: string) => string | null;
  changePassword: (current: string, next: string) => Promise<string | null>;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  placeOrder: (input: {
    email: string;
    address: Omit<Address, "id" | "isDefault" | "label">;
    last4: string;
    phone?: string;
  }) => { ok: true; order: Order } | { ok: false; error: string };
  subscribe: (email: string) => string;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  updateOrderStatus: (id: string, status: OrderStatus, tracking?: { carrier: string; trackingNumber: string }) => void;
  updateCarousel: (slides: CarouselSlide[]) => void;
  visibleProducts: Product[];
  productsByCategory: (id: CategoryId | "all") => Product[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const toast = useCallback((text: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const user = useMemo(
    () => state.users.find((item) => item.id === state.sessionUserId) ?? null,
    [state.users, state.sessionUserId],
  );

  const totals = useMemo(
    () => cartTotals(state.cart, state.products, state.promoCode),
    [state.cart, state.products, state.promoCode],
  );

  const cartCount = useMemo(
    () => state.cart.reduce((sum, line) => sum + line.quantity, 0),
    [state.cart],
  );

  const visibleProducts = useMemo(
    () => state.products.filter((product) => product.visible),
    [state.products],
  );

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = productById(productId, state.products);
      if (!product) return "That product is no longer listed.";
      if (!product.visible) return "That product is not available.";
      if (product.stock <= 0) return "This piece is currently out of stock.";
      const current = state.cart.find((line) => line.productId === productId)?.quantity ?? 0;
      if (current + quantity > product.stock) {
        return `Sorry, ${product.name} only has ${product.stock} left in stock.`;
      }
      setState((prev) => ({
        ...prev,
        cart: mergeCartLine(prev.cart, productId, quantity, product.stock),
      }));
      toast(`${product.name} added to cart.`);
      return null;
    },
    [state.cart, state.products, toast],
  );

  const setLineQty = useCallback((productId: string, quantity: number) => {
    setState((prev) => {
      const product = productById(productId, prev.products);
      if (!product) return prev;
      const nextQty = clampQuantity(quantity, product.stock);
      if (nextQty <= 0) {
        return { ...prev, cart: prev.cart.filter((line) => line.productId !== productId) };
      }
      return {
        ...prev,
        cart: prev.cart.map((line) =>
          line.productId === productId ? { ...line, quantity: nextQty } : line,
        ),
      };
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, cart: prev.cart.filter((line) => line.productId !== productId) }));
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setState((prev) => {
        const on = prev.wishlist.includes(productId);
        return {
          ...prev,
          wishlist: on ? prev.wishlist.filter((id) => id !== productId) : [...prev.wishlist, productId],
        };
      });
      const product = productById(productId, state.products);
      if (product && !state.wishlist.includes(productId)) toast(`${product.name} saved to the nest.`);
    },
    [state.products, state.wishlist, toast],
  );

  const setPromo = useCallback((code: string | null) => {
    setState((prev) => ({ ...prev, promoCode: code }));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const found = state.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return "Email or password is incorrect.";
      const ok = await verifyPassword(password, found.passwordHash);
      if (!ok) return "Email or password is incorrect.";
      // Upgrade-on-login: pre-hash plaintext records get a salted digest in
      // the same write that opens the session.
      const passwordHash = isHashedPassword(found.passwordHash)
        ? found.passwordHash
        : await hashPassword(password);
      setState((prev) => ({
        ...prev,
        users: prev.users.map((item) => (item.id === found.id ? { ...item, passwordHash } : item)),
        sessionUserId: found.id,
      }));
      return null;
    },
    [state.users],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const normalized = email.trim().toLowerCase();
      if (state.users.some((item) => item.email.toLowerCase() === normalized)) {
        return "An account with that email already exists.";
      }
      const id = `u-${Date.now()}`;
      const passwordHash = await hashPassword(password);
      const next: User = {
        id,
        email: normalized,
        name: name.trim() || normalized.split("@")[0] || "Guest",
        role: "customer",
        passwordHash,
        addresses: [],
      };
      setState((prev) => ({
        ...prev,
        users: [...prev.users, next],
        sessionUserId: id,
      }));
      return null;
    },
    [state.users],
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, sessionUserId: null }));
  }, []);

  const updateProfile = useCallback((name: string, email: string) => {
    if (!state.sessionUserId) return "Sign in to update your profile.";
    const normalized = email.trim().toLowerCase();
    const taken = state.users.some(
      (item) => item.email.toLowerCase() === normalized && item.id !== state.sessionUserId,
    );
    if (taken) return "That email is already in use.";
    setState((prev) => ({
      ...prev,
      users: prev.users.map((item) =>
        item.id === prev.sessionUserId ? { ...item, name: name.trim(), email: normalized } : item,
      ),
    }));
    return null;
  }, [state.sessionUserId, state.users]);

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!user) return "Sign in to change your password.";
      const ok = await verifyPassword(current, user.passwordHash);
      if (!ok) return "Current password is incorrect.";
      const passwordHash = await hashPassword(next);
      setState((prev) => ({
        ...prev,
        users: prev.users.map((item) => (item.id === user.id ? { ...item, passwordHash } : item)),
      }));
      return null;
    },
    [user],
  );

  const saveAddress = useCallback((address: Address) => {
    if (!state.sessionUserId) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((item) => {
        if (item.id !== prev.sessionUserId) return item;
        const without = item.addresses.filter((entry) => entry.id !== address.id);
        const nextAddresses = address.isDefault
          ? [{ ...address, isDefault: true }, ...without.map((entry) => ({ ...entry, isDefault: false }))]
          : [...without, address];
        if (!nextAddresses.some((entry) => entry.isDefault) && nextAddresses[0]) {
          nextAddresses[0] = { ...nextAddresses[0], isDefault: true };
        }
        return { ...item, addresses: nextAddresses };
      }),
    }));
  }, [state.sessionUserId]);

  const deleteAddress = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((item) =>
        item.id === prev.sessionUserId
          ? { ...item, addresses: item.addresses.filter((entry) => entry.id !== id) }
          : item,
      ),
    }));
  }, []);

  const placeOrder = useCallback(
    (input: {
      email: string;
      address: Omit<Address, "id" | "isDefault" | "label">;
      last4: string;
      phone?: string;
    }) => {
      if (state.cart.length === 0) return { ok: false as const, error: "No items in cart" };
      for (const line of state.cart) {
        const product = productById(line.productId, state.products);
        if (!product || line.quantity > product.stock) {
          return {
            ok: false as const,
            error: `Sorry, ${product?.name ?? "an item"} only has ${product?.stock ?? 0} left in stock.`,
          };
        }
      }
      const computed = cartTotals(state.cart, state.products, state.promoCode);
      const number = nextOrderNumber(state.orders.map((order) => order.number));
      const placedAt = new Date().toISOString();
      const items = state.cart.flatMap((line) => {
        const product = productById(line.productId, state.products);
        if (!product) return [];
        return [
          {
            productId: product.id,
            name: product.name,
            image: product.image,
            unitCents: product.priceCents,
            quantity: line.quantity,
          },
        ];
      });
      const order: Order = {
        id: `ord-${Date.now()}`,
        number,
        userId: state.sessionUserId,
        email: input.email.trim().toLowerCase(),
        placedAt,
        status: "paid",
        items,
        subtotalCents: computed.subtotalCents,
        discountCents: computed.discountCents,
        shippingCents: computed.shippingCents,
        taxCents: computed.taxCents,
        totalCents: computed.totalCents,
        promoCode: computed.appliedCode,
        shippingAddress: input.address,
        phone: input.phone?.trim() || undefined,
        paymentLast4: input.last4,
        carrier: null,
        trackingNumber: null,
        timeline: [
          { at: placedAt, label: "Order placed" },
          { at: placedAt, label: "Payment captured" },
        ],
        guestToken: generateGuestToken(),
      };
      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        cart: [],
        promoCode: null,
        products: prev.products.map((product) => {
          const line = prev.cart.find((item) => item.productId === product.id);
          if (!line) return product;
          return { ...product, stock: Math.max(0, product.stock - line.quantity) };
        }),
      }));
      return { ok: true as const, order };
    },
    [state.cart, state.orders, state.products, state.promoCode, state.sessionUserId],
  );

  const subscribe = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase();
    setState((prev) => ({
      ...prev,
      newsletter: prev.newsletter.includes(normalized)
        ? prev.newsletter
        : [...prev.newsletter, normalized],
    }));
    return "You are on the atelier list.";
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product) => (product.id === id ? { ...product, ...patch } : product)),
    }));
  }, []);

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus, tracking?: { carrier: string; trackingNumber: string }) => {
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((order) => {
          if (order.id !== id) return order;
          const at = new Date().toISOString();
          const extra = tracking
            ? [{ at, label: `Tracking added · ${tracking.carrier} ${tracking.trackingNumber}` }]
            : [];
          return {
            ...order,
            status,
            carrier: tracking?.carrier ?? order.carrier,
            trackingNumber: tracking?.trackingNumber ?? order.trackingNumber,
            timeline: [...order.timeline, { at, label: `Status updated to ${statusLabel(status)}` }, ...extra],
          };
        }),
      }));
    },
    [],
  );

  const updateCarousel = useCallback((slides: CarouselSlide[]) => {
    setState((prev) => ({ ...prev, carousel: slides }));
  }, []);

  const productsByCategory = useCallback(
    (id: CategoryId | "all") =>
      visibleProducts.filter((product) => (id === "all" ? true : product.category === id)),
    [visibleProducts],
  );

  const value: StoreValue = {
    ready,
    products: state.products,
    carousel: state.carousel,
    cart: state.cart,
    wishlist: state.wishlist,
    orders: state.orders,
    users: state.users,
    user,
    promoCode: state.promoCode,
    toasts,
    cartOpen,
    searchOpen,
    setCartOpen,
    setSearchOpen,
    totals,
    cartCount,
    toast,
    addToCart,
    setLineQty,
    removeLine,
    toggleWishlist,
    setPromo,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    saveAddress,
    deleteAddress,
    placeOrder,
    subscribe,
    updateProduct,
    updateOrderStatus,
    updateCarousel,
    visibleProducts,
    productsByCategory,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}


