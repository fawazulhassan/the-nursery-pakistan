import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { fetchProductsWithFallback } from "@/lib/productQueries";
import { resolvePrimaryProductImage } from "@/lib/productImages";
import { productPath } from "@/lib/productUrls";
import { getAppliedSalePercent, getEffectivePrice } from "@/lib/productSale";
import { useSitewideSale } from "@/context/SitewideSaleContext";
import { CATEGORIES } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type ProductRow = Tables<"products">;

type SimilarProductsProps = {
  productId: string;
  category: string;
};

const isSaleCategory = (category: string) => category.trim().toLowerCase() === "sale";

const SimilarProducts = ({ productId, category }: SimilarProductsProps) => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sale } = useSitewideSale();

  useEffect(() => {
    if (isSaleCategory(category)) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setProducts([]);
    setIsLoading(true);

    const loadSimilar = async () => {
      try {
        const { data, error } = await fetchProductsWithFallback({
          category,
          excludeId: productId,
          limit: 4,
        });
        if (cancelled) return;
        if (error) {
          setProducts([]);
          return;
        }
        setProducts((data as ProductRow[]).filter((item) => item.id !== productId));
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSimilar();

    return () => {
      cancelled = true;
    };
  }, [productId, category]);

  if (isSaleCategory(category) || isLoading || products.length === 0) {
    return null;
  }

  const categoryMatch = CATEGORIES.find((item) => item.name === category);

  return (
    <section className="mt-14 border-t pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Similar plants</h2>
        {categoryMatch && (
          <Link
            to={`/category/${categoryMatch.slug}`}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => {
          const productImage = resolvePrimaryProductImage(product);
          const appliedPercent = getAppliedSalePercent(product, new Date(), sale);
          const saleActive = appliedPercent > 0;
          const effectivePrice = getEffectivePrice(product, new Date(), sale);

          return (
            <Link
              key={product.id}
              to={productPath(product)}
              className="group block overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative overflow-hidden bg-muted">
                <img
                  src={productImage}
                  alt={product.name}
                  className="h-40 w-full object-cover object-center transition-transform duration-500 group-hover:scale-110 sm:h-52 lg:h-64"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="600"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  {product.stock_quantity === 0 ? (
                    <Badge variant="destructive" className="px-3 py-1 text-xs">
                      Sold Out
                    </Badge>
                  ) : saleActive ? (
                    <Badge className="bg-red-500 px-3 py-1 text-xs text-white">
                      <Tag className="mr-1 h-3 w-3" />
                      {appliedPercent}% OFF
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="p-3 sm:p-4">
                <div className="mb-1 text-xs text-muted-foreground">{product.category}</div>
                <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary sm:text-lg">
                  {product.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {saleActive ? (
                    <>
                      <div className="text-sm text-muted-foreground line-through sm:text-xl">
                        Rs {product.price}
                      </div>
                      <div className="text-base font-bold text-red-500 sm:text-2xl">
                        Rs {effectivePrice.toFixed(0)}
                      </div>
                    </>
                  ) : (
                    <div className="text-base font-bold text-primary sm:text-2xl">
                      Rs {product.price}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarProducts;
