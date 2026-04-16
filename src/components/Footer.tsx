import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
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
              <Button size="icon" variant="outline">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {["About Us", "Shop All", "Plant Care Guide", "Delivery Info", "Track Order"].map((link) => (
                <li key={link}>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                    {link}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Categories</h3>
            <ul className="space-y-2">
              {["Indoor Plants", "Outdoor Plants", "Pots & Planters", "Fertilizers", "Garden Tools"].map((category) => (
                <li key={category}>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                    {category}
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Your email" className="w-full" />
              <Button className="w-full sm:w-auto">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">123 Garden Street, Karachi, Pakistan</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm">+92 300 1234567</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">hello@thenursery.pk</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 The Nursery Pakistan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
