# Reference Investigation — Aurelia Nail Artistry

**Target origin:** `https://aurelia-nail-artistry-demo.base44.app/`
**Investigation dates:** 2026-10-19 (single session, desktop 1920×1080 + mobile 390×844)
**Method:** agent-browser headless Chromium — passive DOM/accessible-tree inspection, authorized
login, gated write-path probe (one booking record), computed-style token extraction.
**Authorization:** operator-owned demo application; operator-supplied credentials used via
session-scoped environment variables (`TARGET_APP_USERNAME` / `TARGET_APP_PASSWORD`), never
written to files, logs, or commits.

**Evidence labels:** `Verified` (directly observed), `Reasoned` (supported by evidence, not fully
exercised), `Assumed` (stated implementation decision), `Unknown` (blocker named).

---

## 1. Site map / route matrix

| Route | Access | Purpose | Main actions | States checked | Evidence | Confidence |
|---|---|---|---|---|---|---|
| `/` (canonical; `/Home` observed in nav hrefs, normalizes to `/`) | Public | Landing: hero, portfolio teaser, philosophy, experience, CTA | Navigate, scroll, CTA links | Loaded, mobile | Screenshots `aurelia-landing-light-fullpage.png`, mobile capture | Verified |
| `/Gallery` | Public | 12-work visual grid, category labels | Hover (visual only), no item links | Loaded, mobile | Live DOM: 12 headings, 14 `<img>` total on page | Verified |
| `/Services` | Public | 6 services + 3 policy cards | Navigate to /Booking | Loaded | DOM text extraction (all 6 descriptions + policies) | Verified |
| `/About` | Public | Founder story, values, studio | CTA to contact/booking | Loaded | DOM: "Aurelia Chen", values Precision/Passion/Excellence | Verified |
| `/Booking` | Public | Appointment request form + studio info cards | Full form, validate, submit | Empty-validate, success | Gated probe: submitted synthetic record; success screen captured | Verified |
| `/login` | Public | Auth: email+password, Google button, sign-up, reset | Fill, submit (success observed) | Success, sign-up view, reset view | Logged in successfully; sign-up/reset forms mapped | Verified |
| unknown routes (`/dashboard`, `/profile`, `/my-bookings`, `/appointments`, `/admin`) | Public | 404 | — | 404 page ("404", "Page Not Found") | Direct probes | Verified |
| Booking detail/admin surfaces | — | None found | — | — | Route probing + nav inventory | Unknown — no blocker expected; no admin UI exists on the demo |

Note — case sensitivity: nav hrefs observed as `/Gallery`, `/Services`, `/About`, `/Booking`,
`/Home`; lowercase probes render identically. Router is case-insensitive in practice
(`Verified` for the probed set).

## 2. Authentication

- Login form: Email (`required`), Password (`required`), "Sign in" submit, "Continue with Google"
  button, "Forgot password?", "Need an account? Sign up". `Verified`
- Sign-up view: Email, Password ("Min. 8 characters"), Re-enter password, "Create account",
  "Back to sign in". `Verified`
- Reset view: "Reset your password", email field, "Send reset link", "Back to sign in". `Verified`
- Authorized login with operator credentials succeeded → redirect to `/`. `Verified`
- **Post-auth deltas: none observable.** Nav identical, booking form not pre-filled, no account
  dashboard exists, no logout control found in nav/footer. Auth is platform-level (Base44
  account) with no user-visible feature delta. `Verified` (for the probed surface)
- Auth mechanism: not introspected beyond success (token storage key names not harvested —
  unnecessary for the clone; the clone ships its own session model per implementation plan).
  `Unknown — not inspected by design`

## 3. Page composition & content (all `Verified` unless noted)

### 3.1 Landing (`/`)
1. **Header** — brand "Aurelia" (serif wordmark) + links: Portfolio, Gallery, Services, About,
   Book. Desktop nav is inline; mobile collapses to a hamburger (`button` + icon).
2. **Hero** — full-viewport (measured section height 1080px at 1920×1080) dark photographic
   backdrop (macro hand/nail photo), eyebrow "LUXURY NAIL ARTISTRY", display heading "Aurelia"
   (Cormorant Garamond, computed 128px / weight 400), tagline "Where artistry meets elegance.
   Bespoke nail design for the modern icon.", CTA "BOOK YOUR SESSION →" (light pill on dark),
   scroll indicator at hero bottom.
3. **Selected Works / "The Portfolio"** — eyebrow "SELECTED WORKS", serif h2, "VIEW ALL →" link;
   2×2 grid of photo cards: Pearl Essence (EDITORIAL), Midnight Garden (BRIDAL), Chrome Dreams
   (AVANT-GARDE), Blush Hour (CLASSIC). All four cards href `/Gallery` (no detail pages).
4. **Philosophy band** — dark full-width band (h≈472px): eyebrow "THE PHILOSOPHY", serif quote
   "Every nail is a canvas. Every design, a statement of refined elegance." attributed
   "— AURELIA VOSS, FOUNDER & ARTIST". (Name inconsistency vs About "Aurelia Chen" — reference
   bug, see Deviations Ledger.)
