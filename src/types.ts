// Aurelia Nail Artistry — domain types.
// Zero-server SPA: booking requests and users persist in localStorage
// (ADR-001); DATABASE_URL remains the tooling contract (db-path.ts).

export type ServiceCategoryId =
  | "signature"
  | "extensions"
  | "bespoke"
  | "bridal"
  | "specialty"
  | "maintenance";

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  category: ServiceCategoryId;
  /** Display price verbatim from the reference (e.g. "$85", "$200+") —
   *  never parsed into a number, so suffixes survive. Measured 2026-10-20
   *  (remediation R6-01); R1 had verified a price-free catalog. */
  price: string;
}

/** ENHANCEMENTS band item (reference "Add-On Services", measured R6-01).
 *  Booking deliberately excludes these — the reference's booking select
 *  offers exactly the six core services (unit-pinned in catalog.test.ts). */
export interface AddOnService {
  id: string;
  name: string;
  price: string;
}

/** Gallery categories — the reference's measured five-cycle (R7-03):
 *  Editorial, Bridal, Avant-Garde, Classic, Seasonal repeating across the
 *  12 works. R1's four-cycle inference missed Seasonal. */
export type WorkCategory = "editorial" | "bridal" | "avant-garde" | "classic" | "seasonal";

export interface GalleryWork {
  id: string;
  name: string;
  category: WorkCategory;
  image: string;
  /** Portfolio teaser order on the landing page; null = landing-only exclusion. */
  featuredOrder: number | null;
}

export interface TimeSlot {
  /** Display label exactly as offered by the studio, e.g. "10:00 AM". */
  label: string;
  /** 24h minutes-since-midnight, used for sorting and coherence checks. */
  minutes: number;
}

export interface StudioInfo {
  name: string;
  fullName: string;
  tagline: string;
  addressLines: [string, string];
  hoursLine1: string;
  hoursLine2: string;
  email: string;
  phone: string;
  instagram: string;
}

export type BookingStatus = "received" | "confirmed" | "cancelled";

export interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  timeSlot: string;
  notes: string;
  /** Set when the requester was signed in; links the request to /account. */
  userId: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  passwordHash: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface ToastMessage {
  id: string;
  text: string;
}
