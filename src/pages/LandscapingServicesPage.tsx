import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

const LandscapingServicesPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState<CompletedProjectRow[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
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
                  Welcome, I&apos;m Landscaping Services
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Welcome, I&apos;m [Designer Name], Lead Landscape Architect at The Nursery. We specialize in crafting
                  personalized outdoor sanctuaries that blend nature with your lifestyle.
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
                  src="https://images.unsplash.com/photo-1600240644455-3edc55c375fe?auto=format&fit=crop&w=1200&q=80"
                  alt="Landscaped garden pathway"
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
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold">{featuredProject.title}</h3>
                      <p className="text-muted-foreground">{featuredProject.description}</p>
                      {featuredProject.gallery_image_urls?.length ? (
                        <div>
                          <p className="font-medium text-sm mb-2">Gallery</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {featuredProject.gallery_image_urls.map((imageUrl, index) => (
                              <div
                                key={`${featuredProject.id}-gallery-${index}`}
                                className="w-full aspect-square rounded-md border bg-muted/40 overflow-hidden"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`${featuredProject.title} gallery ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                )}

                {remainingProjects.length > 0 && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {remainingProjects.map((project) => (
                      <article key={project.id} className="rounded-xl border bg-card p-4 space-y-3">
                        <img
                          src={project.cover_image_url}
                          alt={project.title}
                          className="w-full h-44 object-cover rounded-md"
                        />
                        <h3 className="text-xl font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        {project.gallery_image_urls?.length ? (
                          <div>
                            <p className="font-medium text-sm mb-2">Gallery</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {project.gallery_image_urls.map((imageUrl, index) => (
                                <div
                                  key={`${project.id}-gallery-${index}`}
                                  className="w-full aspect-square rounded-md border bg-muted/40 overflow-hidden"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`${project.title} gallery ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your landscaping experience. Your review will be visible after admin approval.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm productSlug="landscaping-services" onSuccess={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default LandscapingServicesPage;