5. **Bespoke Artistry** — image left / text right (h≈1067px): eyebrow "THE EXPERIENCE", h2,
   two paragraphs, "EXPLORE SERVICES →".
6. **Ready to Create?** — cream band (h≈552px): eyebrow "BEGIN YOUR JOURNEY", h2, support line
   "Book your private consultation and discover the art of bespoke nail design.", dark CTA
   "BOOK NOW →".
7. **Footer** — dark `rgb(26,26,26)`, brand + tagline "Luxury nail artistry for the discerning
   client. Each design is a bespoke creation."; NAVIGATE column (Home, Gallery, Services, About,
   Booking); CONNECT column (@aurelia.nails → Instagram, Los Angeles, CA); bottom bar
   "© 2024 Aurelia. All rights reserved." + "DEMO WEBSITE — PORTFOLIO CONCEPT".

### 3.2 Gallery (`/Gallery`)
12 works, serif name + category eyebrow each: Pearl Essence (EDITORIAL), Midnight Garden (BRIDAL),
Chrome Dreams (AVANT-GARDE), Blush Hour (CLASSIC), Winter Frost, Golden Hour, Ivory Dreams,
Obsidian, French Moderne, Autumn Ember, Velvet Night, Rose Petal. Categories cycle
EDITORIAL/BRIDAL/AVANT-GARDE/CLASSIC for the first four (pattern `Reasoned` for the rest —
labels repeat in DOM extraction order). Items are NOT links (no detail pages). Title:
"Gallery | Aurelia Nail Artistry".

### 3.3 Services (`/Services`)
Six services (name + description; **durations rendered, no prices**):

| Service | Duration (DOM) |
|---|---|
| Signature Manicure | 60 min |
| Luxury Gel Extension | 90 min |
| Bespoke Nail Art | 120 min |
| Bridal Collection | 180 min |
| Chrome & Specialty | 75 min |
| Maintenance & Refill | 60 min |

