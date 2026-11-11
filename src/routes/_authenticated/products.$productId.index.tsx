import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/app/ProductImage";
import { QueryError } from "@/components/app/QueryError";
import { StatusBadge } from "@/components/app/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { deleteProduct, formatPrice, productQuery } from "@/lib/products";
import { formatDate, remainingLabel, warrantyProgress } from "@/lib/warranty";

export const Route = createFileRoute("/_authenticated/products/$productId/")({
  head: () => ({
    meta: [
      { title: "Product details — Warranty Buddy" },
      { name: "description", content: "Warranty details, dates and purchase info for this product." },
      { property: "og:title", content: "Product details — Warranty Buddy" },
      { property: "og:description", content: "Warranty details, dates and purchase info for this product." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.productId));
    if (!product) throw notFound();
  },
  errorComponent: ({ reset }) => <QueryError onRetry={reset} />,
  notFoundComponent: () => (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
      <p className="font-semibold">This product doesn't exist or was deleted.</p>
      <Button asChild variant="soft" className="mt-4"><Link to="/products">Back to products</Link></Button>
    </div>
  ),
  component: ProductDetail,
});

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value || "—"}</dd>
    </div>
  );
}

function ProductDetail() {
  const { productId } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(productId));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  if (!product) return null;

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteProduct(product!);
      queryClient.removeQueries({ queryKey: ["products", product!.id] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      navigate({ to: "/products", replace: true });
    } catch {
      toast.error("Couldn't delete the product. Please try again.");
      setDeleting(false);
    }
  }

  const months = product.warranty_months;
  const length = months % 12 === 0 && months > 0 ? `${months / 12} year${months === 12 ? "" : "s"}` : `${months} month${months === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All products
      </Link>

      <div className="flex flex-col gap-5 rounded-3xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <ProductImage path={product.image_path} alt={product.name} className="h-28 w-28 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <StatusBadge endDate={product.warranty_end_date} />
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <p className="text-muted-foreground">{[product.brand, product.category].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="soft">
            <Link to="/products/$productId/edit" params={{ productId: product.id }}><Pencil /> Edit</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" aria-label="Delete product"><Trash2 /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                <AlertDialogDescription>This removes the product and its photo. It can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-bold">Warranty</h2>
          <p className="mt-3 font-display text-2xl font-bold text-primary">{remainingLabel(product.warranty_end_date)}</p>
          <Progress value={warrantyProgress(product.warranty_start_date, product.warranty_end_date)} className="mt-3 h-2" />
          <dl className="mt-3 divide-y">
            <Row label="Length" value={length} />
            <Row label="Starts" value={formatDate(product.warranty_start_date)} />
            <Row label="Ends" value={formatDate(product.warranty_end_date)} />
          </dl>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-bold">Purchase</h2>
          <dl className="mt-2 divide-y">
            <Row label="Purchased" value={formatDate(product.purchase_date)} />
            <Row label="Price" value={formatPrice(product.purchase_price)} />
            <Row label="Seller" value={product.seller_name} />
            <Row label="Invoice number" value={product.invoice_reference} />
            <Row label="Model number" value={product.model_number} />
            <Row label="Serial number" value={product.serial_number} />
          </dl>
        </section>
        {product.notes && (
          <section className="rounded-2xl border bg-card p-5 shadow-card md:col-span-2">
            <h2 className="text-lg font-bold">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{product.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
