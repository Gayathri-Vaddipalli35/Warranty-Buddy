import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { signedImageQuery } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductImage({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const { data: url } = useQuery(signedImageQuery(path));
  return (
    <div className={cn("flex items-center justify-center overflow-hidden bg-primary-soft text-primary", className)}>
      {path && url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Package className="h-1/3 w-1/3 min-h-5 min-w-5" aria-hidden />
      )}
    </div>
  );
}
