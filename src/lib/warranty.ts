// Warranty date math. All dates are calendar dates ("YYYY-MM-DD") handled in UTC
// so a user's time zone never shifts a day.

export const EXPIRING_SOON_DAYS = 30;

export type WarrantyStatus = "active" | "expiring_soon" | "expired";

export const STATUS_LABEL: Record<WarrantyStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
};

const DAY_MS = 86_400_000;

function parse(date: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date: ${date}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function toUtc(date: string): number {
  const { y, m, d } = parse(date);
  return Date.UTC(y, m - 1, d);
}

function format(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Adds months, clamping to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: string, months: number): string {
  const { y, m, d } = parse(date);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return format(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

/** The warranty covers through this date (inclusive). */
export function warrantyEndDate(startDate: string, months: number): string {
  return addMonths(startDate, months);
}

/** Today's calendar date in the user's own time zone. */
export function todayLocal(now: Date = new Date()): string {
  return format(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Whole days from `today` until `endDate`. 0 = last day of cover, negative = expired. */
export function daysRemaining(endDate: string, today: string = todayLocal()): number {
  return Math.round((toUtc(endDate) - toUtc(today)) / DAY_MS);
}

export function warrantyStatus(endDate: string, today: string = todayLocal()): WarrantyStatus {
  const days = daysRemaining(endDate, today);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

export function remainingLabel(endDate: string, today: string = todayLocal()): string {
  const days = daysRemaining(endDate, today);
  if (days < 0) {
    const ago = Math.abs(days);
    return `Expired ${ago} day${ago === 1 ? "" : "s"} ago`;
  }
  if (days === 0) return "Last day of cover";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/** Percentage of the warranty period already used, 0–100. */
export function warrantyProgress(startDate: string, endDate: string, today: string = todayLocal()): number {
  const total = toUtc(endDate) - toUtc(startDate);
  if (total <= 0) return 100;
  const used = toUtc(today) - toUtc(startDate);
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
}

export function formatDate(date: string): string {
  const { y, m, d } = parse(date);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
