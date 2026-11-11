import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthCard } from "@/components/app/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Warranty Buddy" },
      { name: "description", content: "Get a link to reset your Warranty Buddy password." },
      { property: "og:title", content: "Reset your password — Warranty Buddy" },
      { property: "og:description", content: "Get a link to reset your Warranty Buddy password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = z.string().trim().email().safeParse(new FormData(e.currentTarget).get("email"));
    if (!email.success) { toast.error("Enter a valid email address"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way. Check your inbox (and spam).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" className="h-11" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Send reset link
          </Button>
        </form>
      )}
      <Link to="/auth" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
