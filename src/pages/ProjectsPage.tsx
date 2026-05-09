import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedProjects, type CompletedProjectRow } from "@/lib/landscapingProjects";

const PAGE_SIZE = 12;

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<CompletedProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const page = useMemo(() => {
    const raw = Number.parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getPublishedProjects();
        setProjects(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const shouldPaginate = projects.length > PAGE_SIZE;
  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(projects.length / PAGE_SIZE)) : 1;
  const currentPage = shouldPaginate ? Math.min(page, totalPages) : 1;
  const visibleProjects = shouldPaginate
    ? projects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : projects;

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (!shouldPaginate || nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Completed Projects</h1>
            <p className="text-muted-foreground mt-1">Explore our landscaping transformations and project showcases.</p>
          </div>
          <Link to="/landscaping-services">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Landscaping Services
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <Button asChild size="sm">
            <Link to="/projects">Completed Projects</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/workshops">Previous Workshops</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading projects...</div>
        ) : visibleProjects.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">Projects coming soon — check back shortly.</h2>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <Link to={`/project/${project.slug}`} className="block overflow-hidden">
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                </Link>
                <CardContent className="p-5">
                  <Link to={`/project/${project.slug}`}>
                    <h2 className="font-bold text-lg mb-2 line-clamp-2">{project.title}</h2>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{project.description}</p>
                  <Link to={`/project/${project.slug}`}>
                    <Button variant="outline" size="sm">
                      View Project →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {shouldPaginate && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              onClick={() => updatePage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => updatePage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProjectsPage;
