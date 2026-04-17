import { Link } from "react-router-dom";
import { CalendarDays, Flower2, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getPublishedWorkshops, type WorkshopRow } from "@/lib/workshops";

const memoryFallbackImages = [
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80",
];

const FlowerWorkshopPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [recentWorkshops, setRecentWorkshops] = useState<WorkshopRow[]>([]);

  useEffect(() => {
    const loadWorkshops = async () => {
      try {
        const data = await getPublishedWorkshops();
        setRecentWorkshops(data.slice(0, 3));
      } catch {
        setRecentWorkshops([]);
      }
    };
    loadWorkshops();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/20">
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-6 bg-background border rounded-2xl p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Welcome</p>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Join Our Flower Workshop</h1>
              <p className="text-muted-foreground text-lg max-w-3xl mb-6">
                Learn floral arrangement, bouquet styling, and practical plant care techniques in a hands-on session.
                Discover your creative side with our expert guidance.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button asChild>
                  <Link to="/workshops">Reserve Workshop Seat</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/guide">Plant Care Guide</Link>
                </Button>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=80"
              alt="Flower workshop session"
              className="w-full h-[320px] lg:h-[360px] object-cover rounded-xl"
            />
          </div>
        </section>

        <section className="container mx-auto px-4 pb-8">
          <h2 className="text-sm text-muted-foreground mb-1">Workshop Highlights</h2>
          <h3 className="text-3xl font-bold mb-4">What You'll Learn</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <Flower2 className="h-6 w-6 text-primary mb-3" />
              <h4 className="text-lg font-semibold mb-1">Arrangement Basics</h4>
              <p className="text-sm text-muted-foreground">
                Learn shape, balance, and flower pairing to build elegant arrangements with confidence.
              </p>
            </Card>
            <Card className="p-5">
              <Sparkles className="h-6 w-6 text-primary mb-3" />
              <h4 className="text-lg font-semibold mb-1">Care Techniques</h4>
              <p className="text-sm text-muted-foreground">
                Discover tips to keep stems fresh longer and maintain blooms after your workshop.
              </p>
            </Card>
            <Card className="p-5">
              <Users className="h-6 w-6 text-primary mb-3" />
              <h4 className="text-lg font-semibold mb-1">Small Group Learning</h4>
              <p className="text-sm text-muted-foreground">
                Interactive guidance in a friendly class format with personalized feedback.
              </p>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-8">
          <h2 className="text-3xl font-bold mb-1">Workshop Memories</h2>
          <p className="text-muted-foreground mb-4">Recent workshop moments and floral creations.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {memoryFallbackImages.map((image, index) => (
              <img
                key={image}
                src={recentWorkshops[index]?.cover_image_url || image}
                alt={`Workshop memory ${index + 1}`}
                className="w-full h-52 rounded-xl object-cover border"
              />
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-10">
          <div className="rounded-2xl bg-background border p-6 md:p-8">
            <div className="flex items-start gap-3 mb-4">
              <CalendarDays className="h-6 w-6 text-primary mt-0.5" />
              <h3 className="text-2xl font-bold">Book Your Slot</h3>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              New batches open every month. Reserve your seat early to join the next available workshop near you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/workshops">Reserve Workshop Seat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/projects">Completed Projects</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 border-t pt-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Previous Workshops</h2>
              <p className="text-muted-foreground">Read complete workshop stories with photos and dates.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/workshops">View All Workshops</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5">
            {recentWorkshops.map((workshop) => (
              <Card key={workshop.id} className="overflow-hidden">
                <img src={workshop.cover_image_url} alt={workshop.title} className="w-full h-44 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">{workshop.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{workshop.description}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/workshop/${workshop.slug}`}>View Workshop →</Link>
                  </Button>
                </div>
              </Card>
            ))}
            {recentWorkshops.length === 0 && (
              <div className="col-span-full rounded-lg border bg-muted/20 p-6 text-center text-muted-foreground">
                No workshop posts yet. New sessions will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 border-t pt-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">Customer Reviews</h2>
          <p className="text-muted-foreground mb-6">Hear from participants who joined our flower workshop sessions.</p>

          <ReviewList productSlug="flower-workshop" />

          <div className="mt-6">
            {user ? (
              <Button onClick={() => setShowForm(true)}>Write a Review</Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Log in to write a review</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your workshop experience. Your review will be visible after admin approval.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm productSlug="flower-workshop" onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FlowerWorkshopPage;
