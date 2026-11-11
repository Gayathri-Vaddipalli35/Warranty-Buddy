import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground">
        <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
      </span>
      Warranty Buddy
    </span>
  );
}
