import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Flower2, Sparkles, Users } from "lucide-react";
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
import flowerWorkshopHeroBanner from "@/assets/flower-workshop-hero-banner.png";
import img1 from "@/assets/1.jpeg";
import img2 from "@/assets/2.jpeg";
import img3 from "@/assets/3.jpeg";
import img4 from "@/assets/4.jpeg";
import img5 from "@/assets/5.jpeg";
import img6 from "@/assets/6.jpeg";
import img7 from "@/assets/7.jpeg";
import img8 from "@/assets/8.jpeg";
import img9 from "@/assets/9.jpeg";
import img10 from "@/assets/10.png";
import img11 from "@/assets/11.jpeg";
import img12 from "@/assets/12.jpeg";
import img13 from "@/assets/13.jpeg";
import img14 from "@/assets/14.jpeg";
import img15 from "@/assets/15.jpeg";
import img16 from "@/assets/16.jpeg";
import img17 from "@/assets/17.jpeg";
import img18 from "@/assets/18.jpeg";
import img19 from "@/assets/19.jpeg";
import img20 from "@/assets/20.jpeg";
import img21 from "@/assets/21.jpeg";
import img22 from "@/assets/22.jpeg";
import img23 from "@/assets/23.jpeg";
import img24 from "@/assets/24.jpeg";
import img25 from "@/assets/25.jpeg";
import img26 from "@/assets/26.jpeg";
import img27 from "@/assets/27.jpeg";
import img28 from "@/assets/28.jpeg";
import img29 from "@/assets/29.jpeg";
import img30 from "@/assets/30.jpeg";
import img31 from "@/assets/31.jpeg";
import img32 from "@/assets/32.jpeg";
import img33 from "@/assets/33.jpeg";
import img34 from "@/assets/34.jpeg";
import img35 from "@/assets/35.jpeg";

const workshopMemoryImages = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15,
  img16,
  img17,
  img18,
  img19,
  img20,
  img21,
  img22,
  img23,
  img24,
  img25,
  img26,
  img27,
  img28,
  img29,
  img30,
  img31,
  img32,
  img33,
  img34,
  img35,
];

const FlowerWorkshopPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [recentWorkshops, setRecentWorkshops] = useState<WorkshopRow[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImageIndex(null);
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((current) => {
      if (current === null) return 0;
      return (current - 1 + workshopMemoryImages.length) % workshopMemoryImages.length;
    });
  };

  const showNextImage = () => {
    setSelectedImageIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % workshopMemoryImages.length;
    });
  };

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

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        showPreviousImage();
      } else if (event.key === "ArrowRight") {
        showNextImage();
      } else if (event.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/20">
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-6 bg-background border rounded-2xl p-6">
            <div>
              {/* <p className="text-sm text-muted-foreground mb-2">Welcome</p> */}
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                You walked in curious. You left a florist.
              </h1>
              <p className="text-muted-foreground text-lg max-w-3xl mb-6">
                Join Our Flower Workshop Learn floral arrangement, bouquet styling, and practical plant care techniques
                in a hands-on session. Discover your creative side with our expert guidance.
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
              src={flowerWorkshopHeroBanner}
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
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {workshopMemoryImages.map((image, index) => (
              <button key={image} type="button" onClick={() => openLightbox(index)} className="block">
                <img
                  src={image}
                  alt={`Workshop memory ${index + 1}`}
                  className="w-full h-28 rounded-xl object-cover border"
                />
              </button>
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
              <h2 className="text-3xl font-bold text-foreground mb-2">Now Enrolling — Floral Workshop</h2>
              <p className="text-muted-foreground">Learn the art of arrangement from our expert florists. A live, hands-on experience crafted for beginners and enthusiasts alike.</p>
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

      <Dialog
        open={isLightboxOpen}
        onOpenChange={(open) => {
          if (!open) closeLightbox();
        }}
      >
        <DialogContent className="max-w-5xl p-4 sm:p-6 [&>button]:hidden">
          {selectedImageIndex !== null && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full">
                <img
                  src={workshopMemoryImages[selectedImageIndex]}
                  alt={`Workshop memory ${selectedImageIndex + 1}`}
                  className="max-h-[75vh] w-full object-contain rounded-lg"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={showNextImage}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {selectedImageIndex + 1} / {workshopMemoryImages.length}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FlowerWorkshopPage;
