import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getProjectBySlug, type CompletedProjectRow } from "@/lib/landscapingProjects";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"];

const isVideoUrl = (url: string): boolean => {
  const normalized = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension));
};

const ProjectPostPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [project, setProject] = useState<CompletedProjectRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<{ images: string[]; currentIndex: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjectBySlug(slug);
        setProject(data);
      } catch {
        setProject(null);
        setError("Project not found.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!project) return;

    const previousTitle = document.title;
    document.title = project.title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const previousDescription = meta.content;
    meta.content = project.description.slice(0, 160);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = previousDescription;
      }
    };
  }, [project]);

  const galleryImages = useMemo(
    () => ((project?.gallery_image_urls as string[] | null) ?? []).filter((image) => !!image),
    [project]
  );

  useEffect(() => {
    if (!activeLightbox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setActiveLightbox((current) => {
          if (!current) return null;
          return {
            ...current,
            currentIndex: (current.currentIndex - 1 + current.images.length) % current.images.length,
          };
        });
      } else if (event.key === "ArrowRight") {
        setActiveLightbox((current) => {
          if (!current) return null;
          return {
            ...current,
            currentIndex: (current.currentIndex + 1) % current.images.length,
          };
        });
      } else if (event.key === "Escape") {
        setActiveLightbox(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightbox]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/projects">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>

        {isLoading ? (
          <div className="text-center py-14 text-muted-foreground">Loading project...</div>
        ) : error || !project ? (
          <div className="text-center py-14 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">Project unavailable</h2>
            <p className="text-muted-foreground">{error ?? "This project could not be loaded."}</p>
          </div>
        ) : (
          <article className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h1>
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full rounded-lg mb-8 max-h-[520px] object-cover"
              loading="lazy"
            />
            <p className="text-muted-foreground mb-6">{project.description}</p>

            {galleryImages.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((imageUrl, index) => (
                    isVideoUrl(imageUrl) ? (
                      <video
                        key={`${project.id}-gallery-${index}`}
                        src={imageUrl}
                        controls
                        playsInline
                        title={`${project.title} gallery video ${index + 1}`}
                        className="w-full rounded-lg border object-cover bg-black"
                      />
                    ) : (
                      <button
                        key={`${project.id}-gallery-${index}`}
                        type="button"
                        className="w-full aspect-square rounded-md border overflow-hidden"
                        onClick={() =>
                          setActiveLightbox({
                            images: galleryImages,
                            currentIndex: index,
                          })
                        }
                      >
                        <img
                          src={imageUrl}
                          alt={`${project.title} gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    )
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>
      <Dialog open={!!activeLightbox} onOpenChange={(open) => !open && setActiveLightbox(null)}>
        <DialogContent className="max-w-5xl p-4 sm:p-6 [&>button]:hidden">
          {activeLightbox ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full">
                {isVideoUrl(activeLightbox.images[activeLightbox.currentIndex]) ? (
                  <video
                    src={activeLightbox.images[activeLightbox.currentIndex]}
                    controls
                    playsInline
                    preload="metadata"
                    autoPlay
                    className="max-h-[75vh] w-full object-contain rounded-lg bg-black"
                  />
                ) : (
                  <img
                    src={activeLightbox.images[activeLightbox.currentIndex]}
                    alt={`Project gallery ${activeLightbox.currentIndex + 1}`}
                    className="max-h-[75vh] w-full object-contain rounded-lg"
                    loading="lazy"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  onClick={() =>
                    setActiveLightbox((current) =>
                      current
                        ? {
                            ...current,
                            currentIndex: (current.currentIndex - 1 + current.images.length) % current.images.length,
                          }
                        : null
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={() =>
                    setActiveLightbox((current) =>
                      current
                        ? {
                            ...current,
                            currentIndex: (current.currentIndex + 1) % current.images.length,
                          }
                        : null
                    )
                  }
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {activeLightbox.currentIndex + 1} / {activeLightbox.images.length}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default ProjectPostPage;
