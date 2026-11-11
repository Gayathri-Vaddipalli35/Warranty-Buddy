import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, CalendarCheck2, FileScan, ShieldCheck, Wrench } from "lucide-react";
import heroImg from "@/assets/hero-warranty.jpg";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/hooks/use-session-user";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Warranty Buddy — Never miss a warranty again" },
      {
        name: "description",
        content: "Keep every product, warranty and expiry date in one place, with reminders before cover runs out.",
      },
      { property: "og:title", content: "Warranty Buddy — Never miss a warranty again" },
      {
        property: "og:description",
        content: "Keep every product, warranty and expiry date in one place, with reminders before cover runs out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: CalendarCheck2, title: "Automatic expiry dates", text: "Enter the purchase date and warranty length — we work out the rest." },
  { icon: BellRing, title: "Reminders that matter", text: "See what is expiring soon before it is too late to claim." },
  { icon: FileScan, title: "Invoices, read for you", text: "Snap an invoice and let AI fill in the product details for review." },
  { icon: Wrench, title: "Service history", text: "Every repair and service visit, stored alongside the product." },
];

function Landing() {
  const { user } = useSessionUser();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        {user ? (
          <Button asChild>
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
            </Button>
          </div>
        )}
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2 md:pt-14">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-glow" aria-hidden />
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Your appliances, covered
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Never miss a <span className="text-primary">warranty</span> again.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Warranty Buddy keeps every phone, laptop and appliance you own — with its invoice and expiry date — in one tidy place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to={user ? "/dashboard" : "/auth"} search={user ? undefined : { mode: "signup" }}>
                  {user ? "Go to my products" : "Start tracking free"} <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImg}
            alt="A phone, laptop and fridge protected by a purple shield"
            width={1280}
            height={1024}
            className="w-full rounded-3xl"
          />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-base font-bold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Warranty Buddy
      </footer>
    </div>
  );
}
