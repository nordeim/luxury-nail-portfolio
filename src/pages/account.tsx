import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import { serviceById } from "@/data/studio";
import { ThemeToggle } from "@/components/chrome";

// Account (superset — the reference has no signed-in surface): profile,
// booking-request history, sign out. Protected-route contract: unauthenticated
// visits render the sign-in prompt rather than leaking data.

export function AccountPage() {
  const { user, ready, bookingsForUser, cancelBooking, logout } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-6 py-28 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-28 text-center">
        <p className="eyebrow text-muted-foreground">Account</p>
        <h1 className="mt-4 font-display text-4xl font-normal">Sign in to view your account</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your appointment requests and profile live behind the sign-in.
        </p>
        <Link
          href="/login"
          className="eyebrow mt-8 bg-band px-8 py-4 text-band-foreground transition-colors hover:bg-ink-soft"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const bookings = bookingsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-24 lg:px-10 lg:py-32">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">Account</p>
          <h1 className="mt-4 font-display text-5xl font-normal">{user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.email} · {user.role === "admin" ? "Studio admin" : "Client"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="eyebrow border border-hairline px-6 py-3 transition-colors hover:border-gold hover:text-gold"
          >
            Sign Out
          </button>
        </div>
      </header>

      {user.role === "admin" && (
        <p className="mt-8 border border-hairline bg-surface-raised p-4 text-sm">
          Studio admin?{" "}
          <Link href="/admin/bookings" className="text-gold underline underline-offset-4">
            Review all booking requests
          </Link>
          .
        </p>
      )}

      <section aria-labelledby="my-bookings-title" className="mt-16">
        <h2 id="my-bookings-title" className="font-display text-3xl font-normal">
          My Booking Requests
        </h2>
        {bookings.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No requests yet.{" "}
            <Link href="/booking" className="text-gold underline underline-offset-4">
              Book your first session
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 border-t border-hairline">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-baseline justify-between gap-4 border-b border-hairline py-6"
              >
                <div>
                  <p className="font-display text-xl">
                    {serviceById(booking.serviceId)?.name ?? booking.serviceId}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.date} · {booking.timeSlot}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill status={booking.status} />
                  {booking.status === "received" && (
                    <button
                      type="button"
                      onClick={() => cancelBooking(booking.id)}
                      className="eyebrow text-muted-foreground transition-colors hover:text-red-700 dark:hover:text-red-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function StatusPill({ status }: { status: "received" | "confirmed" | "cancelled" }) {
  const label = { received: "Received", confirmed: "Confirmed", cancelled: "Cancelled" }[status];
  return (
    <span className="eyebrow border border-hairline px-3 py-1 text-muted-foreground">{label}</span>
  );
}
