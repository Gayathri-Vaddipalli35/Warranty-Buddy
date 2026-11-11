import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, warrantyStatus } from "@/lib/warranty";

const VARIANT = { active: "success", expiring_soon: "warning", expired: "danger" } as const;

export function StatusBadge({ endDate }: { endDate: string }) {
  const status = warrantyStatus(endDate);
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
