import { describe, expect, it } from "vitest";

import { ABOUT, CATEGORY_LABELS, EXPERIENCE, GALLERY_WORKS, HERO, PHILOSOPHY } from "@/data/studio";

/**
 * Content-parity contract — review round R7 (docs/remediation-plan-aurelia-r7.md).
 *
 * The live reference re-extracted 2026-10-20 diverged from the clone in copy
 * and in the gallery's category model:
 *   - hero tagline (R7-01 — reference drift away from the R1-Verified line);
 *   - gallery categories form a FIVE-cycle including Seasonal (R7-03 — the
 *     R1 "Reasoned" 4-cycle inference was wrong);
 *   - home experience paragraphs (R7-05), philosophy attribution format
 *     (R7-06 — em-dash prefix + comma, the reference also unified to Chen),
 *     gallery intro (R7-07);
 *   - the About page content pack (R7-04 — bio, quote, stats, philosophy
 *     paragraph, values bodies, studio paragraph, featured-in, CTA).
 *
 * Every expected string below is verbatim from the 2026-10-20 live extraction
 * recorded in the R7 plan §5.
 */

const MEASURED_TAGLINE =
  "Where artistry meets elegance. Bespoke nail designs for the extraordinary.";

const MEASURED_CATEGORIES: Record<string, string> = {
  "pearl-essence": "editorial",
  "midnight-garden": "bridal",
  "chrome-dreams": "avant-garde",
  "blush-hour": "classic",
  "winter-frost": "seasonal",
  "golden-hour": "editorial",
  "ivory-dreams": "bridal",
  obsidian: "avant-garde",
  "french-moderne": "classic",
  "autumn-ember": "seasonal",
  "velvet-night": "editorial",
  "rose-petal": "bridal",
};

const MEASURED_EXPERIENCE = [
  "Each session at Aurelia is a curated experience. From the initial consultation to the final design, every detail is thoughtfully considered to bring your vision to life.",
  "Our signature services blend traditional techniques with contemporary artistry, creating designs that are as unique as you are.",
];

const MEASURED_ABOUT = {
  eyebrow: "The Artist",
  bio: [
    "With over a decade of experience in luxury nail artistry, Aurelia has cultivated a distinctive style that blends traditional elegance with contemporary edge.",
    "Trained in both Paris and Tokyo, her work has graced the pages of Vogue, Elle, and Harper's Bazaar. She has been the go-to nail artist for Fashion Week runways and celebrity red carpet moments.",
  ],
  quote:
    "I believe nails are the ultimate accessory. They're personal, intimate, and infinitely expressive. My goal is to create designs that feel like an extension of your identity.",
  stats: [
    { value: "12+", label: "Years Experience" },
    { value: "5K+", label: "Happy Clients" },
    { value: "50+", label: "Editorial Features" },
  ],
  philosophyParagraph:
    "Every appointment at Aurelia begins with understanding—your style, your story, your vision. We believe that the best designs emerge from genuine connection and creative collaboration.",
  values: [
    { title: "Precision", body: "Every stroke, every detail is executed with unwavering precision and care." },
    { title: "Passion", body: "Our love for nail artistry drives us to continuously evolve and innovate." },
    { title: "Excellence", body: "We hold ourselves to the highest standards in every service we provide." },
  ],
  studioBody:
    "Located in the heart of Los Angeles, our intimate studio space was designed to feel like a sanctuary. From the moment you step in, you're enveloped in calm, sophistication, and creative energy.",
  featuredIn: ["VOGUE", "ELLE", "HARPER'S BAZAAR", "ALLURE", "GLAMOUR"],
  cta: "Book a Consultation",
  ctaSupport: "Ready to bring your nail vision to life? I'd love to hear from you.",
};

describe("content parity — R7 reference re-extraction", () => {
  it("carries the measured hero tagline (R7-01)", () => {
    expect(HERO.tagline).toBe(MEASURED_TAGLINE);
  });

  it("assigns every gallery work its measured category from the five-cycle (R7-03)", () => {
    expect(GALLERY_WORKS).toHaveLength(12);
    for (const work of GALLERY_WORKS) {
      const measured = MEASURED_CATEGORIES[work.id];
      expect(measured, `no measured category recorded for ${work.id}`).toBeTruthy();
      expect(work.category, `${work.id} category`).toBe(measured);
    }
  });

  it("exposes exactly the five measured category labels including Seasonal (R7-03)", () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([
      "avant-garde",
      "bridal",
      "classic",
      "editorial",
      "seasonal",
    ]);
    expect(CATEGORY_LABELS.seasonal).toBe("Seasonal");
  });

  it("carries the measured experience paragraphs (R7-05)", () => {
    expect(EXPERIENCE.paragraphs).toEqual(MEASURED_EXPERIENCE);
  });

  it("formats the philosophy attribution with the reference em-dash prefix (R7-06)", () => {
    expect(PHILOSOPHY.attribution).toBe("— Aurelia Chen, Founder & Artist");
  });

  it("carries the measured About content pack (R7-04)", () => {
    expect(ABOUT.eyebrow).toBe(MEASURED_ABOUT.eyebrow);
    expect(ABOUT.bio).toEqual(MEASURED_ABOUT.bio);
    expect(ABOUT.quote).toBe(MEASURED_ABOUT.quote);
    expect(ABOUT.stats).toEqual(MEASURED_ABOUT.stats);
    expect(ABOUT.philosophyParagraph).toBe(MEASURED_ABOUT.philosophyParagraph);
    expect(ABOUT.values).toEqual(MEASURED_ABOUT.values);
    expect(ABOUT.studioBody).toBe(MEASURED_ABOUT.studioBody);
    expect(ABOUT.featuredIn).toEqual(MEASURED_ABOUT.featuredIn);
    expect(ABOUT.cta).toBe(MEASURED_ABOUT.cta);
    expect(ABOUT.ctaSupport).toBe(MEASURED_ABOUT.ctaSupport);
  });
});
