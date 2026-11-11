import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export const CATEGORIES = [
  "Mobile Phones",
  "Laptops",
  "Televisions",
  "Washing Machines",
  "Refrigerators",
  "Electronics",
  "Kitchen Appliances",
  "Other Appliances",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const signedImageQuery = (path: string | null) =>
  queryOptions({
    queryKey: ["product-image", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WEBP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MB or smaller.";
  return null;
}

export async function uploadProductImage(file: File): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in again.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function removeProductImage(path: string | null) {
  if (!path) return;
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

export async function createProduct(values: ProductInsert) {
  const { data, error } = await supabase.from("products").insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, values: Partial<ProductInsert>) {
  const { data, error } = await supabase.from("products").update(values).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(product: Product) {
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;
  await removeProductImage(product.image_path);
}

export function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
