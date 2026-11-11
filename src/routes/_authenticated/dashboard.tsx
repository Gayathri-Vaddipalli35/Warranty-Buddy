import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Package, Plus, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductImage } from "@/components/app/ProductImage";
import { QueryError } from "@/components/app/QueryError";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery, type Product } from "@/lib/products";
import { addMonths, daysRemaining, formatDate, remainingLabel, todayLocal, warrantyStatus } from "@/lib/warranty";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Warranty Buddy" },
      { name: "description", content: "Your warranty overview: active, expiring soon and expired." },
      { property: "og:title", content: "Dashboard — Warranty Buddy" },
      { property: "og:description", content: "Your warranty overview: active, expiring soon and expired." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  pendingComponent: DashboardSkeleton,
  errorComponent: ({ reset }) => <QueryError onRetry={reset} />,
  component: Dashboard,
});

const chartConfig = { count: { label: "Warranties ending", color: "var(--chart-1)" } } satisfies ChartConfig;

function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-10 w-60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

function Dashboard() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { user } = Route.useRouteContext();
  const firstName = ((user.user_metadata?.full_name as string | undefined) ?? "").split(" ")[0];

  const stats = useMemo(() => {
    const today = todayLocal();
    const counts = { active: 0, expiring_soon: 0, expired: 0 };
    for (const p of products) counts[warrantyStatus(p.warranty_end_date, today)]++;
    const upcoming = products
      .filter((p) => daysRemaining(p.warranty_end_date, today) >= 0)
      .sort((a, b) => a.warranty_end_date.localeCompare(b.warranty_end_date))
      .slice(0, 5);
    const monthStart = today.slice(0, 8) + "01";
    const months = Array.from({ length: 12 }, (_, i) => addMonths(monthStart, i).slice(0, 7));
    const chart = months.map((m) => ({
      month: new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
      count: products.filter((p) => p.warranty_end_date.startsWith(m)).length,
    }));
    return { counts, upcoming, chart, recent: products.slice(0, 5) };
  }, [products]);

  const cards = [
    { label: "Total products", value: products.length, icon: Package, tone: "bg-primary-soft text-primary" },
    { label: "Active", value: stats.counts.active, icon: CheckCircle2, tone: "bg-success-soft text-success" },
    { label: "Expiring soon", value: stats.counts.expiring_soon, icon: Clock, tone: "bg-warning-soft text-warning" },
    { label: "Expired", value: stats.counts.expired, icon: XCircle, tone: "bg-danger-soft text-danger" },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Hi, ${firstName}` : "Dashboard"}
        subtitle="Here's how your warranties are looking today."
        actions={<Button asChild><Link to="/products/new"><Plus /> Add product</Link></Button>}
      />

      {stats.counts.expiring_soon > 0 && (
        <Link
          to="/products"
          search={{ status: "expiring_soon" }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
          <span className="flex-1">
            <strong>{stats.counts.expiring_soon}</strong> warrant{stats.counts.expiring_soon === 1 ? "y ends" : "ies end"} within 30 days.
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 font-display text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Add your first product</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Enter what you bought and when — we'll calculate the warranty end date and keep an eye on it.
          </p>
          <Button asChild className="mt-5"><Link to="/products/new"><Plus /> Add product</Link></Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-3">
            <h2 className="text-lg font-bold">Expiries in the next 12 months</h2>
            <ChartContainer config={chartConfig} className="mt-4 h-64 w-full">
              <BarChart data={stats.chart} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
            <h2 className="text-lg font-bold">Ending next</h2>
            {stats.upcoming.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No active warranties right now.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {stats.upcoming.map((p) => <MiniRow key={p.id} product={p} />)}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Recently added</h2>
              <Link to="/products" className="text-sm font-semibold text-primary hover:underline">View all</Link>
            </div>
            <ul className="mt-3 divide-y">
              {stats.recent.map((p) => <MiniRow key={p.id} product={p} showStatus />)}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

function MiniRow({ product, showStatus }: { product: Product; showStatus?: boolean }) {
  return (
    <li>
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="flex items-center gap-3 py-3 hover:text-primary"
      >
        <ProductImage path={product.image_path} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatDate(product.warranty_end_date)} · {remainingLabel(product.warranty_end_date)}
          </p>
        </div>
        {showStatus && <StatusBadge endDate={product.warranty_end_date} />}
      </Link>
    </li>
  );
}
