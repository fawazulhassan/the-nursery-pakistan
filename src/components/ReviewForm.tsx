import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MAX_REVIEW_MEDIA_FILES,
  getDefaultReviewerCity,
  submitReview,
  uploadReviewMedia,
  validateReviewMediaFile,
} from "@/lib/reviews";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { Button as IconButton } from "@/components/ui/button";

interface ReviewFormProps {
  productSlug: string;
  onSuccess: () => void;
}

interface FormErrors {
  reviewer_name?: string;
  reviewer_email?: string;
  reviewer_city?: string;
  rating?: string;
  review_text?: string;
  media?: string;
}

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

const ReviewForm = ({ productSlug, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState(user?.email ?? "");
  const [reviewerCity, setReviewerCity] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingCity, setLoadingCity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    setReviewerEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;

    const loadCity = async () => {
      setLoadingCity(true);
      try {
        const city = await getDefaultReviewerCity();
        if (mounted && city) {
          setReviewerCity(city);
        }
      } catch {
        if (mounted) {
          setReviewerCity("");
        }
      } finally {
        if (mounted) {
          setLoadingCity(false);
        }
      }
    };

    loadCity();
    return () => {
      mounted = false;
    };
  }, []);

  const mediaHint = useMemo(() => {
    if (!mediaFiles.length) return "Optional: up to 10 files. Images max 5MB, videos max 50MB.";
    return `${mediaFiles.length} file(s) selected`;
  }, [mediaFiles]);

  useEffect(() => {
    const previewUrls = mediaFiles.map((file) => URL.createObjectURL(file));
    setMediaPreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [mediaFiles]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    const trimmedName = reviewerName.trim();
    const trimmedEmail = reviewerEmail.trim();
    const trimmedCity = reviewerCity.trim();
    const trimmedText = reviewText.trim();

    if (!trimmedName) {
      nextErrors.reviewer_name = "Full name is required.";
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.reviewer_email = "Please enter a valid email address.";
    }

    if (!trimmedCity) {
      nextErrors.reviewer_city = "City is required.";
    }

    if (rating < 1 || rating > 5) {
      nextErrors.rating = "Please select a rating from 1 to 5.";
    }

    if (trimmedText.length < 10) {
      nextErrors.review_text = "Review text must be at least 10 characters.";
    }

    if (mediaFiles.length > MAX_REVIEW_MEDIA_FILES) {
      nextErrors.media = "Maximum 10 files allowed.";
    }

    for (const file of mediaFiles) {
      try {
        validateReviewMediaFile(file);
      } catch (error) {
        nextErrors.media = error instanceof Error ? error.message : "Please use valid image/video files.";
        break;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const uploadedMedia = await Promise.all(mediaFiles.map((file) => uploadReviewMedia(file)));
      const mediaUrls = uploadedMedia.map((item) => item.url);
      const mediaTypes = uploadedMedia.map((item) => item.type);
      const legacyImageUrl = uploadedMedia.find((item) => item.type === "image")?.url;

      await submitReview({
        product_slug: productSlug,
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim() || undefined,
        reviewer_city: reviewerCity.trim(),
        rating,
        review_text: reviewText.trim(),
        image_url: legacyImageUrl,
        media_urls: mediaUrls,
        media_types: mediaTypes,
      });

      toast({
        title: "Review submitted",
        description: "Thank you! Your review is pending approval.",
      });

      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "Unable to submit review",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const selected = Array.from(fileList);
    const remaining = MAX_REVIEW_MEDIA_FILES - mediaFiles.length;

    if (remaining <= 0) {
      setErrors((prev) => ({ ...prev, media: "Maximum 10 files allowed." }));
      return;
    }

    if (selected.length > remaining) {
      setErrors((prev) => ({ ...prev, media: "Maximum 10 files allowed." }));
    } else {
      setErrors((prev) => ({ ...prev, media: undefined }));
    }

    const accepted = selected.slice(0, remaining);
    setMediaFiles((prev) => [...prev, ...accepted]);
  };

  const removeMediaAt = (index: number) => {
    const previewUrl = mediaPreviewUrls[index];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, media: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reviewer_name">Full Name *</Label>
        <Input
          id="reviewer_name"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Enter your full name"
          required
        />
        {errors.reviewer_name && <p className="text-sm text-destructive">{errors.reviewer_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reviewer_email">Email (optional)</Label>
        <Input
          id="reviewer_email"
          type="email"
          value={reviewerEmail}
          onChange={(e) => setReviewerEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {errors.reviewer_email && <p className="text-sm text-destructive">{errors.reviewer_email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reviewer_city">City *</Label>
        <Input
          id="reviewer_city"
          value={reviewerCity}
          onChange={(e) => setReviewerCity(e.target.value)}
          placeholder={loadingCity ? "Loading city..." : "Enter your city"}
          required
        />
        {errors.reviewer_city && <p className="text-sm text-destructive">{errors.reviewer_city}</p>}
      </div>

      <div className="space-y-2">
        <Label>Star Rating *</Label>
        <StarRating value={rating} onChange={setRating} />
        {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review_text">Review *</Label>
        <Textarea
          id="review_text"
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience..."
          required
        />
        <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
        {errors.review_text && <p className="text-sm text-destructive">{errors.review_text}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review_image">Upload Photos/Videos (optional)</Label>
        <Input
          id="review_image"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => {
            handleMediaChange(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">{mediaHint}</p>
        {errors.media && <p className="text-sm text-destructive">{errors.media}</p>}
        {mediaFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaFiles.map((file, index) => {
              const isVideo = file.type.startsWith("video/");
              return (
                <div key={`${file.name}-${index}`} className="relative rounded-md border p-2 flex flex-col items-center">
                  {isVideo ? (
                    <video
                      src={mediaPreviewUrls[index]}
                      className="w-20 h-20 rounded object-cover border pointer-events-none"
                      muted
                      playsInline
                      autoPlay
                      loop
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={mediaPreviewUrls[index]}
                      alt={file.name}
                      className="w-20 h-20 rounded object-cover border"
                    />
                  )}
                  <p className="mt-1 text-xs truncate max-w-[80px]">{file.name}</p>
                  <IconButton
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={() => removeMediaAt(index)}
                  >
                    <X className="h-3 w-3" />
                  </IconButton>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
