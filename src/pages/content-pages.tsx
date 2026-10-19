import { useState, type FormEvent } from "react";
import { Award, Globe, Heart, Mail, MapPin, Phone, Send, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { BRAND } from "@/data/catalog";
import { cn } from "@/utils/cn";

export function PageHeading({
  title,
  subtitle,
  spacing = "space-y-3",
  narrow = false,
}: {
  title: string;
  subtitle?: string;
  /** F40-02: about measures space-y-4, contact space-y-3 (16/12px). */
  spacing?: "space-y-3" | "space-y-4";
  /** F40-04: the about subtitle centers in max-w-2xl; contact is flat. */
  narrow?: boolean;
}) {
  /* Session-39/40: content headers — the h1 is FLAT text-4xl 36px (F40-03:
     the reference has no responsive scale) and the subtitle is text-lg
     18px/28px muted on both about and contact. */
  return (
    <div className={cn("text-center", spacing)}>
      <h1 className="font-display text-4xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className={cn("text-lg text-muted-foreground", narrow && "mx-auto max-w-2xl")}>{subtitle}</p>
      )}
    </div>
  );
}

const VALUES = [
  {
    icon: Award,
    title: "Quality First",
    body: "Every product is carefully curated to meet our high standards of craftsmanship and durability.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    body: "Our customers are at the heart of everything we do. Your satisfaction is our top priority.",
  },
  {
    icon: Heart,
    title: "Passion for Design",
    body: "We believe great design makes everyday life more enjoyable. Each item is chosen for both form and function.",
  },
  {
    icon: Globe,
    title: "Sustainability",
    body: "We're committed to offering eco-friendly options and reducing our environmental footprint.",
  },
];

