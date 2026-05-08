import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomepageReviews, getReviewMediaItems, type ReviewMediaItem, type ReviewRow } from "@/lib/reviews";
import StarRating from "@/components/StarRating";
import ReviewSplitLayout from "@/components/ReviewSplitLayout";
import ReviewImageLightbox from "@/components/ReviewImageLightbox";

const fallbackTestimonials = [
  {
    name: "Ayesha Khan",
    reviewer_city: "Karachi",
    rating: 5,
    review_text:
      "Amazing quality plants! The monstera I ordered arrived in perfect condition. The team's care instructions were so helpful for a beginner like me.",
    image_url: null,
  },
  {
    name: "Ahmed Raza",
    reviewer_city: "Lahore",
    rating: 5,
    review_text:
      "Best nursery in Pakistan! Fast delivery, beautiful packaging, and the plants are thriving. My balcony garden looks incredible thanks to The Nursery.",
    image_url: null,
  },
  {
    name: "Fatima Ali",
    reviewer_city: "Islamabad",
    rating: 5,
    review_text:
      "Love my new snake plants! Perfect for my low-light apartment. Customer service was excellent and they answered all my questions patiently.",
    image_url: null,
  },
];

const Testimonials = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    items: { url: string; type: "image" | "video" }[];
    currentIndex: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReviews = async () => {
      setIsLoading(true);
      setFetchFailed(false);
      try {
        const data = await getHomepageReviews();
        if (mounted) setReviews(data);
      } catch {
        if (mounted) setFetchFailed(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchReviews();
    return () => {
      mounted = false;
    };
  }, []);

  const testimonials = useMemo(() => {
    if (!reviews.length || fetchFailed) {
      return fallbackTestimonials.map((item) => ({
        id: `fallback-${item.name}`,
        product_slug: "homepage",
        reviewer_name: item.name,
        reviewer_email: null,
        reviewer_city: item.reviewer_city,
        rating: item.rating,
        review_text: item.review_text,
        image_url: item.image_url,
        media_urls: [],
        media_types: [],
        status: "approved" as const,
        show_on_homepage: true,
        created_at: new Date().toISOString(),
      }));
    }
    return reviews;
  }, [reviews, fetchFailed]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy plant parents across Pakistan who trust The Nursery for their green companions.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-10 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <ReviewSplitLayout
            items={testimonials.map((testimonial, index) => (
              <Card
                key={`${testimonial.reviewer_name}-${index}`}
                className="border-border hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <StarRating value={testimonial.rating} />

                  {(() => {
                    const mediaItems = getReviewMediaItems(testimonial);
                    if (!mediaItems.length) return null;
                    return (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mediaItems.map((item: ReviewMediaItem, mediaIndex: number) => (
                          <button
                            key={`${item.url}-${mediaIndex}`}
                            type="button"
                            className="rounded-md border overflow-hidden"
                            onClick={() => setActiveLightbox({ items: mediaItems, currentIndex: mediaIndex })}
                          >
                            {item.type === "video" ? (
                              <video
                                src={item.url}
                                className="h-20 w-20 object-cover pointer-events-none"
                                muted
                                playsInline
                                autoPlay
                                loop
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={`Review by ${testimonial.reviewer_name}`}
                                className="h-20 w-20 object-cover"
                                loading="lazy"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  <p className="text-muted-foreground mb-6 mt-4 leading-relaxed">
                    "{testimonial.review_text}"
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-nature-sage flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.reviewer_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.reviewer_name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.reviewer_city}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            mobileGridClassName="grid gap-6 md:grid-cols-2 lg:hidden"
            desktopMainGridClassName="grid gap-6 lg:grid-cols-3"
          />
        )}
        <ReviewImageLightbox
          open={!!activeLightbox}
          items={activeLightbox?.items ?? []}
          currentIndex={activeLightbox?.currentIndex ?? 0}
          onNavigate={(nextIndex) =>
            setActiveLightbox((current) => (current ? { ...current, currentIndex: nextIndex } : current))
          }
          onOpenChange={(open) => {
            if (!open) setActiveLightbox(null);
          }}
        />
      </div>
    </section>
  );
};

export default Testimonials;