Descriptions captured verbatim in the extraction transcript (section 3.3 of the probe log).
Three policy cards: **Booking Policy** ("A 50% deposit is required to secure your appointment.
Deposits are non-refundable within 48 hours of service."), **Cancellations** ("Please provide 48
hours notice…"), **Arrival** ("arrive 5-10 minutes early…"). Plus "Ready to Book?" CTA section.

### 3.4 About (`/About`)
h1 "Aurelia Chen"; manifesto "We don't just create nails. We craft wearable art."; Our Values:
Precision, Passion, Excellence; "The Studio" block; "Let's Create Together" CTA. 5 images.

### 3.5 Booking (`/Booking`)
- Info cards: **Location** "8423 Melrose Place, Los Angeles, CA 90069"; **Hours** "Tuesday –
  Saturday, 10:00 AM – 6:00 PM"; **Contact** "hello@aurelia-nails.com", "(310) 555-0123".
- Intro: "Complete the form below to request your appointment. We'll confirm your booking within
  24 hours."
- Fields: Full Name* (text), Email Address* (email), Phone Number* (tel), Service* (select, 6
  options = service names), Date (native `input[type=date]` with "Show date picker" affordance),
  Time (select: 10:00 AM, 11:30 AM, 1:00 PM, 2:30 PM, 4:00 PM), Additional Notes (textarea,
  placeholder "Tell us about your vision, inspiration, or any special requests...").
- Validation: native HTML5 — empty submit blocked on the 4 required fields ("Please fill out
  this field." ×4). `Verified`
- **Gated write-path probe** (Boundary 4: operator's own demo app, one throwaway record):
  submitted {name "PROBE Test User", email "probe-delete-me@example.com", phone "(310)
  555-9999", service "Luxury Gel Extension", date 2026-11-20, time "1:00 PM"}. Result: form is
  **replaced** by a confirmation screen — heading "Request Received", body "Thank you for your
  inquiry. We'll review your request and get back to you within 24 hours to confirm your
  appointment." + "WE LOOK FORWARD TO SEEING YOU". Document title flips to "Booking | Aurelia
  Nail Artistry". Screenshot: `aurelia-booking-success.png`. `Verified`
- **Probe residue disclosure:** the demo's confirmation screen exposes no record id and no
  self-service delete surface was found; no admin UI exists. One synthetic request therefore
  may persist in the demo backend. Cleanup attempted: none possible via UI (no surface).
  Operator can purge it in the Base44 console by the submitted email
  `probe-delete-me@example.com`. Flagged in the final report per the no-residue rule.

### 3.6 Auth pages
Covered in §2. Login page heading "Welcome to Aurelia Nail Artistry" + "Sign in to continue";
"or" divider between Google button and email form. `Verified`

## 4. Visual system (measured via getComputedStyle)

| Token | Measured value | Source |
|---|---|---|
| Body background | `rgb(245,243,239)` (#F5F3EF warm cream) | computed on `<body>` |
| Dark band / footer / dark CTA | `rgb(26,26,26)` (#1A1A1A) | footer + BOOK NOW button |
| Footer body text | `rgba(255,255,255,0.8)` | computed |
| Display font | `"Cormorant Garamond", serif` — h1 128px, weight 400 | computed on hero h1 |
| Body font | `Inter, sans-serif` | computed on body |
| Nav brand | Cormorant Garamond 24px, letter-spacing 0.6px | computed |
| Quote | Cormorant Garamond, white, normal style | philosophy band |
| Fonts loaded | Cormorant Garamond + Inter (Google Fonts `@import`) | `document.fonts` + snapshot |
| Buttons | Minimal, uppercase, letterspaced, arrow suffix "→"; light-on-dark (hero) and dark-on-cream (Ready to Create) variants | visual + computed |
| Section heights (desktop 1920) | hero 1080, portfolio 2320, philosophy 472, experience 1067, CTA 552 | offsetHeight |

Eyebrows: uppercase, letterspaced, small (visual classification `Reasoned` — exact px not
extracted). Imagery: macro editorial photography, warm neutral palette, hands/nails.
Platform chrome: floating "Edit with Base44" badge — **not part of the design**, excluded from
parity scope.

## 5. Interaction inventory (replayable)

1. Nav link → route navigation, active state visual. `Verified`
2. "Portfolio" nav item → navigates home (href `/Home`); scroll-to-section behavior on landing
   `Reasoned` (click on /about did not scroll — anchor behavior observed only via href).
3. Portfolio card → `/Gallery`. `Verified`
4. Mobile hamburger (390×844) → **full-screen cream overlay**: brand top-left, ✕ top-right,
   large serif links Portfolio/Gallery/Services/About/Book stacked vertically; link click
   navigates and dismisses overlay (Gallery click → `/Gallery`, h1 "Gallery"). Screenshot:
   `aurelia-mobile-menu-open.png`. `Verified`
5. Booking form: native validation on empty submit; valid submit → confirmation screen
   (replaces form, no redirect). `Verified`
6. Auth: sign in success → `/`; sign-up/reset view toggles. `Verified`
7. Dark mode: **absent** — no toggle in DOM, no `data-theme`/`dark` class, background stays
   `rgb(245,243,239)` under `prefers-color-scheme: dark` emulation. `Verified`
8. Footer links → same routes. `Verified`

## 6. Data model (observed)

- **Service**: name, description, durationMinutes. No price exposed. `Verified`
- **BookingRequest**: fullName, email, phone, service (name ref), date (ISO), time (slot label),
  notes (optional). Server-side storage assumed (Base44 entities) — not introspected
  (`Unknown — network bodies not harvested by design`). Success UX is the observable contract.
- **GalleryItem**: name, category, image. `Verified`
- **TimeSlots**: fixed 5-slot list. `Verified`
- Studio info constants (location/hours/contact). `Verified`

## 7. Stack fingerprint (bundle/DOM evidence)

- Base44 no-code platform SPA; Google Fonts via `@import`; React-family runtime markers in the
  accessible tree; per-route `document.title` map ("Gallery | Aurelia Nail Artistry" pattern).
  `Verified` (DOM-level) / `Reasoned` (React specifics — not bundle-dumped)
- No visible chart libraries, no state library markers observable at UI level. `Unknown — no
  bundle analysis performed (not needed for parity scope)`

## 8. Screenshot evidence index

| File | Viewport | State |
|---|---|---|
| `aurelia-landing-light-fullpage.png` | 1920×1080, full page (1920×5992) | light, logged-out |
| `aurelia-landing-mobile-fullpage.png` | 390×844, full page (390×5758) | light, logged-out |
| `aurelia-mobile-menu-open.png` | 390×844 | mobile menu overlay open |
| `aurelia-booking-success.png` | 1920×1080 | post-submit confirmation |

Stored at repo-external workspace `download/reference/` during investigation; the four are also
committed under `docs/screenshots/reference/` for posterity.

## 9. Unknowns & blockers

1. Server-side booking persistence shape — not introspected (network bodies not harvested).
   Clone contract = observable UX + validated form schema. `Unknown — by design`
2. Google OAuth runtime behavior — button present; flow not exercised (would require external
   account interaction). Clone ships the button as a visible-but-stubbed provider with an
   explanatory disabled state? — **No**: dead controls are forbidden; the clone implements
   email/password auth and documents the Google button divergence in the Deviations Ledger
   (see implementation-plan §Deviations).
3. Hover-only micro-states — headless agent-browser cannot fire `:hover` reliably (v4 hover
   media-gating trap); hover states are implemented per design idiom and verified in Playwright
   (which can force hover). `Reasoned`
4. Exact copy of two hero paragraphs in "Bespoke Artistry" — extracted partially (truncated in
   one pass); treated as brand-voice-equivalent copy in the clone (registered deviation).
   `Reasoned`
