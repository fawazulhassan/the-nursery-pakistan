import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb" className="mb-5">
    <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <li>
        <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Home
        </Link>
      </li>
      {items.map((item) => (
        <li key={`${item.label}-${item.to ?? "current"}`} className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          {item.to ? (
            <Link to={item.to} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;
