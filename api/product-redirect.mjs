import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const slugify = (name) => {
  const slug = String(name || "product")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || "product";
};

export default async function handler(request, response) {
  const id = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
  if (!id || !UUID_PATTERN.test(id)) {
    return response.status(404).send("Product not found.");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).send("Product redirect is not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .eq("is_visible", true)
    .maybeSingle();

  if (error || !data) {
    return response.status(404).send("Product not found.");
  }

  response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return response.redirect(308, `/product/${slugify(data.name)}--${data.id}`);
}
