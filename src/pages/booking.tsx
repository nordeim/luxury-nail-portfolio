import { useState, type FormEvent } from "react";
import { CtaLink } from "@/components/chrome";
import {
  BOOKING_INTRO,
  SERVICES,
  STUDIO,
  TIME_SLOTS,
  serviceById,
} from "@/data/studio";
import { hasErrors, todayIso, validateBooking, type BookingField } from "@/lib/booking";
import { useStore } from "@/lib/store";

// Booking — public appointment-request form (docs/reference-investigation.md
// §3.5). Reference contract, Verified: info cards (Location / Hours /
// Contact), required name/email/phone + service select + date + time +
// optional notes; native HTML5 validation baseline; on submit the form is
// REPLACED by the "Request Received" confirmation.
// Supersets (Deviations Ledger): date ≥ today, closed Sun/Mon, slot whitelist,
// bookings persist to the local store and attach to the signed-in user.

type FieldErrors = Partial<Record<BookingField, string>>;

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  serviceId: "",
  date: "",
  timeSlot: "",
  notes: "",
};

export function BookingPage() {
  const { createBooking, toast } = useStore();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<{ service: string; date: string; time: string } | null>(
    null,
  );

  const set = (field: BookingField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateBooking(form, {
      today: todayIso(),
      knownServices: SERVICES.map((service) => service.id),
    });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }
    const result = createBooking(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSubmitted({
      service: serviceById(result.booking.serviceId)?.name ?? result.booking.serviceId,
      date: result.booking.date,
      time: result.booking.timeSlot,
    });
    setForm(INITIAL_FORM);
    toast("Appointment request sent.");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <header className="max-w-2xl">
        <p className="eyebrow text-muted-foreground">Begin Your Journey</p>
        <h1 className="mt-4 font-display text-6xl font-normal lg:text-7xl">
          Book Your Session
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{BOOKING_INTRO}</p>
      </header>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <aside aria-label="Studio information" className="flex flex-col gap-8">
          <InfoCard title="Location">
            {STUDIO.addressLines[0]}
            <br />
            {STUDIO.addressLines[1]}
          </InfoCard>
          <InfoCard title="Hours">
            {STUDIO.hoursLine1}
            <br />
            {STUDIO.hoursLine2}
          </InfoCard>
          <InfoCard title="Contact">
            <a className="transition-colors hover:text-gold" href={`mailto:${STUDIO.email}`}>
              {STUDIO.email}
            </a>
            <br />
            <a className="transition-colors hover:text-gold" href={`tel:${STUDIO.phone.replace(/[^+\d]/g, "")}`}>
              {STUDIO.phone}
            </a>
          </InfoCard>
        </aside>

        {submitted ? (
          <section
            aria-labelledby="request-received-title"
            className="animate-fade-up flex flex-col items-center justify-center border border-hairline bg-surface-raised px-8 py-20 text-center"
            data-booking-confirmation="visible"
          >
            <p className="eyebrow text-muted-foreground">Thank You</p>
            <h2 id="request-received-title" className="mt-4 font-display text-5xl font-normal">
              Request Received
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Thank you for your inquiry. We'll review your request and get back to you within 24
              hours to confirm your appointment.
            </p>
            <p className="eyebrow mt-8 text-muted-foreground">
              {submitted.service} · {submitted.date} · {submitted.time}
            </p>
            <p className="eyebrow mt-12 text-muted-foreground">We look forward to seeing you</p>
          </section>
        ) : (
          <form onSubmit={onSubmit} noValidate={false} className="flex flex-col gap-10" data-booking-form>
            <fieldset className="flex flex-col gap-8">
              <legend className="font-display text-2xl">Your Details</legend>
              <Field
                label="Full Name"
                name="name"
                required
                value={form.name}
                error={errors.name}
                onChange={(value) => set("name", value)}
                autoComplete="name"
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={(value) => set("email", value)}
                autoComplete="email"
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                required
                value={form.phone}
                error={errors.phone}
                onChange={(value) => set("phone", value)}
                autoComplete="tel"
              />
            </fieldset>

            <fieldset className="flex flex-col gap-8">
              <legend className="font-display text-2xl">Appointment Details</legend>
              <label className="flex flex-col gap-2">
                <span className="eyebrow text-muted-foreground">Service</span>
                <select
                  name="serviceId"
                  required
                  value={form.serviceId}
                  onChange={(event) => set("serviceId", event.target.value)}
                  aria-invalid={Boolean(errors.serviceId)}
                  className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
                >
                  <option value="">Select a Service</option>
                  {SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {service.durationMin} min
                    </option>
                  ))}
                </select>
                <FieldError message={errors.serviceId} />
              </label>
              <div className="grid gap-8 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-muted-foreground">Date</span>
                  <input
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(event) => set("date", event.target.value)}
                    aria-invalid={Boolean(errors.date)}
                    className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
                  />
                  <FieldError message={errors.date} />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="eyebrow text-muted-foreground">Time</span>
                  <select
                    name="timeSlot"
                    required
                    value={form.timeSlot}
                    onChange={(event) => set("timeSlot", event.target.value)}
                    aria-invalid={Boolean(errors.timeSlot)}
                    className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
                  >
                    <option value="">Time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.label} value={slot.label}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.timeSlot} />
                </label>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-8">
              {/* The legend is the textarea's accessible name — a legend alone
                  does not label controls, so bind it explicitly (a11y: every
                  field needs a name; e2e pins getByLabel('Additional Notes')). */}
              <legend id="booking-notes-legend" className="font-display text-2xl">
                Additional Notes
              </legend>
              <label className="flex flex-col gap-2">
                <textarea
                  name="notes"
                  rows={4}
                  aria-labelledby="booking-notes-legend"
                  value={form.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  placeholder="Tell us about your vision, inspiration, or any special requests..."
                  className="resize-y border-b border-hairline bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-gold"
                />
              </label>
            </fieldset>

            <button
              type="submit"
              className="eyebrow group inline-flex items-center justify-center gap-3 bg-band px-8 py-4 text-band-foreground transition-colors hover:bg-ink-soft hover:text-background"
            >
              Request Appointment
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </form>
        )}
      </div>

      {!submitted && (
        <div className="mt-20">
          <CtaLink href="/services" tone="outline">
            Review Services First
          </CtaLink>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-hairline bg-surface-raised p-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-xs text-red-700 dark:text-red-400">
      {message}
    </span>
  );
}
