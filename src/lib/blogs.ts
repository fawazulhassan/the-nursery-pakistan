import createDOMPurify from "isomorphic-dompurify";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const BLOG_CATEGORIES = [
  "Garden Tips",
  "Workshops",
  "Seasonal",
  "News",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type BlogRow = Tables<"blogs">;
export type BlogPublishStatus = "all" | "published" | "draft";

export interface BlogInput {
  title: string;
  slug?: string;
  excerpt: string;
  content_html: string;
  category: BlogCategory;
  author_name?: string;
  featured_image_url?: string | null;
  show_on_homepage?: boolean;
  display_order?: number | null;
}

export interface GetPublishedBlogsParams {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetAdminBlogsFilters {
  status?: BlogPublishStatus;
  category?: string;
  search?: string;
}

const BLOG_IMAGES_BUCKET = "blog-images";
const HOMEPAGE_BLOG_COUNT_KEY = "homepage_blog_count";
const DEFAULT_HOMEPAGE_BLOG_COUNT = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SLUG_LENGTH = 80;
const sanitize = createDOMPurify();

function sanitizeHtml(html: string) {
  return sanitize.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}

function parseHomepageBlogCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, parsed);
    }
  }

  if (value && typeof value === "object" && "homepage_blog_count" in value) {
    return parseHomepageBlogCount(
      (value as { homepage_blog_count?: unknown }).homepage_blog_count
    );
  }

  return DEFAULT_HOMEPAGE_BLOG_COUNT;
}

export function generateBlogSlug(title: string) {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned.slice(0, MAX_SLUG_LENGTH) || `blog-${Date.now()}`;
}

async function assertUniqueSlug(slug: string, ignoreId?: string) {
  let query = supabase.from("blogs").select("id").eq("slug", slug).limit(1);
  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data?.id) {
    throw new Error("A blog with this slug already exists.");
  }
}

export async function getHomepageBlogCount() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value_json")
    .eq("key", HOMEPAGE_BLOG_COUNT_KEY)
    .maybeSingle();

  if (error) throw error;
  return parseHomepageBlogCount(data?.value_json);
}

export async function setHomepageBlogCount(count: number) {
  const normalized = Math.max(1, Math.trunc(count));
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key: HOMEPAGE_BLOG_COUNT_KEY,
        value_json: normalized,
      },
      { onConflict: "key" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getHomepageBlogs() {
  const homepageCount = await getHomepageBlogCount();
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("is_published", true)
    .eq("show_on_homepage", true)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(homepageCount);

  if (error) throw error;
  return { blogs: data ?? [], homepageBlogCount: homepageCount };
}

export async function getPublishedBlogs(params: GetPublishedBlogsParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 9);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (params.category && BLOG_CATEGORIES.includes(params.category as BlogCategory)) {
    query = query.eq("category", params.category);
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    blogs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getPublishedBlogBySlug(slug: string) {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminBlogs(filters: GetAdminBlogsFilters = {}) {
  let query = supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status === "published") {
    query = query.eq("is_published", true);
  } else if (filters.status === "draft") {
    query = query.eq("is_published", false);
  }

  if (filters.category && BLOG_CATEGORIES.includes(filters.category as BlogCategory)) {
    query = query.eq("category", filters.category);
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,author_name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createBlog(input: BlogInput) {
  const slug = generateBlogSlug(input.slug?.trim() || input.title);
  await assertUniqueSlug(slug);

  const payload = {
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt.trim(),
    content_html: sanitizeHtml(input.content_html),
    category: input.category,
    author_name: input.author_name?.trim() || "Admin",
    featured_image_url: input.featured_image_url || null,
    show_on_homepage: input.show_on_homepage ?? true,
    display_order: input.display_order ?? null,
    is_published: false,
  };

  const { data, error } = await supabase
    .from("blogs")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlog(id: string, input: BlogInput) {
  const slug = generateBlogSlug(input.slug?.trim() || input.title);
  await assertUniqueSlug(slug, id);

  const payload = {
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt.trim(),
    content_html: sanitizeHtml(input.content_html),
    category: input.category,
    author_name: input.author_name?.trim() || "Admin",
    featured_image_url: input.featured_image_url || null,
    show_on_homepage: input.show_on_homepage ?? true,
    display_order: input.display_order ?? null,
  };

  const { data, error } = await supabase
    .from("blogs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setBlogPublished(id: string, isPublished: boolean) {
  const { data: current, error: fetchError } = await supabase
    .from("blogs")
    .select("published_at")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const updates: Partial<BlogRow> = {
    is_published: isPublished,
  };

  if (isPublished && !current.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("blogs")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlog(id: string) {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBlogImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeExt = (fileExt ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `blogs/${crypto.randomUUID()}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
