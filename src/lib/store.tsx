import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_USERS } from "@/data/studio";
import { STORAGE_KEY } from "@/lib/storage-key";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password";
import { validateBooking, todayIso, type BookingInput } from "@/lib/booking";
import type { BookingRequest, BookingStatus, ToastMessage, User } from "@/types";

interface PersistedState {
  users: User[];
  sessionUserId: string | null;
  bookings: BookingRequest[];
}

function seedState(): PersistedState {
  return {
    users: DEMO_USERS,
    sessionUserId: null,
    bookings: [],
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const seed = seedState();
    return {
      users: parsed.users?.length ? parsed.users : seed.users,
      sessionUserId: parsed.sessionUserId ?? null,
      bookings: parsed.bookings ?? [],
    };
  } catch {
    return seedState();
  }
}

type CreateBookingResult =
  | { ok: true; booking: BookingRequest }
  | { ok: false; errors: Partial<Record<keyof BookingInput, string>> };

interface StoreValue {
  ready: boolean;
  user: User | null;
  users: User[];
  bookings: BookingRequest[];
  toasts: ToastMessage[];
  toast: (text: string) => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createBooking: (input: BookingInput) => CreateBookingResult;
  cancelBooking: (id: string) => void;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  bookingsForUser: (userId: string) => BookingRequest[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private-mode persistence failure is non-fatal (session-only demo).
    }
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

  const login = useCallback(
    async (email: string, password: string) => {
      const found = state.users.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
      );
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
        users: prev.users.map((item) =>
          item.id === found.id ? { ...item, passwordHash } : item,
        ),
        sessionUserId: found.id,
      }));
      return null;
    },
    [state.users],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (state.users.some((item) => item.email.toLowerCase() === normalized)) {
        return "An account with that email already exists.";
      }
      const id = `u-${Date.now()}`;
      const passwordHash = await hashPassword(password);
      const next: User = {
        id,
        email: normalized,
        name: normalized.split("@")[0] || "Guest",
        role: "customer",
        passwordHash,
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

  const createBooking = useCallback(
    (input: BookingInput): CreateBookingResult => {
      const errors = validateBooking(input, {
        today: todayIso(),
        knownServices: undefined,
      });
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      const booking: BookingRequest = {
        id: `bk-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        serviceId: input.serviceId,
        date: input.date,
        timeSlot: input.timeSlot,
        notes: input.notes.trim(),
        userId: state.sessionUserId,
        status: "received",
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
      return { ok: true, booking };
    },
    [state.sessionUserId],
  );

  const setBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((booking) =>
        booking.id === id ? { ...booking, status } : booking,
      ),
    }));
  }, []);

  const cancelBooking = useCallback(
    (id: string) => {
      setBookingStatus(id, "cancelled");
      toast("Booking request cancelled.");
    },
    [setBookingStatus, toast],
  );

  const bookingsForUser = useCallback(
    (userId: string) => state.bookings.filter((booking) => booking.userId === userId),
    [state.bookings],
  );

  const value: StoreValue = {
    ready,
    user,
    users: state.users,
    bookings: state.bookings,
    toasts,
    toast,
    login,
    register,
    logout,
    createBooking,
    cancelBooking,
    setBookingStatus,
    bookingsForUser,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
