import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOG_CATEGORIES, getPublishedBlogs, type BlogRow } from "@/lib/blogs";

const POSTS_PER_PAGE = 9;

const BlogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const page = useMemo(() => {
    const raw = Number.parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);
  const category = searchParams.get("category") || "all";

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getPublishedBlogs({
          page,
          limit: POSTS_PER_PAGE,
          category: category === "all" ? undefined : category,
        });
        setBlogs(result.blogs);
        setTotalPages(result.totalPages);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, category]);

  const updateQuery = (next: { page?: number; category?: string }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next.page) nextParams.set("page", String(next.page));
    if (next.category) {
      if (next.category === "all") {
        nextParams.delete("category");
      } else {
        nextParams.set("category", next.category);
      }
      nextParams.set("page", "1");
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Plant Care Blog</h1>
            <p className="text-muted-foreground mt-1">Latest gardening tips, workshops, and seasonal updates.</p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-6 max-w-xs">
          <Select value={category} onValueChange={(value) => updateQuery({ category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {BLOG_CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading blogs...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">No blog posts yet</h2>
            <p className="text-muted-foreground">Try a different category or check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Card key={blog.id} className="overflow-hidden">
                <Link to={`/blog/${blog.slug}`} className="block overflow-hidden">
                  {blog.featured_image_url ? (
                    <img
                      src={blog.featured_image_url}
                      alt={blog.title}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-nature-mint to-nature-sage" />
                  )}
                </Link>
                <CardContent className="p-5">
                  <p className="text-xs text-primary mb-2">{blog.category}</p>
                  <Link to={`/blog/${blog.slug}`}>
                    <h2 className="font-bold text-lg mb-2 line-clamp-2">{blog.title}</h2>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{blog.excerpt}</p>
                  <Link to={`/blog/${blog.slug}`}>
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-10">
          <Button
            variant="outline"
            onClick={() => updateQuery({ page: page - 1 })}
            disabled={page <= 1 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            onClick={() => updateQuery({ page: page + 1 })}
            disabled={page >= totalPages || isLoading}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogsPage;
