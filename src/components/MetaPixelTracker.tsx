import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fires Meta Pixel PageView on client-side route changes.
 * Skips the first mount because index.html already tracks the initial PageView.
 */
const MetaPixelTracker = () => {
  const { pathname, search } = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, search]);

  return null;
};

export default MetaPixelTracker;
