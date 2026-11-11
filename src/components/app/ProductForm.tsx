import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, validateImage, type Product, type ProductInsert } from "@/lib/products";
import { formatDate, todayLocal, warrantyEndDate } from "@/lib/warranty";
import { ProductImage } from "./ProductImage";

const optional = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? null : v));

const schema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").max(200),
    brand: optional(100),
    category: z.enum(CATEGORIES),
    model_number: optional(100),
    serial_number: optional(100),
    purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Purchase date is required"),
    purchase_price: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 1e10), "Enter a valid price"),
    warranty_months: z.coerce.number().int("Whole months only").min(0).max(600, "Max 600 months"),
    warranty_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Warranty start date is required"),
    seller_name: optional(150),
    invoice_reference: optional(100),
    notes: optional(2000),
  })
  .refine((v) => v.purchase_date <= todayLocal(), { message: "Purchase date can't be in the future", path: ["purchase_date"] });

export type ProductFormValues = Omit<ProductInsert, "user_id" | "id" | "image_path">;

const PRESETS = [6, 12, 24, 36, 60];

type Props = {
  initial?: Product;
  submitLabel: string;
  onSubmit: (values: ProductFormValues, image: { file: File | null; removed: boolean }) => Promise<void>;
};

export function ProductForm({ initial, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    brand: initial?.brand ?? "",
    category: (initial?.category ?? "Mobile Phones") as (typeof CATEGORIES)[number],
    model_number: initial?.model_number ?? "",
    serial_number: initial?.serial_number ?? "",
    purchase_date: initial?.purchase_date ?? "",
    purchase_price: initial?.purchase_price != null ? String(initial.purchase_price) : "",
    warranty_months: String(initial?.warranty_months ?? 12),
    warranty_start_date: initial?.warranty_start_date ?? "",
    seller_name: initial?.seller_name ?? "",
    invoice_reference: initial?.invoice_reference ?? "",
    notes: initial?.notes ?? "",
  });
  const [startTouched, setStartTouched] = useState(!!initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (key: keyof typeof values) => (v: string) => {
    setValues((s) => {
      const next = { ...s, [key]: v };
      if (key === "purchase_date" && !startTouched) next.warranty_start_date = v;
      return next;
    });
  };

  const months = Number(values.warranty_months);
  const endDate =
    /^\d{4}-\d{2}-\d{2}$/.test(values.warranty_start_date) && Number.isInteger(months) && months >= 0 && months <= 600
      ? warrantyEndDate(values.warranty_start_date, months)
      : null;

  function pickFile(f: File | undefined) {
    if (!f) return;
    const problem = validateImage(f);
    if (problem) return toast.error(problem);
    setFile(f);
    setRemoved(false);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.message;
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(
        { ...parsed.data, warranty_end_date: warrantyEndDate(parsed.data.warranty_start_date, parsed.data.warranty_months) },
        { file, removed },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof values, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="grid gap-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={values[key]}
        onChange={(e) => set(key)(e.target.value)}
        aria-invalid={!!errors[key]}
        className={errors[key] ? "border-destructive" : undefined}
        {...props}
      />
      {errors[key] && <p className="text-xs font-medium text-destructive">{errors[key]}</p>}
    </div>
  );

  const showExisting = !!initial?.image_path && !removed && !file;

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <section className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-bold">Product</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Product name *", { placeholder: "e.g. Galaxy S24", maxLength: 200 })}</div>
          {field("brand", "Brand", { placeholder: "e.g. Samsung", maxLength: 100 })}
          <div className="grid gap-1.5">
            <Label htmlFor="category">Category *</Label>
            <Select value={values.category} onValueChange={(v) => set("category")(v)}>
              <SelectTrigger id="category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {field("model_number", "Model number", { maxLength: 100 })}
          {field("serial_number", "Serial number", { maxLength: 100 })}
        </div>

        <div className="mt-5">
          <Label>Photo</Label>
          <div className="mt-2 flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="Selected product" className="h-20 w-20 rounded-xl object-cover" />
            ) : showExisting ? (
              <ProductImage path={initial!.image_path} alt="Current product" className="h-20 w-20 rounded-xl" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>
                {preview || showExisting ? "Change photo" : "Add photo"}
              </Button>
              {(preview || showExisting) && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); setRemoved(true); }}>
                  <X /> Remove
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">JPG, PNG or WEBP, up to 5 MB.</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-bold">Purchase & warranty</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {field("purchase_date", "Purchase date *", { type: "date", max: todayLocal() })}
          {field("purchase_price", "Purchase price (₹)", { type: "number", inputMode: "decimal", min: 0, step: "0.01" })}
          <div className="grid gap-1.5">
            <Label htmlFor="warranty_months">Warranty length (months) *</Label>
            <Input
              id="warranty_months"
              type="number"
              inputMode="numeric"
              min={0}
              max={600}
              value={values.warranty_months}
              onChange={(e) => set("warranty_months")(e.target.value)}
              aria-invalid={!!errors.warranty_months}
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("warranty_months")(String(m))}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                    Number(values.warranty_months) === m ? "border-primary bg-primary-soft text-primary-deep" : "hover:border-primary/40"
                  }`}
                >
                  {m % 12 === 0 ? `${m / 12} yr` : `${m} mo`}
                </button>
              ))}
            </div>
            {errors.warranty_months && <p className="text-xs font-medium text-destructive">{errors.warranty_months}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="warranty_start_date">Warranty start date *</Label>
            <Input
              id="warranty_start_date"
              type="date"
              value={values.warranty_start_date}
              onChange={(e) => { setStartTouched(true); set("warranty_start_date")(e.target.value); }}
              aria-invalid={!!errors.warranty_start_date}
            />
            <p className="text-xs text-muted-foreground">Usually the purchase or delivery date.</p>
            {errors.warranty_start_date && <p className="text-xs font-medium text-destructive">{errors.warranty_start_date}</p>}
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-primary-soft p-4 text-sm text-primary-deep">
          {endDate ? (
            <>Warranty covers you until <strong>{formatDate(endDate)}</strong>.</>
          ) : (
            "Enter a start date and warranty length to see when cover ends."
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {field("seller_name", "Seller / store", { maxLength: 150 })}
          {field("invoice_reference", "Invoice number", { maxLength: 100 })}
        </div>
        <div className="mt-4 grid gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={values.notes} onChange={(e) => set("notes")(e.target.value)} maxLength={2000} rows={3} />
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="button" variant="ghost" onClick={() => history.back()}>Cancel</Button>
        <Button type="submit" disabled={busy} className="min-w-32">
          {busy && <Loader2 className="animate-spin" />} {submitLabel}
        </Button>
      </div>
    </form>
  );
}
