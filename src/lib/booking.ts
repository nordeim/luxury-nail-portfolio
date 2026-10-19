// Booking request validation — the pure domain seam (unit-pinned by
// src/lib/booking.test.ts). Rules beyond the reference's native-HTML5
// baseline are supersets grounded in the studio's observed hours
// (Tuesday–Saturday, 10:00 AM – 6:00 PM — docs/reference-investigation.md §3.5).

import { TIME_SLOTS } from "@/data/studio";

export interface BookingInput {
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  notes: string;
}

export type BookingField = keyof BookingInput;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS = /\d/g;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Studio is closed Sunday (0) and Monday (1) — observed hours Tue–Sat. */
export function isClosedDay(dateIso: string): boolean {
  const day = new Date(`${dateIso}T12:00:00`).getDay();
  return day === 0 || day === 1;
}

/** Today as an ISO date string in LOCAL time (native date inputs are local). */
export function todayIso(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isKnownTimeSlot(label: string): boolean {
  return TIME_SLOTS.some((slot) => slot.label === label);
}

export function validateBooking(
  input: BookingInput,
  options: { today?: string; knownServices?: readonly string[] } = {},
): Partial<Record<BookingField, string>> {
  const errors: Partial<Record<BookingField, string>> = {};
  const today = options.today ?? todayIso();

  if (!input.name.trim()) errors.name = "Please fill out this field.";
  if (!input.email.trim()) errors.email = "Please fill out this field.";
  else if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (!input.phone.trim()) errors.phone = "Please fill out this field.";
  else if ((input.phone.match(PHONE_DIGITS) ?? []).length < 7)
    errors.phone = "Enter a valid phone number.";

  if (!input.serviceId) errors.serviceId = "Please select a service.";
  else if (options.knownServices && !options.knownServices.includes(input.serviceId))
    errors.serviceId = "Select one of the offered services.";

  if (!input.date) errors.date = "Please choose a date.";
  else if (!DATE_PATTERN.test(input.date) || Number.isNaN(new Date(`${input.date}T12:00:00`).getTime()))
    errors.date = "Enter a valid date.";
  else if (input.date < today) errors.date = "Choose a date in the future.";
  else if (isClosedDay(input.date)) errors.date = "The studio is closed Sundays and Mondays.";

  if (!input.timeSlot) errors.timeSlot = "Please choose a time.";
  else if (!isKnownTimeSlot(input.timeSlot)) errors.timeSlot = "Select one of the offered times.";

  return errors;
}

export function hasErrors(errors: Partial<Record<BookingField, string>>): boolean {
  return Object.keys(errors).length > 0;
}
