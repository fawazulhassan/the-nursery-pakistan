import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  deleteReview,
  getAdminReviews,
  getReviewMediaItems,
  updateReview,
  type ReviewMediaItem,
  type ReviewRow,
  type ReviewStatus,
} from "@/lib/reviews";
import AdminLayout from "@/components/admin/AdminLayout";
import StarRating from "@/components/StarRating";
import ReviewImageLightbox from "@/components/ReviewImageLightbox";
import LazyVideo from "@/components/LazyVideo";

type StatusFilter = "all" | ReviewStatus;

const statusBadgeVariant = (status: string): "outline" | "secondary" | "default" | "destructive" => {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const AdminReviewsPage = () => {
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [lightboxItems, setLightboxItems] = useState<ReviewMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getErrorMessage = (error: unknown) => {
    const maybePostgrest = error as Partial<PostgrestError> | null;
    if (maybePostgrest?.message) {
      const details = [maybePostgrest.details, maybePostgrest.hint].filter(Boolean).join(" ");
      const code = maybePostgrest.code ? ` (code: ${maybePostgrest.code})` : "";
      return `${maybePostgrest.message}${details ? ` ${details}` : ""}${code}`;
    }

    if (error instanceof Error) return error.message;
    return "Please try again.";
  };

  const fetchReviews = useCallback(async (slug?: string) => {
    setIsLoading(true);
    try {
      const data = await getAdminReviews(slug);
      setReviews(data);
    } catch (error: unknown) {
      toast({
        title: "Failed to load reviews",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchReviews(productFilter === "all" ? undefined : productFilter);
  }, [fetchReviews, productFilter]);

  const productOptions = useMemo(
    () => Array.from(new Set(reviews.map((review) => review.product_slug))).sort(),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (statusFilter !== "all" && review.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return (
        review.reviewer_name.toLowerCase().includes(query) ||
        (review.reviewer_email ?? "").toLowerCase().includes(query)
      );
    });
  }, [reviews, statusFilter, searchTerm]);

  const updateSingleReview = async (
    reviewId: string,
    status: "approved" | "rejected",
    showOnHomepage: boolean
  ) => {
    try {
      const updated = await updateReview(reviewId, status, showOnHomepage);
      setReviews((prev) => prev.map((item) => (item.id === reviewId ? updated : item)));
      toast({ title: "Review updated", description: "Changes saved successfully." });
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleToggleHomepage = async (review: ReviewRow, checked: boolean) => {
    const effectiveStatus: "approved" | "rejected" = review.status === "approved" ? "approved" : "rejected";
    await updateSingleReview(review.id, effectiveStatus, checked);
  };

  const handleDeleteReview = async (review: ReviewRow) => {
    const confirmed = window.confirm("Delete this review permanently? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteReview(review.id, review.image_url as string | null);
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
      toast({ title: "Review deleted", description: "Review removed successfully." });
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Review Management" icon={MessageSquare} desktopMenuMode="hamburger">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {productOptions.map((slug) => (
                    <SelectItem key={slug} value={slug}>
                      {slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Search by reviewer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No reviews found.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReviews.map((review) => {
              const isExpanded = !!expandedIds[review.id];
              const shouldTruncate = review.review_text.length > 180;
              const displayText = shouldTruncate && !isExpanded
                ? `${review.review_text.slice(0, 180)}...`
                : review.review_text;

              return (
                <Card key={review.id}>
                  <CardContent className="py-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-foreground">
                          {review.reviewer_name}
                          {review.reviewer_email ? ` (${review.reviewer_email})` : ""}
                        </p>
                        <Badge variant={statusBadgeVariant(review.status)}>{review.status}</Badge>
                        <span className="text-sm text-muted-foreground">{review.product_slug}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <StarRating value={review.rating} />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Show on Homepage</span>
                          <Switch
                            checked={review.show_on_homepage}
                            onCheckedChange={(checked) => handleToggleHomepage(review, checked)}
                            disabled={review.status !== "approved"}
                          />
                        </div>
                      </div>

                      <p className="text-muted-foreground">
                        {displayText}
                        {shouldTruncate && (
                          <button
                            type="button"
                            className="ml-2 text-primary hover:underline"
                            onClick={() => setExpandedIds((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </p>

                      <div className="flex items-center gap-4 flex-wrap">
                        <p className="text-sm text-muted-foreground">City: {review.reviewer_city}</p>

                        {(() => {
                          const mediaItems = getReviewMediaItems(review);
                          if (!mediaItems.length) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              {mediaItems.map((item, index) => (
                                item.type === "video" ? (
                                  <div
                                    key={`${item.url}-${index}`}
                                    className="rounded-md border overflow-hidden h-16 w-16"
                                  >
                                    <LazyVideo
                                      src={item.url}
                                      captureFirstFrame
                                      title={`Review video by ${review.reviewer_name}`}
                                      aspectClassName="h-16 w-16"
                                      onClickOverride={() => {
                                        setLightboxItems(mediaItems);
                                        setLightboxIndex(index);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <button
                                    key={`${item.url}-${index}`}
                                    type="button"
                                    className="rounded-md border overflow-hidden"
                                    onClick={() => {
                                      setLightboxItems(mediaItems);
                                      setLightboxIndex(index);
                                    }}
                                  >
                                    <img
                                      src={item.url}
                                      alt={`Review from ${review.reviewer_name}`}
                                      className="h-16 w-16 object-cover"
                                      loading="lazy"
                                    />
                                  </button>
                                )
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateSingleReview(review.id, "approved", review.show_on_homepage)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateSingleReview(review.id, "rejected", false)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReview(review)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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
    </AdminLayout>
  );
};

export default AdminReviewsPage;
