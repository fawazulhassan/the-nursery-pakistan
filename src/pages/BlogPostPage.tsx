import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getPublishedBlogBySlug, type BlogRow } from "@/lib/blogs";
import { usePageSeo } from "@/components/SeoManager";
import Breadcrumbs from "@/components/Breadcrumbs";
import { createBreadcrumbSchema } from "@/lib/seoSchemas";

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

  usePageSeo(
    isLoading
      ? {
          title: "Loading Article | The Nursery Pakistan",
          noIndex: true,
        }
      : blog
        ? {
            title: `${blog.title} | The Nursery Pakistan`,
            description: blog.excerpt,
            canonicalPath: `/blog/${blog.slug}`,
            noIndex: false,
            image: blog.featured_image_url || undefined,
            type: "article",
            structuredData: [
              createBreadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Plant Care Blog", path: "/blogs" },
                { name: blog.title, path: `/blog/${blog.slug}` },
              ]),
              {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: blog.title,
                description: blog.excerpt,
                image: blog.featured_image_url || undefined,
                author: {
                  "@type": "Person",
                  name: blog.author_name || "The Nursery Pakistan",
                },
                datePublished: blog.published_at || blog.created_at,
                dateModified: blog.updated_at,
                mainEntityOfPage: `https://nurserypakistan.pk/blog/${blog.slug}`,
                publisher: { "@id": "https://nurserypakistan.pk/#organization" },
              },
            ],
          }
        : {
            title: "Article Not Found | The Nursery Pakistan",
            description: "The requested article could not be found.",
            noIndex: true,
          },
  );

  const safeHtml = useMemo(() => {
    if (!blog) return "";
    return DOMPurify.sanitize(blog.content_html, { USE_PROFILES: { html: true } });
  }, [blog]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Plant Care Blog", to: "/blogs" },
            { label: blog?.title || "Article" },
          ]}
        />
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
