import { useStore } from "@/lib/store";
import { serviceById } from "@/data/studio";
import { Link } from "@/lib/router";
import { StatusPill } from "@/pages/account";

// Admin booking requests (superset, demo-only). Client-side role gate — the
// zero-server SPA cannot enforce server-side authorization (registered
// limitation, PAD Security section); the surface is labeled accordingly.

export function AdminBookingsPage() {
  const { user, ready, bookings, setBookingStatus } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-6 py-28 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-28 text-center">
        <p className="eyebrow text-muted-foreground">Studio Only</p>
        <h1 className="mt-4 font-display text-4xl font-normal">Not available for this account</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Booking-request administration is restricted to the studio account in this demo.
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">Studio Admin</p>
          <h1 className="mt-4 font-display text-5xl font-normal">Booking Requests</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Demo surface — requests persist in this browser's local store only.
          </p>
        </div>
        <Link
          href="/account"
          className="eyebrow border border-hairline px-6 py-3 transition-colors hover:border-gold hover:text-gold"
        >
          My Account
        </Link>
      </header>

      {bookings.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">
          No booking requests yet — submit one from the{" "}
          <Link href="/booking" className="text-gold underline underline-offset-4">
            booking page
          </Link>
          .
        </p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline">
                {["Client", "Contact", "Service", "Date", "Time", "Status"].map((heading) => (
                  <th key={heading} scope="col" className="eyebrow py-4 pr-6 text-muted-foreground">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-hairline align-top">
                  <td className="py-4 pr-6">
                    {booking.name}
                    {booking.userId ? (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">signed in</span>
                    ) : null}
                  </td>
                  <td className="py-4 pr-6 text-muted-foreground">
                    {booking.email}
                    <br />
                    {booking.phone}
                  </td>
                  <td className="py-4 pr-6">
                    {serviceById(booking.serviceId)?.name ?? booking.serviceId}
                    {booking.notes ? (
                      <span className="block max-w-64 text-xs text-muted-foreground">
                        “{booking.notes}”
                      </span>
                    ) : null}
                  </td>
                  <td className="py-4 pr-6">{booking.date}</td>
                  <td className="py-4 pr-6">{booking.timeSlot}</td>
                  <td className="py-4 pr-6">
                    <StatusPill status={booking.status} />
                    <select
                      aria-label={`Status for ${booking.name}`}
                      value={booking.status}
                      onChange={(event) =>
                        setBookingStatus(booking.id, event.target.value as typeof booking.status)
                      }
                      className="mt-2 block border border-hairline bg-transparent px-2 py-1 text-xs"
                    >
                      <option value="received">received</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
