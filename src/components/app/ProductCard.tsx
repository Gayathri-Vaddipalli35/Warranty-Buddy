import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatDate, remainingLabel } from "@/lib/warranty";
import { ProductImage } from "./ProductImage";
import { StatusBadge } from "./StatusBadge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex gap-4 rounded-2xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <ProductImage path={product.image_path} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold group-hover:text-primary">{product.name}</h3>
          <StatusBadge endDate={product.warranty_end_date} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {[product.brand, product.category].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Ends {formatDate(product.warranty_end_date)} · {remainingLabel(product.warranty_end_date)}
        </p>
      </div>
    </Link>
  );
}
