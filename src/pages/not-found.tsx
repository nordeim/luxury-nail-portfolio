import { Link } from "@/lib/router";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-32 text-center lg:py-44">
      <p className="font-display text-8xl font-normal text-gold">404</p>
      <h1 className="mt-6 font-display text-4xl font-normal">Page Not Found</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The page you are looking for has wandered off the menu. The collection, however, is
        exactly where you left it.
      </p>
      <Link
        href="/"
        className="eyebrow mt-10 bg-band px-8 py-4 text-band-foreground transition-colors hover:bg-ink-soft hover:text-background"
      >
        Return Home
      </Link>
    </div>
  );
}
