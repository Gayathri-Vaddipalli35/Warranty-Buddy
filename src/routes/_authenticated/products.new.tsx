import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductForm } from "@/components/app/ProductForm";
import { createProduct, removeProductImage, uploadProductImage } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/products/new")({
  head: () => ({
    meta: [
      { title: "Add product — Warranty Buddy" },
      { name: "description", content: "Add a product and its warranty details." },
      { property: "og:title", content: "Add product — Warranty Buddy" },
      { property: "og:description", content: "Add a product and its warranty details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add product" subtitle="We'll work out when the warranty ends." />
      <ProductForm
        submitLabel="Save product"
        onSubmit={async (values, image) => {
          const image_path = image.file ? await uploadProductImage(image.file) : null;
          try {
            const product = await createProduct({ ...values, image_path });
            await queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product added");
            navigate({ to: "/products/$productId", params: { productId: product.id } });
          } catch (err) {
            await removeProductImage(image_path);
            throw err;
          }
        }}
      />
    </div>
  );
}
