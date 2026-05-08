import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductReviews, getReviewMediaItems, type ReviewMediaItem, type ReviewRow } from "@/lib/reviews";
import StarRating from "@/components/StarRating";
import ReviewImageLightbox from "@/components/ReviewImageLightbox";
import ReviewSplitLayout from "@/components/ReviewSplitLayout";

interface ReviewListProps {
  productSlug: string;
}

const ReviewList = ({ productSlug }: ReviewListProps) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<ReviewMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductReviews(productSlug);
      setReviews(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((idx) => (
          <Card key={idx}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" onClick={fetchReviews}>
          Retry
        </Button>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
        No reviews yet. Be the first!
      </div>
    );
  }

  return (
    <>
      <ReviewSplitLayout
        items={reviews.map((review) => (
          <Card key={review.id} className="border-border">
            <CardContent className="p-6">
              <StarRating value={review.rating} />

              <p className="text-muted-foreground mt-3 leading-relaxed">"{review.review_text}"</p>

              {(() => {
                const mediaItems = getReviewMediaItems(review);
                if (!mediaItems.length) return null;
                return (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mediaItems.map((item, index) => (
                      <button
                        key={`${item.url}-${index}`}
                        type="button"
                        onClick={() => {
                          setLightboxItems(mediaItems);
                          setLightboxIndex(index);
                        }}
                        className="rounded-md border overflow-hidden"
                      >
                        {item.type === "video" ? (
                          <video
                            src={item.url}
                            className="h-24 w-24 object-cover pointer-events-none"
                            muted
                            playsInline
                            autoPlay
                            loop
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={`Review from ${review.reviewer_name}`}
                            className="h-24 w-24 object-cover"
                            loading="lazy"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-4 text-sm">
                <p className="font-semibold text-foreground">
                  {review.reviewer_name} {review.reviewer_city ? `- ${review.reviewer_city}` : ""}
                </p>
                <p className="text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        mobileGridClassName="grid gap-4 md:grid-cols-2 lg:hidden"
        desktopMainGridClassName="grid gap-4 lg:grid-cols-3"
      />

      <ReviewImageLightbox
        open={lightboxItems.length > 0}
        items={lightboxItems}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxItems([]);
            setLightboxIndex(0);
          }
        }}
      />
    </>
  );
};

export default ReviewList;
