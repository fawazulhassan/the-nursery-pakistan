import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductReviews, type ReviewRow } from "@/lib/reviews";
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
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

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

              {review.image_url && (
                <button
                  type="button"
                  className="mt-4"
                  onClick={() =>
                    setLightboxImage({
                      url: review.image_url as string,
                      alt: `Review by ${review.reviewer_name}`,
                    })
                  }
                >
                  <img
                    src={review.image_url}
                    alt={`Review from ${review.reviewer_name}`}
                    className="h-24 w-24 object-cover rounded-md border"
                  />
                </button>
              )}

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
        open={!!lightboxImage}
        imageUrl={lightboxImage?.url ?? ""}
        alt={lightboxImage?.alt ?? "Review image"}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      />
    </>
  );
};

export default ReviewList;
