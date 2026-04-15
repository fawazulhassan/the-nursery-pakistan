import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getDefaultReviewerCity,
  submitReview,
  uploadReviewImage,
} from "@/lib/reviews";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/contexts/AuthContext";

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
  image?: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingCity, setLoadingCity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const imageHint = useMemo(() => {
    if (!imageFile) return "Optional: image only, max 5MB.";
    return `${imageFile.name} (${Math.round(imageFile.size / 1024)} KB)`;
  }, [imageFile]);

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

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        nextErrors.image = "Only image files are allowed.";
      } else if (imageFile.size > 5 * 1024 * 1024) {
        nextErrors.image = "Image must be 5MB or smaller.";
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
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadReviewImage(imageFile);
      }

      await submitReview({
        product_slug: productSlug,
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim() || undefined,
        reviewer_city: reviewerCity.trim(),
        rating,
        review_text: reviewText.trim(),
        image_url: imageUrl,
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
        <Label htmlFor="review_image">Upload Photo (optional)</Label>
        <Input
          id="review_image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">{imageHint}</p>
        {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
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
