import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { getCompletedProjects, type CompletedProjectRow } from "@/lib/landscapingProjects";
import { useToast } from "@/hooks/use-toast";
import landscapingServicesHeroBanner from "@/assets/landscaping-services-hero-banner.webp";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"];

const isVideoUrl = (url: string): boolean => {
  const normalized = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension));
};

const LandscapingServicesPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState<CompletedProjectRow[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeLightbox, setActiveLightbox] = useState<{ images: string[]; currentIndex: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const data = await getCompletedProjects();
        if (!isMounted) return;
        setProjects(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Please try again later.";
        if (!isMounted) return;
        toast({
          title: "Unable to load projects",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [toast]);

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

  const [featuredProject, remainingProjects] = useMemo(() => {
    if (!projects.length) return [null, [] as CompletedProjectRow[]];
    return [projects[0], projects.slice(1)];
  }, [projects]);

  const scrollToProjects = () => {
    const section = document.getElementById("completed-projects");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-10 bg-muted/20 border-b border-border">
          <div className="container mx-auto px-4">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-5">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                  Welcome, Our Landscaping Services
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl">
                With a passion for plants and a commitment to excellence, we offer comprehensive landscaping and plant maintenance services to our green community
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/landscaping-services/request-consultation">Request Consultation</Link>
                  </Button>
                  <Button type="button" variant="outline" onClick={scrollToProjects}>
                    View Our Portfolio
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
                <img
                  src={landscapingServicesHeroBanner}
                  alt="Luxury residential garden with manicured lawn, stone path, pond, and pergola seating"
                  className="w-full h-[320px] md:h-[380px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="completed-projects" className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Completed Projects</h2>

            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Projects coming soon.</div>
            ) : (
              <div className="space-y-6">
                {featuredProject && (
                  <article className="grid lg:grid-cols-2 gap-4 rounded-xl border bg-card p-4">
                    <img
                      src={featuredProject.cover_image_url}
                      alt={featuredProject.title}
                      className="w-full h-64 md:h-72 object-cover rounded-lg"
                    />
                    <div className="flex flex-col h-full space-y-3">
                      <h3 className="text-2xl font-semibold">{featuredProject.title}</h3>
                      <p className="text-muted-foreground">{featuredProject.description}</p>
                      {featuredProject.gallery_image_urls?.length ? (
                        <div>
                          <p className="font-medium text-sm mb-2">Gallery</p>
                          <div className="grid grid-cols-3 gap-2">
                            {featuredProject.gallery_image_urls.map((imageUrl, index) => {
                              return (
                              <div key={`${featuredProject.id}-gallery-${index}`} className="w-full aspect-square rounded-md border bg-muted/40 overflow-hidden">
                                {isVideoUrl(imageUrl) ? (
                                  <video
                                    src={imageUrl}
                                    controls
                                    muted
                                    playsInline
                                    title={`${featuredProject.title} gallery video ${index + 1}`}
                                    className="w-full h-full object-cover bg-black"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    className="w-full h-full"
                                    onClick={() =>
                                      setActiveLightbox({
                                        images: featuredProject.gallery_image_urls ?? [],
                                        currentIndex: index,
                                      })
                                    }
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`${featuredProject.title} gallery ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                )}
                              </div>
                            )})}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-auto flex justify-end pt-2">
                        <Link to={`/project/${featuredProject.slug}`}>
                          <Button variant="outline" size="sm">
                            View Project →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                )}

                {remainingProjects.length > 0 && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {remainingProjects.map((project) => {
                      const galleryItems = (project.gallery_image_urls ?? []).filter((item): item is string => Boolean(item));

                      return (
                      <article key={project.id} className="rounded-xl border bg-card p-4 flex flex-col h-full space-y-3">
                        <img
                          src={project.cover_image_url}
                          alt={project.title}
                          className="w-full h-44 object-cover rounded-md"
                        />
                        <h3 className="text-xl font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        {galleryItems.length ? (
                          <div>
                            <p className="font-medium text-sm mb-2">Gallery</p>
                            <div className="grid grid-cols-3 gap-2">
                              {galleryItems.map((imageUrl, index) => {
                                return (
                                <div key={`${project.id}-gallery-${index}`} className="w-full aspect-square rounded-md border bg-muted/40 overflow-hidden">
                                  {isVideoUrl(imageUrl) ? (
                                    <video
                                      src={imageUrl}
                                      controls
                                      muted
                                      playsInline
                                      title={`${project.title} gallery video ${index + 1}`}
                                      className="w-full h-full object-cover bg-black"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      className="w-full h-full"
                                      onClick={() =>
                                        setActiveLightbox({
                                          images: galleryItems,
                                          currentIndex: index,
                                        })
                                      }
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`${project.title} gallery ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  )}
                                </div>
                              )})}
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-auto flex justify-end pt-2">
                          <Link to={`/project/${project.slug}`}>
                            <Button variant="outline" size="sm">
                              View Project →
                            </Button>
                          </Link>
                        </div>
                      </article>
                    )})}
                  </div>
                )}
              </div>
            )}

            <section className="mt-12 border-t pt-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Customer Reviews</h2>
              <p className="text-muted-foreground mb-6">
                Real feedback from clients who booked our landscaping services.
              </p>

              <ReviewList productSlug="landscaping-services" />

              <div className="mt-6">
                {user ? (
                  <Button onClick={() => setShowForm(true)}>Write a Review</Button>
                ) : (
                  <Button asChild>
                    <Link to="/auth">Log in to write a review</Link>
                  </Button>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your landscaping experience. Your review will be visible after admin approval.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm productSlug="landscaping-services" onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

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

export default LandscapingServicesPage;
