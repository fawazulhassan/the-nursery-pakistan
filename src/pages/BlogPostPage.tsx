import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getPublishedBlogBySlug, type BlogRow } from "@/lib/blogs";

const BlogPostPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublishedBlogBySlug(slug);
        setBlog(data);
      } catch {
        setBlog(null);
        setError("Blog not found.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!blog) return;
    const previousTitle = document.title;
    document.title = blog.title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const previousDescription = meta.content;
    meta.content = blog.excerpt;

    return () => {
      document.title = previousTitle;
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = previousDescription;
      }
    };
  }, [blog]);

  const safeHtml = useMemo(() => {
    if (!blog) return "";
    return DOMPurify.sanitize(blog.content_html, { USE_PROFILES: { html: true } });
  }, [blog]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/blogs">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </Link>

        {isLoading ? (
          <div className="text-center py-14 text-muted-foreground">Loading article...</div>
        ) : error || !blog ? (
          <div className="text-center py-14 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">Article unavailable</h2>
            <p className="text-muted-foreground">{error ?? "This article could not be loaded."}</p>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto">
            <p className="text-sm text-primary mb-2">{blog.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{blog.title}</h1>
            <p className="text-muted-foreground mb-6">
              By {blog.author_name || "Admin"} ·{" "}
              {blog.published_at
                ? new Date(blog.published_at).toLocaleDateString()
                : new Date(blog.created_at).toLocaleDateString()}
            </p>
            {blog.featured_image_url && (
              <img
                src={blog.featured_image_url}
                alt={blog.title}
                className="w-full rounded-lg mb-8 max-h-[420px] object-cover"
                loading="lazy"
              />
            )}
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
