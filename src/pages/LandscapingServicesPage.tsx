import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Trees, Shovel, Ruler } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const LandscapingServicesPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-10">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Expert Landscaping Services</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              We design and build functional, beautiful gardens for homes and businesses across Pakistan.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6">
                <Trees className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Garden Design</h2>
                <p className="text-muted-foreground">
                  Plant selection, hardscape balance, and seasonal planning tailored to your location.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <Shovel className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Installation</h2>
                <p className="text-muted-foreground">
                  End-to-end setup including soil prep, irrigation guidance, and healthy plant placement.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <Ruler className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">On-Site Consultation</h2>
                <p className="text-muted-foreground">
                  We assess your space and provide practical recommendations that fit your budget.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-primary/5 border border-primary/20 p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-4">What You Get</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">Personalized layout and planting strategy</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">Climate-friendly species recommendations</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">Clear timeline and transparent cost estimate</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">Post-installation care guidance</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/account">Request Consultation</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/products">Browse Plants</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandscapingServicesPage;
