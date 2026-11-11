import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/app/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Warranty Buddy" },
      { name: "description", content: "Set a new password for your Warranty Buddy account." },
      { property: "og:title", content: "Choose a new password — Warranty Buddy" },
      { property: "og:description", content: "Set a new password for your Warranty Buddy account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== fd.get("confirm")) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <AuthCard title="Choose a new password">
      {ready ? (
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          </div>
          <Button type="submit" className="h-11" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Update password
          </Button>
        </form>
      ) : (
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>Open this page from the reset link in your email. Links expire after a short time.</p>
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">Request a new link</Link>
        </div>
      )}
    </AuthCard>
  );
}
