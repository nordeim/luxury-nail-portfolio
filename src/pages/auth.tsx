import { useState, type FormEvent } from "react";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { STUDIO } from "@/data/studio";

// Auth views — sign in / create account / reset request. The reference's
// three-view structure (docs/reference-investigation.md §2) is mirrored;
// the Google button is intentionally absent (Deviations Ledger: no OAuth
// backend exists in a zero-server SPA — dead controls are forbidden).

type Mode = "signin" | "register" | "reset";

const COPY: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  signin: {
    title: `Welcome to ${STUDIO.fullName}`,
    subtitle: "Sign in to continue",
    submit: "Sign in",
  },
  register: {
    title: "Create Account",
    subtitle: "Join Aurelia to keep your appointments close",
    submit: "Create account",
  },
  reset: {
    title: "Reset your password",
    subtitle: "Enter your email and we'll send you a link to reset your password",
    submit: "Send reset link",
  },
};

export function LoginPage() {
  return <AuthCard mode="signin" />;
}

export function RegisterPage() {
  return <AuthCard mode="register" />;
}

export function ResetPage() {
  return <AuthCard mode="reset" />;
}

function AuthCard({ mode }: { mode: Mode }) {
  const { login, register, toast } = useStore();
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copy = COPY[mode];

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "reset") {
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
      return;
    }

    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const failure =
      mode === "signin" ? await login(email, password) : await register(email, password);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    toast(mode === "signin" ? "Welcome back." : "Welcome to Aurelia.");
    // Reference behavior, Verified: successful auth lands on "/" as an
    // authenticated visitor. replace = true so Back skips the auth view.
    navigate("/", { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-28 lg:py-36">
      <header className="text-center">
        <p className="eyebrow text-muted-foreground">Aurelia</p>
        <h1 className="mt-4 font-display text-4xl font-normal">{copy.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{copy.subtitle}</p>
      </header>

      <form onSubmit={onSubmit} className="mt-12 flex flex-col gap-8" data-auth-form={mode}>
        <label className="flex flex-col gap-2">
          <span className="eyebrow text-muted-foreground">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
          />
        </label>

        {mode !== "reset" && (
          <label className="flex flex-col gap-2">
            <span className="eyebrow text-muted-foreground">Password</span>
            <input
              name="password"
              type="password"
              required
              /* aria-label pins the accessible name to exactly "Password" —
                 the register-mode helper span inside the <label> would
                 otherwise aggregate into the name ("Password Min. 8
                 characters") and break label queries. */
              aria-label="Password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
            />
            {mode === "register" && (
              <span className="text-xs text-muted-foreground">Min. 8 characters</span>
            )}
          </label>
        )}

        {mode === "register" && (
          <label className="flex flex-col gap-2">
            <span className="eyebrow text-muted-foreground">Confirm Password</span>
            <input
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="border-b border-hairline bg-transparent py-3 text-base outline-none focus:border-gold"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-muted-foreground">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="eyebrow bg-band px-8 py-4 text-band-foreground transition-colors hover:bg-ink-soft hover:text-background disabled:opacity-60"
        >
          {copy.submit}
        </button>
      </form>

      <div className="mt-10 flex flex-col items-center gap-4 text-sm text-muted-foreground">
        {mode === "signin" && (
          <>
            <Link href="/reset" className="transition-colors hover:text-gold">
              Forgot password?
            </Link>
            <Link href="/register" className="transition-colors hover:text-gold">
              Need an account? Sign up
            </Link>
          </>
        )}
        {mode !== "signin" && (
          <Link href="/login" className="transition-colors hover:text-gold">
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
