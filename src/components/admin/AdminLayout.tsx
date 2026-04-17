import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Leaf,
  Menu,
  MessageSquare,
  Package,
  PhoneCall,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: Leaf },
  { label: "Orders", to: "/admin/orders", icon: Package },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Reviews", to: "/admin/reviews", icon: MessageSquare },
  { label: "Projects", to: "/admin/landscaping-projects", icon: BriefcaseBusiness },
  { label: "Consultations", to: "/admin/consultation-requests", icon: PhoneCall },
  { label: "Workshops", to: "/admin/workshops", icon: CalendarDays },
  { label: "Workshop Slots", to: "/admin/workshop-slots", icon: Clock3 },
  { label: "Workshop Bookings", to: "/admin/workshop-bookings", icon: CalendarCheck2 },
  { label: "Blogs", to: "/admin/blogs", icon: BookOpenText },
  { label: "Subscribers", to: "/admin/subscribers", icon: Users },
];

interface AdminLayoutProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  contentClassName?: string;
  desktopMenuMode?: "inline" | "hamburger";
}

export default function AdminLayout({
  title,
  icon: Icon,
  children,
  contentClassName,
  desktopMenuMode = "inline",
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const navButtons = ADMIN_NAV_ITEMS.map((item) => {
    const ItemIcon = item.icon;
    const isActive = location.pathname === item.to;

    return (
      <Button
        key={item.to}
        variant={isActive ? "secondary" : "ghost"}
        className={cn("justify-start md:justify-center", isActive && "pointer-events-none")}
        asChild={!isActive}
      >
        {isActive ? (
          <span>
            <ItemIcon className="h-4 w-4 mr-2" />
            {item.label}
          </span>
        ) : (
          <Link to={item.to}>
            <ItemIcon className="h-4 w-4 mr-2" />
            {item.label}
          </Link>
        )}
      </Button>
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-4 md:px-6 shadow-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="h-8 w-8 flex-shrink-0" />
              <h1 className="text-2xl font-bold truncate">{title}</h1>
            </div>

            {desktopMenuMode === "inline" ? (
              <div className="hidden lg:flex items-center gap-2">
                {navButtons}
                <Button variant="secondary" asChild>
                  <Link to="/">Back to Store</Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/">Store</Link>
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label="Open admin menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:max-w-sm">
                    <SheetHeader>
                      <SheetTitle>Admin Navigation</SheetTitle>
                      <SheetDescription>Open the admin section you want to manage.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 flex flex-col gap-2">
                      {ADMIN_NAV_ITEMS.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                          <Button
                            key={item.to}
                            variant={isActive ? "secondary" : "ghost"}
                            className="justify-start"
                            asChild={!isActive}
                          >
                            {isActive ? (
                              <span>
                                <ItemIcon className="h-4 w-4 mr-2" />
                                {item.label}
                              </span>
                            ) : (
                              <Link to={item.to}>
                                <ItemIcon className="h-4 w-4 mr-2" />
                                {item.label}
                              </Link>
                            )}
                          </Button>
                        );
                      })}
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/">Back to Store</Link>
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <div className="lg:hidden flex items-center gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/">Store</Link>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="icon" aria-label="Open admin menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Admin Navigation</SheetTitle>
                    <SheetDescription>Open the admin section you want to manage.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-2">
                    {ADMIN_NAV_ITEMS.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <Button
                          key={item.to}
                          variant={isActive ? "secondary" : "ghost"}
                          className="justify-start"
                          asChild={!isActive}
                        >
                          {isActive ? (
                            <span>
                              <ItemIcon className="h-4 w-4 mr-2" />
                              {item.label}
                            </span>
                          ) : (
                            <Link to={item.to}>
                              <ItemIcon className="h-4 w-4 mr-2" />
                              {item.label}
                            </Link>
                          )}
                        </Button>
                      );
                    })}
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/">Back to Store</Link>
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className={cn("max-w-7xl mx-auto py-8 md:py-10 px-4 md:px-6", contentClassName)}>
        {children}
      </main>
    </div>
  );
}
