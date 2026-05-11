import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, MapPin, Sprout, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About Us</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              The Nursery is building a warm online home for plant lovers across Pakistan. This page uses
              placeholder copy for now and can be replaced with your final brand story later.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We help customers discover healthy plants, practical accessories, and simple gardening
                guidance with an easy-to-shop experience.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  What We Offer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Indoor plants, outdoor plants, pots, fertilizers, workshops, and seasonal collections
                curated for homes, offices, and gifting.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Support
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                We currently serve customers across Pakistan and continue refining delivery, order tracking,
                and support features as the brand grows.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact And Service Area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>
                  This section is intentionally simple for now. You can later replace it with your final brand
                  timeline, team story, certifications, or customer promise.
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Serving plant customers across Pakistan
                </p>
                <p>Email: fawazulhassan@gmail.com</p>
                <p>Facebook: facebook.com/profile.php?id=61579022675427</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;