export function AboutPage() {
  /* Session-39 (F39-18): the wrapper is max-w-4xl py-12 space-y-12.
     Session-40 (F40-02..12) measures the D4 internals: header space-y-4
     with a flat h1 + text-lg subtitle; the story grid steps at md with
     gap-6 (the sm→md tablet band stays 1-col); cards are p-6
     rounded-[16px] bg-card with the border-soft hairline and NO shadow
     on a space-y-3 rhythm (icon discs rounded-[12px] — trap #6: the
     clone's --radius-xl scale computes 20px, the reference's v3
     rounded-xl is 12px); h3 text-lg/600; the promise CTA is p-10
     rounded-[24px] with a flat text-2xl mb-3 heading and 16px/26px body. */
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeading
        spacing="space-y-4"
        narrow
        title="About Us"
        subtitle="We are passionate about bringing you the finest home and kitchen products that combine quality, functionality, and beautiful design. Our mission is to help you create a home you love."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {VALUES.map((value) => (
          <div key={value.title} className="space-y-3 rounded-[16px] border border-border-soft bg-card p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <value.icon className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <h3 className="font-display text-lg font-semibold text-foreground">{value.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[24px] bg-secondary p-10 text-center">
        <h2 className="mb-3 font-display text-2xl font-bold text-foreground">Our Promise</h2>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
          We stand behind every product we offer. If you're not completely satisfied, our dedicated support team is
          here to help. We believe in building lasting relationships with our customers through trust, transparency,
          and exceptional service.
        </p>
      </div>
    </div>
  );
}

/* F40-22: the reference contact inputs are the shadcn v3 spec — h-9
   36px, text-base 16px, rounded-xl = 12px (explicit — trap #6),
   border-input (rgb(229,224,220)), bg-transparent, px-3 py-1. The shared
   chrome inputClass (48px/admin surfaces) stays untouched. */
const contactFieldClass =
  "h-9 w-full rounded-[12px] border border-border bg-transparent px-3 py-1 text-base text-foreground shadow-sm placeholder:text-muted-foreground";

export function ContactPage() {
  const { toast } = useStore();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email so we can reply.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Add a few more words to your message.");
      return;
    }
    setError(null);
    setSent(true);
    toast("Message sent — we reply within one business day.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const cards = [
    { icon: Mail, title: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
    { icon: Phone, title: "Phone", value: BRAND.phone, href: `tel:${BRAND.phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, title: "Address", value: BRAND.address, href: null },
  ];

  return (
    /* Session-39 (F39-17): one space-y-12 wrapper owns the page rhythm
       (48px on the non-last children), the info grid steps at md with
       gap-6, and the page ENDS at the form — the old trailing
       self-service row was a resting-visual superset violation. */
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeading title="Contact Us" subtitle="We'd love to hear from you. Reach out anytime." />
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          /* 16px radius + the 0.5-alpha border-soft hairline, NO shadow
              (v4's rounded-xl computes 20px — trap #6). */
          <div key={card.title} className="rounded-[16px] border border-border-soft bg-card p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <h2 className="mt-3 text-sm font-bold text-foreground">{card.title}</h2>
            {card.href ? (
              <a href={card.href} className="mt-1 block text-sm text-muted-foreground hover:text-foreground">
                {card.value}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <form
        className="mx-auto max-w-2xl space-y-5 rounded-[16px] border border-border-soft bg-card p-8"
        onSubmit={onSubmit}
      >
        {/* F40-21..25: the reference form is the shadcn v3 spec — field
            groups on space-y-2, h-9 36px 16px inputs with 12px radius and
            transparent bg, leading-none labels, a min-h-[60px] rows-5
            textarea, and a FULL-WIDTH h-9 rounded-[9999px] primary submit
            with the v3 `shadow` geometry. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-medium leading-none text-foreground">
              Name
            </label>
            <input
              id="contact-name"
              className={contactFieldClass}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-medium leading-none text-foreground">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              className={contactFieldClass}
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-subject" className="text-sm font-medium leading-none text-foreground">
            Subject
          </label>
          <input
            id="contact-subject"
            className={contactFieldClass}
            placeholder="How can we help?"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-sm font-medium leading-none text-foreground">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            className="min-h-[60px] w-full rounded-[12px] border border-border bg-transparent px-3 py-2 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
            placeholder="Tell us more..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {sent && (
          <p className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent" role="status">
            Thanks — your message is in. We reply within one business day.
          </p>
        )}
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[9999px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] transition-colors hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
          Send Message
        </button>
      </form>
    </div>
  );
}

type LegalProps = { title: string; children: React.ReactNode };

/* F40-20: the reference computes the current date (measured "10/15/2026"
   on all 5 pages on sweep day) — M/D/YYYY, no leading zeros. A static
   build date is wrong the day after any build. */
function legalDate() {
  return new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", year: "numeric" }).format(
    new Date(),
  );
}

function LegalLayout({ title, children }: LegalProps) {
  /* Session-40 (F40-13..18): the reference legal template — max-w-3xl
     py-12 + lg:px-8; the h1 carries mb-8; the date row lives INSIDE the
     prose (not a separate subtitle); the prose is 16px/24px muted on a
     24px space-y-6 rhythm with 20px/600 foreground section headings and
     list-disc pl-6 space-y-2 lists (v4 space-y = margin-block-end on
     non-last children — the same visual rhythm as the reference's v3). */
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl font-bold text-foreground">{title}</h1>
      <div className="space-y-6 text-base text-muted-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const today = legalDate();
  return (
    <LegalLayout title="Privacy Policy">
      <p><strong>Last updated:</strong> {today}</p>
      <p>At HomeNest, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
      <h2>Information We Collect</h2>
      <p>We may collect information about you in a variety of ways including:</p>
      <ul>
        <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you voluntarily provide.</li>
        <li><strong>Usage Data:</strong> Information about how you access and use our website, including your IP address, browser type, pages visited, and time spent.</li>
        <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>To provide, operate, and maintain our website</li>
        <li>To improve, personalize, and expand our website</li>
        <li>To understand and analyze how you use our website</li>
        <li>To communicate with you for customer service and updates</li>
        <li>To process transactions</li>
        <li>To send you marketing and promotional communications (with your consent)</li>
        <li>To find and prevent fraud</li>
      </ul>
      <h2>Third-Party Services</h2>
      <p>We may employ third-party companies and individuals to facilitate our service, provide the service on our behalf, perform service-related tasks, or assist us in analyzing how our service is used. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
      <h2>Advertising</h2>
      <p>We may use third-party advertising companies, including Google AdSense, to serve ads when you visit our website. These companies may use information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet. You may opt out of personalized advertising by visiting Google Ads Settings.</p>
      <h2>Data Security</h2>
      <p>We implement appropriate technical and organizational security measures to protect your personal information. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
      <h2>Your Rights</h2>
      <p>You have the right to access, update, or delete your personal information. You may also opt out of marketing communications at any time by following the unsubscribe link in our emails.</p>
      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at hello@homenest.com.</p>
    </LegalLayout>
  );
}

export function TermsPage() {
  const today = legalDate();
  return (
    <LegalLayout title="Terms of Service">
      <p><strong>Last updated:</strong> {today}</p>
      <p>Welcome to HomeNest. By accessing and using our website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this site.</p>
      <h2>Use License</h2>
      <p>Permission is granted to temporarily access the materials (information or software) on HomeNest's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
      <ul>
        <li>Modify or copy the materials</li>
        <li>Use the materials for any commercial purpose or for any public display</li>
        <li>Attempt to decompile or reverse engineer any software contained on the website</li>
        <li>Remove any copyright or other proprietary notations from the materials</li>
        <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
      </ul>
      <h2>Product Information</h2>
      <p>We strive to display our products as accurately as possible. However, we do not guarantee that the colors, dimensions, or other details displayed on your screen will be exactly representative of the actual product. All product descriptions, pricing, and availability are subject to change without notice.</p>
      <h2>Disclaimer</h2>
      <p>The materials on HomeNest's website are provided on an 'as is' basis. HomeNest makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      <h2>Limitations</h2>
      <p>In no event shall HomeNest or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HomeNest's website.</p>
      <h2>Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
      <h2>Changes to Terms</h2>
      <p>HomeNest may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
      <h2>Contact Us</h2>
      <p>If you have any questions regarding these Terms of Service, please contact us at hello@homenest.com.</p>
    </LegalLayout>
  );
}

export function DisclaimerPage() {
  const today = legalDate();
  return (
    <LegalLayout title="Disclaimer">
      <p><strong>Last updated:</strong> {today}</p>
      <p>The information provided by HomeNest ("we," "us," or "our") on our website is for general informational purposes only. All information on the site is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
      <h2>External Links Disclaimer</h2>
      <p>The site may contain (or you may be sent through the site) links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.</p>
      <h2>Professional Disclaimer</h2>
      <p>The site cannot and does not contain professional advice. The information is provided for general informational and educational purposes only and is not a substitute for professional advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals.</p>
      <h2>Affiliates &amp; Advertising Disclaimer</h2>
      <p>This site may contain third-party advertisements and links to third-party sites. HomeNest does not make any representation as to the accuracy or suitability of any of the information contained in those advertisements or sites and does not accept any responsibility or liability for the conduct or content of those advertisements and sites and the offerings made by the third parties.</p>
      <p>We may use Google AdSense and other advertising networks. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites. Users may opt out of personalized advertising by visiting Google's Ads Settings page.</p>
      <h2>Testimonials Disclaimer</h2>
      <p>The site may contain testimonials by users of our products and/or services. These testimonials reflect the real-life experiences and opinions of such users. However, the experiences are personal to those particular users, and may not necessarily be representative of all users.</p>
      <h2>Contact Us</h2>
      <p>If you have any questions about this Disclaimer, please contact us at hello@homenest.com.</p>
    </LegalLayout>
  );
}

export function CookiePage() {
  const today = legalDate();
  return (
    <LegalLayout title="Cookie Policy">
      <p><strong>Last updated:</strong> {today}</p>
      <p>This Cookie Policy explains what cookies are and how HomeNest uses them on our website. You should read this policy so you can understand what type of cookies we use, the information we collect using cookies and how that information is used.</p>
      <h2>What Are Cookies?</h2>
      <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide reporting information to the website owners.</p>
      <h2>How We Use Cookies</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly and cannot be switched off in our systems.</li>
        <li><strong>Analytics Cookies:</strong> These allow us to count visits and traffic sources so we can measure and improve the performance of our site.</li>
        <li><strong>Advertising Cookies:</strong> These cookies may be set through our site by our advertising partners, including Google AdSense. They may be used to build a profile of your interests and show you relevant advertisements on other sites.</li>
        <li><strong>Functionality Cookies:</strong> These enable the website to provide enhanced functionality and personalization.</li>
      </ul>
      <h2>Third-Party Cookies</h2>
      <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website and deliver advertisements on and through the website. These include cookies from Google AdSense and Google Analytics.</p>
      <h2>Managing Cookies</h2>
      <p>You can set your browser to refuse all or some cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>
      <h2>Contact Us</h2>
      <p>If you have questions about our use of cookies, please contact us at hello@homenest.com.</p>
    </LegalLayout>
  );
}

export function RefundPage() {
  const today = legalDate();
  return (
    <LegalLayout title="Refund Policy">
      <p><strong>Last updated:</strong> {today}</p>
      <p>Thank you for shopping at HomeNest. We want you to be completely satisfied with your purchase. If you are not entirely happy, we're here to help.</p>
      <h2>Returns</h2>
      <p>You have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. The item must be in the original packaging. You must have the receipt or proof of purchase.</p>
      <h2>Refunds</h2>
      <p>Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your original method of payment within 7-14 business days.</p>
      <h2>Shipping</h2>
      <p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping may be deducted from your refund.</p>
      <h2>Exchanges</h2>
      <p>We only replace items if they are defective or damaged. If you need to exchange it for the same item, contact us at hello@homenest.com.</p>
      <h2>Contact Us</h2>
      <p>If you have any questions about our refund policy, please contact us at hello@homenest.com.</p>
    </LegalLayout>
  );
}
