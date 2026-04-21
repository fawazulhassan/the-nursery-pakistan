import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedWorkshops, type WorkshopRow } from "@/lib/workshops";

const PAGE_SIZE = 12;

const formatWorkshopDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const WorkshopsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const page = useMemo(() => {
    const raw = Number.parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getPublishedWorkshops();
        setWorkshops(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const shouldPaginate = workshops.length > PAGE_SIZE;
  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(workshops.length / PAGE_SIZE)) : 1;
  const currentPage = shouldPaginate ? Math.min(page, totalPages) : 1;
  const visibleWorkshops = shouldPaginate
    ? workshops.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : workshops;

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
            <h1 className="text-3xl md:text-4xl font-bold">Our Floral Workshops</h1>
            <p className="text-muted-foreground mt-1">
              Learn the art of arrangement from our expert florists. A live, hands-on experience crafted for beginners
              and enthusiasts alike.
            </p>
          </div>
          <Link to="/flower-workshop">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Flower Workshop page
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/projects">Completed Projects</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/workshops">Floral Workshops</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading workshops...</div>
        ) : visibleWorkshops.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">No upcoming workshops at the moment — check back soon!</h2>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWorkshops.map((workshop) => (
              <Card key={workshop.id} className="overflow-hidden">
                <img src={workshop.cover_image_url} alt={workshop.title} className="h-44 w-full object-cover" />
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground mb-2">{formatWorkshopDate(workshop.workshop_date)}</p>
                  <h2 className="font-bold text-lg mb-2 line-clamp-2">{workshop.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{workshop.description}</p>
                  <Link to={`/workshop/${workshop.slug}`}>
                    <Button variant="outline" size="sm">
                      Explore Workshop →
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

export default WorkshopsPage;
