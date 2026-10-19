// Aurelia Nail Artistry — studio data (seed layer).
// Service names, durations, descriptions, time slots, and studio contact
// details are captured verbatim from the reference investigation
// (docs/reference-investigation.md §3.3/§3.5, Verified evidence).
// Imagery is independently generated for this project — no reference assets.

import type { GalleryWork, Service, StudioInfo, TimeSlot, User } from "@/types";

export const STUDIO: StudioInfo = {
  name: "Aurelia",
  fullName: "Aurelia Nail Artistry",
  tagline: "Luxury nail artistry for the discerning client. Each design is a bespoke creation.",
  addressLines: ["8423 Melrose Place", "Los Angeles, CA 90069"],
  hoursLine1: "Tuesday – Saturday",
  hoursLine2: "10:00 AM – 6:00 PM",
  email: "hello@aurelia-nails.com",
  phone: "(310) 555-0123",
  instagram: "@aurelia.nails",
};

export const HERO = {
  eyebrow: "Luxury Nail Artistry",
  title: "Aurelia",
  tagline: "Where artistry meets elegance. Bespoke nail design for the modern icon.",
  cta: "Book Your Session",
  image: "/images/hero.jpg",
} as const;

export const PHILOSOPHY = {
  eyebrow: "The Philosophy",
  quote: "Every nail is a canvas. Every design, a statement of refined elegance.",
  attribution: "Aurelia Chen — Founder & Artist",
} as const;

export const EXPERIENCE = {
  eyebrow: "The Experience",
  title: "Bespoke Artistry",
  paragraphs: [
    "Each session at Aurelia is a curated experience. From the initial consultation to the final reveal, every detail is thoughtfully curated to bring your vision to life.",
    "Our signature services blend foundational techniques with contemporary artistry, creating a masterpiece that is as unique as you are.",
  ],
  cta: "Explore Services",
  image: "/images/experience.jpg",
} as const;

export const JOURNEY = {
  eyebrow: "Begin Your Journey",
  title: "Ready to Create?",
  support: "Book your private consultation and discover the art of bespoke nail design.",
  cta: "Book Now",
} as const;

export const SERVICES: Service[] = [
  {
    id: "signature-manicure",
    name: "Signature Manicure",
    description:
      "Our foundational experience featuring meticulous nail shaping, cuticle care, and a flawless polish application.",
    durationMin: 60,
    category: "signature",
  },
  {
    id: "luxury-gel-extension",
    name: "Luxury Gel Extension",
    description:
      "Expertly sculpted extensions using premium gel systems, customized to your desired length and shape.",
    durationMin: 90,
    category: "extensions",
  },
  {
    id: "bespoke-nail-art",
    name: "Bespoke Nail Art",
    description:
      "Intricate hand-painted designs, 3D embellishments, and custom artwork tailored to your vision.",
    durationMin: 120,
    category: "bespoke",
  },
  {
    id: "bridal-collection",
    name: "Bridal Collection",
    description:
      "A comprehensive bridal package including consultation, trial design, and wedding-day service.",
    durationMin: 180,
    category: "bridal",
  },
  {
    id: "chrome-specialty",
    name: "Chrome & Specialty",
    description: "Statement-making chrome, holographic, and specialty finish applications.",
    durationMin: 75,
    category: "specialty",
  },
  {
    id: "maintenance-refill",
    name: "Maintenance & Refill",
    description: "Keep your extensions looking pristine with our professional maintenance service.",
    durationMin: 60,
    category: "maintenance",
  },
];

export const BOOKING_POLICIES = [
  {
    title: "Booking Policy",
    body: "A 50% deposit is required to secure your appointment. Deposits are non-refundable within 48 hours of service.",
  },
  {
    title: "Cancellations",
    body: "Please provide 48 hours notice for cancellations or rescheduling to avoid forfeiting your deposit.",
  },
  {
    title: "Arrival",
    body: "Please arrive 5-10 minutes early to ensure your full service time. Late arrivals may result in shortened services.",
  },
] as const;

export const BOOKING_INTRO =
  "Complete the form below to request your appointment. We'll confirm your booking within 24 hours.";

export const TIME_SLOTS: TimeSlot[] = [
  { label: "10:00 AM", minutes: 600 },
  { label: "11:30 AM", minutes: 690 },
  { label: "1:00 PM", minutes: 780 },
  { label: "2:30 PM", minutes: 870 },
  { label: "4:00 PM", minutes: 960 },
];

