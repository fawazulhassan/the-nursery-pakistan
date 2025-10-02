import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";

const BlogPreview = () => {
  const posts = [
    {
      title: "Complete Guide to Monstera Care in Pakistan",
      excerpt: "Learn everything about growing and maintaining your Monstera deliciosa in Pakistani climate conditions...",
      date: "March 15, 2024",
      category: "Plant Care",
    },
    {
      title: "Top 10 Low-Maintenance Plants for Busy Professionals",
      excerpt: "Discover beautiful plants that thrive with minimal care, perfect for your office or home...",
      date: "March 12, 2024",
      category: "Beginner Guide",
    },
    {
      title: "Creating Your Indoor Garden: A Complete Setup Guide",
      excerpt: "Everything you need to know about setting up a thriving indoor garden in your Pakistani home...",
      date: "March 8, 2024",
      category: "Indoor Gardening",
    },
  ];

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
          <Button variant="outline" className="hidden md:flex">
            View All Articles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <Card
              key={post.title}
              className="group hover:shadow-xl transition-all duration-300 animate-fade-in border-border overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-48 bg-gradient-to-br from-nature-mint to-nature-sage" />
              
              <CardContent className="p-6">
                <div className="inline-block bg-primary/10 text-primary text-xs px-3 py-1 rounded-full mb-3">
                  {post.category}
                </div>
                
                <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <Button variant="ghost" size="sm" className="group/btn">
                    Read More
                    <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline">
            View All Articles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
