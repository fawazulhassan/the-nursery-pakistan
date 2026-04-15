import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Flower2, Users, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const FlowerWorkshopPage = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Join Our Flower Workshop</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Learn floral arrangement, bouquet styling, and practical plant care techniques in a hands-on session.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6">
                <Flower2 className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Arrangement Basics</h2>
                <p className="text-muted-foreground">
                  Learn shape, balance, and flower pairing to build elegant arrangements with confidence.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <Sparkles className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Care Techniques</h2>
                <p className="text-muted-foreground">
                  Discover tips to keep stems fresh longer and maintain blooms after your workshop.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Small Group Learning</h2>
                <p className="text-muted-foreground">
                  Interactive guidance in a friendly class format with personalized feedback.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-primary/5 border border-primary/20 p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <CalendarDays className="h-6 w-6 text-primary mt-0.5" />
                <h3 className="text-2xl font-bold">Book Your Slot</h3>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                New batches open every month. Reserve your seat early to join the next available workshop near you.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/account">Reserve Workshop Seat</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/guide">Plant Care Guide</Link>
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

export default FlowerWorkshopPage;
