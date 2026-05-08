import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { getHomepageBlogs, type BlogRow } from "@/lib/blogs";

const BlogPreview = () => {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [homepageBlogCount, setHomepageBlogCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getHomepageBlogs();
        setPosts(data.blogs);
        setHomepageBlogCount(data.homepageBlogCount);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const mainPosts = useMemo(() => posts.slice(0, 3), [posts]);
  const sidebarPosts = useMemo(() => posts.slice(3, homepageBlogCount), [posts, homepageBlogCount]);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Plant Care Tips
            </h2>
            <p className="text-muted-foreground">
              Expert advice to help your plants thrive
            </p>
          </div>
          <Link to="/blogs" className="hidden md:flex">
            <Button variant="outline">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-10">Loading blog posts...</div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                We are preparing fresh plant care articles. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mainPosts.map((post, index) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-xl transition-all duration-300 animate-fade-in border-border overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-nature-mint to-nature-sage" />
                    )}

                    <CardContent className="p-6">
                      <div className="inline-block bg-primary/10 text-primary text-xs px-3 py-1 rounded-full mb-3">
                        {post.category}
                      </div>

                      <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <Button variant="ghost" size="sm" className="group/btn">
                            Read More
                            <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {sidebarPosts.length > 0 && (
                <div className="hidden lg:block">
                  <div className="rounded-lg border bg-card p-4 space-y-4 sticky top-24">
                    <h3 className="font-semibold">More Articles</h3>
                    {sidebarPosts.map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="block border-b pb-3 last:border-b-0 last:pb-0">
                        <p className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                          {post.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/blogs">
            <Button variant="outline">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