export const GALLERY_WORKS: GalleryWork[] = [
  { id: "pearl-essence", name: "Pearl Essence", category: "editorial", image: "/images/pearl-essence.jpg", featuredOrder: 1 },
  { id: "midnight-garden", name: "Midnight Garden", category: "bridal", image: "/images/midnight-garden.jpg", featuredOrder: 2 },
  { id: "chrome-dreams", name: "Chrome Dreams", category: "avant-garde", image: "/images/chrome-dreams.jpg", featuredOrder: 3 },
  { id: "blush-hour", name: "Blush Hour", category: "classic", image: "/images/blush-hour.jpg", featuredOrder: 4 },
  { id: "winter-frost", name: "Winter Frost", category: "editorial", image: "/images/winter-frost.jpg", featuredOrder: null },
  { id: "golden-hour", name: "Golden Hour", category: "bridal", image: "/images/golden-hour.jpg", featuredOrder: null },
  { id: "ivory-dreams", name: "Ivory Dreams", category: "avant-garde", image: "/images/ivory-dreams.jpg", featuredOrder: null },
  { id: "obsidian", name: "Obsidian", category: "classic", image: "/images/obsidian.jpg", featuredOrder: null },
  { id: "french-moderne", name: "French Moderne", category: "editorial", image: "/images/french-moderne.jpg", featuredOrder: null },
  { id: "autumn-ember", name: "Autumn Ember", category: "bridal", image: "/images/autumn-ember.jpg", featuredOrder: null },
  { id: "velvet-night", name: "Velvet Night", category: "avant-garde", image: "/images/velvet-night.jpg", featuredOrder: null },
  { id: "rose-petal", name: "Rose Petal", category: "classic", image: "/images/rose-petal.jpg", featuredOrder: null },
];

export const CATEGORY_LABELS: Record<GalleryWork["category"], string> = {
  editorial: "Editorial",
  bridal: "Bridal",
  "avant-garde": "Avant-Garde",
  classic: "Classic",
};

export const STUDIO_IMAGE = "/images/studio.jpg";

export const ABOUT = {
  founder: "Aurelia Chen",
  role: "Founder & Artist",
  manifesto: "We don't just create nails. We craft wearable art.",
  values: [
    {
      title: "Precision",
      body: "Every line, every edge, every surface is executed with exacting care. Precision is the discipline beneath the artistry.",
    },
    {
      title: "Passion",
      body: "This is not a service industry to us — it is a craft. Each set is an opportunity to create something worth wearing.",
    },
    {
      title: "Excellence",
      body: "From premium systems to a calm, considered studio, every detail of the experience is held to the highest standard.",
    },
  ],
  studioBody:
    "Tucked away on Melrose Place, the Aurelia studio was designed as a calm counterpoint to the city — a private atelier where consultations unfold unhurried and every appointment is a one-at-a-time engagement.",
} as const;

/** Primary nav — labels render uppercase via tracking utilities (reference idiom). */
export const NAV_LINKS = [
  { label: "Portfolio", href: "/#portfolio" },
  { label: "Gallery", href: "/gallery" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Book", href: "/booking" },
] as const;

export const FOOTER_NAV = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Booking", href: "/booking" },
] as const;

// Development-only seed accounts (documented in README — never real secrets;
// digests protect only local demo data). Password digests, never plaintext.
//   demo@aurelia.studio / Aurelia-Demo-2025   (admin)
//   guest@aurelia.studio / Aurelia-Guest-2025 (customer)
export const DEMO_USERS: User[] = [
  {
    id: "u-demo-admin",
    email: "demo@aurelia.studio",
    name: "Studio Admin",
    role: "admin",
    // s1$ digest of "Aurelia-Demo-2025" (salt 8f21c4a09b7de6325fa1d4c8e9b03a77)
    // Verified by tests/password.test.ts — seeds must hash-verify, not just exist.
    passwordHash:
      "s1$8f21c4a09b7de6325fa1d4c8e9b03a77$a9d99f8daa15d41c714e9cd40e536b83c383f248284762bdda5b0c12d90cf5cf",
  },
  {
    id: "u-demo-guest",
    email: "guest@aurelia.studio",
    name: "Demo Guest",
    role: "customer",
    // s1$ digest of "Aurelia-Guest-2025" (salt 3d9e27b1c8a54f6092d7e4b6a1c05f83)
    // Verified by tests/password.test.ts — seeds must hash-verify, not just exist.
    passwordHash:
      "s1$3d9e27b1c8a54f6092d7e4b6a1c05f83$eb391a855c11fff331ebadfd163c9a6b3e93f6c6330ad8c5e7c53636197c8300",
  },
];

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function featuredWorks(): GalleryWork[] {
  return GALLERY_WORKS.filter((work) => work.featuredOrder !== null).sort(
    (a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0),
  );
}
