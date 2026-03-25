import { supabase } from "@/integrations/supabase/client";

type ProductQueryOptions = {
  id?: string;
  searchTerm?: string;
  category?: string;
  saleOnly?: boolean;
  limit?: number;
};

const isMissingColumnError = (error: unknown, column: string) => {
  const err = error as {
    code?: string | number;
    message?: string;
    details?: string;
    hint?: string;
  };
  const code = String(err?.code ?? "");
  const payload = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.hint ?? ""}`.toLowerCase();
  return (
    code === "42703" ||
    code === "PGRST204" ||
    payload.includes(column.toLowerCase())
  );
};

type BuildQueryFlags = {
  applyVisibilityFilter: boolean;
  applySaleFilter: boolean;
  applyOrder: boolean;
};

const buildProductsQuery = (
  options: ProductQueryOptions,
  flags: BuildQueryFlags
) => {
  let query = supabase.from("products").select("*");

  if (options.id) query = query.eq("id", options.id);
  if (options.category) query = query.eq("category", options.category);
  if (options.searchTerm) {
    query = query.or(
      `name.ilike.%${options.searchTerm}%,description.ilike.%${options.searchTerm}%`
    );
  }

  if (flags.applyVisibilityFilter) query = query.eq("is_visible", true);
  if (flags.applySaleFilter) query = query.gt("sale_percentage", 0);

  if (flags.applyOrder) query = query.order("created_at", { ascending: false });

  if (options.limit) query = query.limit(options.limit);
  if (options.id) query = query.limit(1);

  return query;
};

export const fetchProductsWithFallback = async (options: ProductQueryOptions = {}) => {
  const primaryQuery = buildProductsQuery(options, {
    applyVisibilityFilter: true,
    applySaleFilter: !!options.saleOnly,
    applyOrder: true,
  });

  const { data, error } = await primaryQuery;
  if (!error) return { data: data || [], error: null };

  // Helpful for debugging differences between local and Vercel.
  // The UI currently shows a generic error toast, so this surfaces the real Supabase message.
  console.error("fetchProductsWithFallback primary query failed", {
    options,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });

  const errorMessage = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const missingIsVisible = isMissingColumnError(error, "is_visible");
  const missingSalePercentage =
    !!options.saleOnly && isMissingColumnError(error, "sale_percentage");

  // If it failed for reasons unrelated to missing columns, retry with safer query shapes.
  // This helps avoid cases where PostgREST rejects one filter and returns a 400.
  const attempts: Array<{
    applyVisibilityFilter: boolean;
    applySaleFilter: boolean;
    applyOrder: boolean;
  }> = [];

  // Prefer to keep visibility; only drop it if we suspect it caused the error.
  attempts.push({
    applyVisibilityFilter: true,
    applySaleFilter: false, // keep visible products, let caller filter sales on the client
    applyOrder: true,
  });

  if (missingIsVisible || errorMessage.includes("is_visible") || errorMessage.includes("visibility")) {
    attempts.push({
      applyVisibilityFilter: false,
      applySaleFilter: !!options.saleOnly && !missingSalePercentage,
      applyOrder: true,
    });
  } else {
    attempts.push({
      applyVisibilityFilter: false,
      applySaleFilter: !!options.saleOnly,
      applyOrder: true,
    });
  }

  attempts.push({
    applyVisibilityFilter: false,
    applySaleFilter: false,
    applyOrder: true,
  });

  // If ordering is causing issues (rare, but possible if schema differs), retry without order.
  attempts.push({
    applyVisibilityFilter: true,
    applySaleFilter: false,
    applyOrder: false,
  });

  attempts.push({
    applyVisibilityFilter: false,
    applySaleFilter: false,
    applyOrder: false,
  });

  for (const flags of attempts) {
    const retryQuery = buildProductsQuery(options, flags);
    const result = await retryQuery;
    if (!result.error) {
      // If sale column is missing entirely and caller asked for sale items, we can't filter reliably.
      if (options.saleOnly && missingSalePercentage) return { data: [], error: null };
      return { data: result.data || [], error: null };
    }
  }

  // Preserve old behavior: if we only failed because sale_percentage/is_visible doesn't exist, return clean empty.
  if (options.saleOnly && missingSalePercentage) return { data: [], error: null };
  if (missingIsVisible) return { data: [], error: null };

  // Otherwise, surface the original error.
  return { data: [], error };
};

