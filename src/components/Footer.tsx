import { useState } from "react";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/constants";
import { subscribeToNewsletter } from "@/lib/newsletter";

const QUICK_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Shop All", to: "/products" },
  { label: "Plant Care Guide", to: "/guide" },
  { label: "Delivery Info", to: "/account?tab=addresses" },
  { label: "Track Order", to: "/account?tab=orders" },
] as const;

const CATEGORY_LINKS = [
  ...CATEGORIES.map((category) => ({
    label: category.name,
    to: `/category/${category.slug}`,
  })),
  { label: "Landscaping", to: "/landscaping-services" },
  { label: "Workshop", to: "/flower-workshop" },
] as const;

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await subscribeToNewsletter(trimmedEmail);
      toast({
        title: result.status === "duplicate" ? "Already subscribed" : "Subscribed successfully",
        description:
          result.status === "duplicate"
            ? "You are already subscribed!"
            : "You will now receive updates and offers.",
      });

      if (result.status === "subscribed") {
        setEmail("");
      }
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl font-bold text-primary">The Nursery</div>
              <div className="text-sm text-muted-foreground">Pakistan</div>
            </div>
            <p className="text-muted-foreground mb-4">
              Your trusted source for premium plants and gardening supplies across Pakistan.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="outline" asChild>
                <a
                  href="https://facebook.com/profile.php?id=61579022675427"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit our Facebook page"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a
                  href="https://www.instagram.com/nurserypakistan_pk/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit our Instagram page"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a href="mailto:fawazulhassan@gmail.com" aria-label="Email The Nursery">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
                    <Link to={link.to}>
                      {link.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Categories</h3>
            <ul className="space-y-2">
              {CATEGORY_LINKS.map((category) => (
                <li key={category.label}>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
                    <Link to={category.to}>
                      {category.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Stay Updated</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get plant care tips and exclusive offers delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="w-full"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">Kasur, Pakistan</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm">0311-7819614</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">fawazulhassan@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 The Nursery Pakistan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
