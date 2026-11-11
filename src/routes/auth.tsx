import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import "@lovable.dev/cloud-auth-js/styles.css";
import { AuthCard } from "@/components/app/AuthCard";
import { GoogleIcon } from "@/components/app/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Warranty Buddy" },
      { name: "description", content: "Sign in or create your Warranty Buddy account." },
      { property: "og:title", content: "Sign in — Warranty Buddy" },
      { property: "og:description", content: "Sign in or create your Warranty Buddy account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/dashboard";
  try {
    const url = new URL(p, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  async function resend(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent again.");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(fd.get("email"));
    const password = passwordSchema.safeParse(fd.get("password"));
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!password.success) return toast.error(password.error.issues[0].message);

    setBusy(true);
    try {
      if (mode === "signup") {
        const fullName = String(fd.get("fullName") ?? "").trim().slice(0, 120);
        if (!fullName) return toast.error("Please enter your name");
        if (fd.get("confirm") !== password.data) return toast.error("Passwords do not match");
        const { data, error } = await supabase.auth.signUp({
          email: email.data,
          password: password.data,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) return toast.error(error.message);
        if (data.session) navigate({ to: "/dashboard" });
        else setSentTo(email.data);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
        if (error) {
          if (error.message.toLowerCase().includes("not confirmed")) setUnconfirmed(email.data);
          return toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
        }
        navigate({ to: safePath(search.redirect) });
      }
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    if (search.redirect) sessionStorage.setItem("wb:after-auth", safePath(search.redirect));
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Sign-in didn't complete. Please try again.");
    if (result.redirected) return;
    navigate({ to: safePath(sessionStorage.getItem("wb:after-auth") ?? undefined) });
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">Click the link in the email to activate your account, then sign in.</p>
          <Button variant="soft" className="w-full" onClick={() => resend(sentTo)}>Resend email</Button>
          <Button variant="ghost" className="w-full" onClick={() => { setSentTo(null); setMode("signin"); }}>
            Back to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={mode === "signin" ? "Welcome back" : "Create your account"}
      subtitle={mode === "signin" ? "Sign in to see your warranties." : "Start tracking your products in minutes."}
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5 grid gap-2">
        <Button type="button" variant="google" className="h-11 w-full" onClick={() => social("google")}>
          <GoogleIcon /> Continue with Google
        </Button>
        <button type="button" className="lovable-auth-button" onClick={() => social("lovable")}>
          Continue with Lovable
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {mode === "signup" && (
          <div className="grid gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" autoComplete="name" required maxLength={120} />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "signin" && (
              <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
        </div>
        {mode === "signup" && (
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          </div>
        )}
        <Button type="submit" className="h-11" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        {unconfirmed && mode === "signin" && (
          <p className="text-center text-sm text-muted-foreground">
            Haven't confirmed your email?{" "}
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => resend(unconfirmed)}>
              Resend link
            </button>
          </p>
        )}
      </form>
    </AuthCard>
  );
}
