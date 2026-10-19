import { describe, expect, it } from "vitest";
import { hasErrors, isClosedDay, isKnownTimeSlot, todayIso, validateBooking } from "./booking";
import { SERVICES, TIME_SLOTS } from "../data/studio";

/**
 * Booking validation — the pure domain seam (TDD: written red before
 * src/pages/booking.tsx consumed it). Baseline rules mirror the reference's
 * native HTML5 contract (Verified: empty submit blocked on the four required
 * fields); supersets grounded in the studio's observed hours (Tue–Sat
 * 10:00 AM – 6:00 PM) are documented in the Deviations Ledger.
 */

const KNOWN_SERVICES = SERVICES.map((service) => service.id);

const VALID = {
  name: "Ava Laurent",
  email: "ava@example.com",
  phone: "(310) 555-0100",
  serviceId: "bespoke-nail-art",
  date: "2099-06-05", // a Friday
  timeSlot: "1:00 PM",
  notes: "Soft chromes, almond shape.",
};

function pick(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

describe("todayIso", () => {
  it("returns the local ISO date (not UTC-shifted)", () => {
    const noon = new Date("2026-03-15T12:00:00");
    expect(todayIso(noon)).toBe("2026-03-15");
  });

  it("matches the shape native date inputs emit", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isClosedDay — studio closed Sunday and Monday (Verified hours)", () => {
  it.each([
    ["2099-06-07", true], // Sunday
    ["2099-06-08", true], // Monday
    ["2099-06-05", false], // Friday
    ["2099-06-06", false], // Saturday
    ["2099-06-09", false], // Tuesday
  ])("%s → closed %s", (date, closed) => {
    expect(isClosedDay(date)).toBe(closed);
  });
});

describe("isKnownTimeSlot — the reference's five fixed slots", () => {
  it("accepts every observed slot", () => {
    for (const slot of TIME_SLOTS) expect(isKnownTimeSlot(slot.label)).toBe(true);
  });

  it("rejects fabricated slots", () => {
    expect(isKnownTimeSlot("9:00 AM")).toBe(false);
    expect(isKnownTimeSlot("")).toBe(false);
  });
});

describe("validateBooking", () => {
  it("accepts the happy path with zero errors", () => {
    expect(validateBooking(VALID, { knownServices: KNOWN_SERVICES })).toEqual({});
  });

  it("mirrors the reference's native required-field messages", () => {
    const errors = validateBooking({ ...VALID, name: "", email: "", phone: "", serviceId: "" }, {
      knownServices: KNOWN_SERVICES,
    });
    expect(errors.name).toBe("Please fill out this field.");
    expect(errors.email).toBe("Please fill out this field.");
    expect(errors.phone).toBe("Please fill out this field.");
    expect(errors.serviceId).toBe("Please select a service.");
  });

  it("rejects malformed emails with an explicit message", () => {
    const errors = validateBooking({ ...VALID, email: "not-an-email" });
    expect(errors.email).toBe("Enter a valid email address.");
  });

  it("rejects phones with fewer than 7 digits", () => {
    expect(validateBooking({ ...VALID, phone: "555" }).phone).toBeDefined();
    expect(validateBooking({ ...VALID, phone: "(310) 555-0100" }).phone).toBeUndefined();
  });

  it("rejects unknown services", () => {
    const errors = validateBooking(
      { ...VALID, serviceId: "acrylic-toe-art" },
      { knownServices: KNOWN_SERVICES },
    );
    expect(errors.serviceId).toBe("Select one of the offered services.");
  });

  it("rejects past dates", () => {
    const yesterday = pick(new Date(Date.now() - 24 * 3600 * 1000));
    expect(validateBooking({ ...VALID, date: yesterday }).date).toBe("Choose a date in the future.");
  });

  it("rejects closed days with the studio-hours message", () => {
    const errors = validateBooking({ ...VALID, date: "2099-06-07" });
    expect(errors.date).toBe("The studio is closed Sundays and Mondays.");
  });

  it("rejects unknown time slots", () => {
    expect(validateBooking({ ...VALID, timeSlot: "Noon" }).timeSlot).toBe(
      "Select one of the offered times.",
    );
  });

  it("ignores notes — optional in the reference", () => {
    expect(validateBooking({ ...VALID, notes: "" })).toEqual({});
  });

  it("never trims away whitespace-only required fields", () => {
    expect(validateBooking({ ...VALID, name: "   " }).name).toBeDefined();
  });
});

describe("hasErrors", () => {
  it("is false for an empty error bag and true otherwise", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ name: "x" })).toBe(true);
  });
});
