import { ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewSplitLayoutProps {
  items: ReactNode[];
  mobileGridClassName?: string;
  desktopMainGridClassName?: string;
}

const ReviewSplitLayout = ({
  items,
  mobileGridClassName = "grid gap-4 md:grid-cols-2 lg:hidden",
  desktopMainGridClassName = "grid gap-4 lg:grid-cols-3",
}: ReviewSplitLayoutProps) => {
  const windowSize = 3;
  const [startIndex, setStartIndex] = useState(0);
  const maxStartIndex = Math.max(0, items.length - windowSize);

  useEffect(() => {
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex);
    }
  }, [startIndex, maxStartIndex]);

  const visibleItems = useMemo(
    () => items.slice(startIndex, startIndex + windowSize),
    [items, startIndex]
  );
  const canPrev = startIndex > 0;
  const canNext = startIndex < maxStartIndex;
  const showArrows = items.length > windowSize;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxStartIndex, prev + 1));
  };

  const rangeStart = startIndex + 1;
  const rangeEnd = Math.min(startIndex + windowSize, items.length);

  return (
    <>
      <div className={mobileGridClassName}>
        {items.map((item, index) => (
          <div key={`mobile-${index}`}>{item}</div>
        ))}
      </div>

      <div className="hidden lg:block">
        {showArrows && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Show previous reviews"
              onClick={handlePrev}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[96px] text-center">
              {rangeStart}-{rangeEnd} of {items.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Show next reviews"
              onClick={handleNext}
              disabled={!canNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className={desktopMainGridClassName}>
          {visibleItems.map((item, index) => (
            <div key={`main-${index}`}>{item}</div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReviewSplitLayout;
