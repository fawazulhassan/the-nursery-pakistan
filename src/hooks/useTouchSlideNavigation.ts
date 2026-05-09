import { useCallback, useRef, type MutableRefObject } from "react";
import type { TouchEvent } from "react";

const SWIPE_THRESHOLD_PX = 50;

/**
 * Stable touch handlers (empty useCallback dependency arrays).
 * Assign `onNextRef.current` and `onPrevRef.current` on each render so they see latest state.
 */
export function useTouchSlideNavigation(
  onNextRef: MutableRefObject<() => void>,
  onPrevRef: MutableRefObject<() => void>,
) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      touchStartX.current = null;
      return;
    }
    touchStartX.current = touch.clientX;
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    try {
      const startX = touchStartX.current;
      if (startX == null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const distance = startX - touch.clientX;
      if (distance > SWIPE_THRESHOLD_PX) {
        onNextRef.current();
      } else if (distance < -SWIPE_THRESHOLD_PX) {
        onPrevRef.current();
      }
    } finally {
      touchStartX.current = null;
    }
    // Intentional []: onNextRef/onPrevRef.current updated by callers each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleTouchStart, handleTouchEnd };
}
