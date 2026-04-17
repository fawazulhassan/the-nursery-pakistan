import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getProjectBySlug, type CompletedProjectRow } from "@/lib/landscapingProjects";

const ProjectPostPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [project, setProject] = useState<CompletedProjectRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
            <img src={project.cover_image_url} alt={project.title} className="w-full rounded-lg mb-8 max-h-[520px] object-cover" />
            <p className="text-muted-foreground mb-6">{project.description}</p>

            {galleryImages.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={`${project.id}-gallery-${index}`}
                      type="button"
                      className="w-full aspect-square rounded-md border overflow-hidden"
                      onClick={() => setLightboxImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${project.title} gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxImage ? (
            <img src={lightboxImage} alt="Project gallery fullscreen" className="w-full max-h-[80vh] object-contain rounded-md" />
          ) : null}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default ProjectPostPage;
