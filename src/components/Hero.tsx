import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-plants.jpg";

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-nature-mint to-background overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-block">
              <span className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
                New Arrivals 🌿
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bring Nature to Your Home
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Discover our curated collection of indoor and outdoor plants, handpicked for Pakistani homes. From easy-care succulents to statement fiddle leaf figs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link to="/products">
                  Shop Plants
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/guide">Plant Care Guide</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 sm:gap-8 pt-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary">500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Plant Varieties</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary">50K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Organic Care</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl" />
            <img
              src={heroImage}
              alt="Beautiful indoor plants collection"
              className="rounded-3xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-nature-sage/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
    </section>
  );
};

export default Hero;
