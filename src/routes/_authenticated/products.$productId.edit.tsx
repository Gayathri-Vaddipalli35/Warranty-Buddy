import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductForm } from "@/components/app/ProductForm";
import { QueryError } from "@/components/app/QueryError";
import { productQuery, removeProductImage, updateProduct, uploadProductImage } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/products/$productId/edit")({
  head: () => ({
    meta: [
      { title: "Edit product — Warranty Buddy" },
      { name: "description", content: "Update a product's warranty details." },
      { property: "og:title", content: "Edit product — Warranty Buddy" },
      { property: "og:description", content: "Update a product's warranty details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.productId));
    if (!product) throw notFound();
  },
  errorComponent: ({ reset }) => <QueryError onRetry={reset} />,
  notFoundComponent: () => <QueryError />,
  component: EditProduct,
});

function EditProduct() {
  const { productId } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(productId));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (!product) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit product" subtitle={product.name} />
      <ProductForm
        initial={product}
        submitLabel="Save changes"
        onSubmit={async (values, image) => {
          let image_path = product.image_path;
          if (image.file) image_path = await uploadProductImage(image.file);
          else if (image.removed) image_path = null;
          await updateProduct(product.id, { ...values, image_path });
          if (image_path !== product.image_path) await removeProductImage(product.image_path);
          await queryClient.invalidateQueries({ queryKey: ["products"] });
          toast.success("Changes saved");
          navigate({ to: "/products/$productId", params: { productId: product.id } });
        }}
      />
    </div>
  );
}
