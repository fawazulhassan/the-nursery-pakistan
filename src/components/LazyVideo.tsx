import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyVideoProps {
  src: string;
  poster?: string;
  /**
   * When true and no `poster` is provided, the component will lazily extract
   * the first frame of the video client-side once the card scrolls into view
   * and use it as the poster. Wrapped in try/catch so a CORS-tainted canvas
   * silently degrades to the gradient placeholder.
   */
  captureFirstFrame?: boolean;
  title?: string;
  className?: string;
  /**
   * Tailwind class for the outer container's aspect/size, e.g. `aspect-square`,
   * `h-24 w-24`, `w-full h-full`. Defaults to `w-full h-full` so the parent's
   * size is respected.
   */
  aspectClassName?: string;
  /**
   * When provided, clicking the play button calls this handler INSTEAD of
   * mounting an inline `<video>`. Useful for callers that already open a
   * lightbox on click (avoids double-fetch / double-playback).
   */
  onClickOverride?: () => void;
}

const LazyVideo = ({
  src,
  poster,
  captureFirstFrame = false,
  title,
  className,
  aspectClassName = "w-full h-full",
  onClickOverride,
}: LazyVideoProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tempVideoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [extractedPoster, setExtractedPoster] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const disposeTempVideo = useCallback(() => {
    const tempVideo = tempVideoRef.current;
    if (!tempVideo) return;
    try {
      tempVideo.pause();
    } catch {
      // ignore
    }
    tempVideo.removeAttribute("src");
    tempVideo.src = "";
    try {
      tempVideo.load();
    } catch {
      // ignore
    }
    tempVideoRef.current = null;
  }, []);

  useEffect(() => {
    if (!captureFirstFrame) return;
    if (!inView) return;
    if (poster) return;
    if (extractedPoster) return;
    if (!src) return;

    let cancelled = false;

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    tempVideo.crossOrigin = "anonymous";
    tempVideoRef.current = tempVideo;

    const handleLoadedData = () => {
      if (cancelled) return;
      try {
        tempVideo.currentTime = Math.min(0.1, (tempVideo.duration || 0.2) - 0.01);
      } catch {
        // Some browsers throw if seeking before metadata. Try the seeked path anyway.
      }
    };

    const handleSeeked = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = tempVideo.videoWidth || 320;
        canvas.height = tempVideo.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          disposeTempVideo();
          return;
        }
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

        let dataUrl: string | null = null;
        try {
          dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        } catch {
          // SecurityError from CORS-tainted canvas → silently fall back.
          dataUrl = null;
        }

        if (!cancelled && dataUrl) {
          setExtractedPoster(dataUrl);
        }
      } finally {
        disposeTempVideo();
      }
    };

    const handleError = () => {
      disposeTempVideo();
    };

    tempVideo.addEventListener("loadeddata", handleLoadedData);
    tempVideo.addEventListener("seeked", handleSeeked);
    tempVideo.addEventListener("error", handleError);
    tempVideo.src = src;

    return () => {
      cancelled = true;
      tempVideo.removeEventListener("loadeddata", handleLoadedData);
      tempVideo.removeEventListener("seeked", handleSeeked);
      tempVideo.removeEventListener("error", handleError);
      disposeTempVideo();
    };
  }, [captureFirstFrame, inView, poster, extractedPoster, src, disposeTempVideo]);

  const effectivePoster = poster ?? extractedPoster ?? undefined;

  const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onClickOverride) {
      onClickOverride();
      return;
    }
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden bg-black", aspectClassName, className)}
      >
        <video
          src={src}
          poster={effectivePoster}
          preload="metadata"
          autoPlay
          controls
          playsInline
          title={title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={title ?? "Video"}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-muted to-muted/60",
        aspectClassName,
        className,
      )}
    >
      {effectivePoster ? (
        <img
          src={effectivePoster}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30"
      />

      <button
        type="button"
        aria-label="Play video"
        onClick={handlePlayClick}
        className={cn(
          "absolute inset-0 flex items-center justify-center group focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-white/90 text-black shadow-lg",
            "min-h-[44px] min-w-[44px] h-12 w-12 sm:h-14 sm:w-14",
            "transition-transform duration-200 group-hover:scale-110 group-active:scale-95",
            "ring-1 ring-black/5",
          )}
        >
          <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" fill="currentColor" />
        </span>
      </button>
    </div>
  );
};

export default LazyVideo;
