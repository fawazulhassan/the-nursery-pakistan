import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const collections = [
  {
    title: "Indoor Favorites",
    description: "Low-maintenance plants perfect for Pakistani homes",
    color: "from-nature-mint to-nature-sage",
    items: "50+ Plants",
    slug: CATEGORIES[0].slug,
  },
  {
    title: "Outdoor Garden",
    description: "Hardy plants that thrive in Pakistan's climate",
    color: "from-nature-sage to-primary",
    items: "80+ Plants",
    slug: CATEGORIES[1].slug,
  },
  {
    title: "Seasonal Specials",
    description: "Curated collection for the current season",
    color: "from-accent/30 to-nature-terracotta/30",
    items: "30+ Plants",
    slug: CATEGORIES[4].slug,
  },
];

const Collections = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Shop by Collection
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our thoughtfully curated collections designed for every space and style.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <Link
              key={collection.title}
              to={`/category/${collection.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${collection.color} opacity-20`} />
              
              <div className="relative z-10 space-y-4">
                <div className="inline-block bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {collection.items}
                </div>
                
                <h3 className="text-2xl font-bold text-foreground">
                  {collection.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {collection.description}
                </p>
                
                <Button variant="outline" className="group/btn bg-background/80 backdrop-blur-sm pointer-events-none">
                  Explore Collection
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-background/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Collections;
