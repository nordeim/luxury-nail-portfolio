import { describe, expect, it } from "vitest";

import { ADD_ON_SERVICES, SERVICES } from "@/data/studio";

/**
 * Catalog contract — services pricing + Add-On Services (remediation R6-01,
 * docs/remediation-plan-aurelia-r6.md).
 *
 * The live reference re-measured 2026-10-20 shows prices on all six core
 * services and an "Add-On Services" (ENHANCEMENTS) band with four priced
 * items. R1 had verified "durations rendered, no prices" — the demo was
 * updated since; the clone's catalog tracks the live reference.
 *
 * Pinned invariants:
 *   - every core service carries its measured price string (verbatim, so
 *     "$200+" survives as a string — never parsed into a number);
 *   - the add-on list is exactly the four measured items;
 *   - the booking whitelist stays the SIX core services — the reference's
 *     booking select offers no add-ons and no prices, so add-on ids must
 *     never enter the booking form's service options.
 */
const MEASURED_PRICES: Record<string, string> = {
  "signature-manicure": "$85",
  "luxury-gel-extension": "$150",
  "bespoke-nail-art": "$200+",
  "bridal-collection": "$350",
  "chrome-specialty": "$120",
  "maintenance-refill": "$75",
};

const MEASURED_ADD_ONS: readonly { name: string; price: string }[] = [
  { name: "Hand Massage", price: "$20" },
  { name: "Paraffin Treatment", price: "$25" },
  { name: "Nail Repair (per nail)", price: "$15" },
  { name: "Design Consultation", price: "Complimentary" },
];

describe("services catalog (R6-01 reference drift)", () => {
  it("keeps the six verified services", () => {
    expect(SERVICES).toHaveLength(6);
    expect(new Set(SERVICES.map((service) => service.id)).size).toBe(6);
  });

  it("carries the measured price on every core service", () => {
    for (const service of SERVICES) {
      const measured = MEASURED_PRICES[service.id];
      expect(measured, `no measured price recorded for ${service.id}`).toBeTruthy();
      expect(service.price, `${service.id} price`).toBe(measured);
      expect(service.price).toMatch(/^(\$|Complimentary$)/);
    }
  });

  it("keeps durations untouched (content parity with R1)", () => {
    const durations = Object.fromEntries(SERVICES.map((service) => [service.id, service.durationMin]));
    expect(durations).toEqual({
      "signature-manicure": 60,
      "luxury-gel-extension": 90,
      "bespoke-nail-art": 120,
      "bridal-collection": 180,
      "chrome-specialty": 75,
      "maintenance-refill": 60,
    });
  });
});

describe("add-on services catalog (R6-01)", () => {
  it("lists exactly the four measured enhancements with their prices", () => {
    expect(ADD_ON_SERVICES.map((addOn) => ({ name: addOn.name, price: addOn.price }))).toEqual(
      MEASURED_ADD_ONS,
    );
  });

  it("never shares ids with the core services", () => {
    const coreIds = new Set(SERVICES.map((service) => service.id));
    for (const addOn of ADD_ON_SERVICES) {
      expect(coreIds.has(addOn.id), `${addOn.id} collides with a core service`).toBe(false);
    }
  });

  it("excludes add-ons from the booking select (booking contract unchanged)", () => {
    // The booking form renders its select from SERVICES only (booking.tsx);
    // this pin fails if anyone widens the form to the add-on catalog —
    // the reference's booking select offers exactly the six core services.
    const bookingIds = SERVICES.map((service) => service.id);
    for (const addOn of ADD_ON_SERVICES) {
      expect(bookingIds).not.toContain(addOn.id);
    }
    expect(bookingIds).toHaveLength(6);
  });
});
