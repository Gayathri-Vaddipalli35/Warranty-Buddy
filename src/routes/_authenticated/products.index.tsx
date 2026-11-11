import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Package, Plus, Search } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard } from "@/components/app/ProductCard";
import { QueryError } from "@/components/app/QueryError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, productsQuery } from "@/lib/products";
import { STATUS_LABEL, todayLocal, warrantyStatus } from "@/lib/warranty";

const SORTS = {
  newest: "Newest first",
  expiry: "Ending soonest",
  name: "Name A–Z",
  price: "Price high–low",
} as const;

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "expiring_soon", "expired"]).optional(),
  sort: z.enum(["newest", "expiry", "name", "price"]).optional(),
});

export const Route = createFileRoute("/_authenticated/products/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Products — Warranty Buddy" },
      { name: "description", content: "Search, filter and sort all your products and warranties." },
      { property: "og:title", content: "Products — Warranty Buddy" },
      { property: "og:description", content: "Search, filter and sort all your products and warranties." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  pendingComponent: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
  ),
  errorComponent: ({ reset }) => <QueryError onRetry={reset} />,
  component: Products,
});

function Products() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (s) => ({ ...s, ...patch }), replace: true });

  const filtered = useMemo(() => {
    const today = todayLocal();
    const q = (search.q ?? "").trim().toLowerCase();
    const list = products.filter((p) => {
      if (search.category && p.category !== search.category) return false;
      if (search.status && warrantyStatus(p.warranty_end_date, today) !== search.status) return false;
      if (!q) return true;
      return [p.name, p.brand, p.model_number, p.serial_number, p.seller_name]
        .some((v) => v?.toLowerCase().includes(q));
    });
    const sort = search.sort ?? "newest";
    return [...list].sort((a, b) => {
      if (sort === "expiry") return a.warranty_end_date.localeCompare(b.warranty_end_date);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price") return (b.purchase_price ?? -1) - (a.purchase_price ?? -1);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [products, search]);

  const hasFilters = !!(search.q || search.category || search.status);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"} tracked`}
        actions={<Button asChild><Link to="/products/new"><Plus /> Add product</Link></Button>}
      />

      <div className="mb-5 grid gap-3 rounded-2xl border bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search name, brand, model or serial"
            className="pl-9"
            defaultValue={search.q ?? ""}
            onChange={(e) => update({ q: e.target.value || undefined })}
            aria-label="Search products"
          />
        </div>
        <Select value={search.category ?? "all"} onValueChange={(v) => update({ category: v === "all" ? undefined : v })}>
          <SelectTrigger className="lg:w-48" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={search.status ?? "all"}
          onValueChange={(v) => update({ status: v === "all" ? undefined : (v as "active" | "expiring_soon" | "expired") })}
        >
          <SelectTrigger className="lg:w-40" aria-label="Warranty status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.sort ?? "newest"} onValueChange={(v) => update({ sort: v as keyof typeof SORTS })}>
          <SelectTrigger className="sm:col-span-2 lg:col-span-1 lg:w-44" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">{hasFilters ? "No matching products" : "No products yet"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters ? "Try a different search or clear the filters." : "Add your first product to start tracking its warranty."}
          </p>
          {hasFilters ? (
            <Button variant="soft" className="mt-4" onClick={() => navigate({ search: {}, replace: true })}>Clear filters</Button>
          ) : (
            <Button asChild className="mt-4"><Link to="/products/new"><Plus /> Add product</Link></Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  );
}
