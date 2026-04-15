import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  className?: string;
  starClassName?: string;
}

const StarRating = ({ value, onChange, className = "", starClassName = "" }: StarRatingProps) => {
  const interactive = typeof onChange === "function";

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 ${active ? "fill-accent text-accent" : "text-muted-foreground"} ${starClassName}`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
