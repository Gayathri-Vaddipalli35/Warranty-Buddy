import { Button } from "@/components/ui/button";

export function QueryError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
      <p className="font-semibold">We couldn't load your data.</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
      {onRetry && <Button className="mt-4" variant="soft" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
