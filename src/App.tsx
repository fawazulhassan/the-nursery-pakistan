import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import ScrollToTop from "@/components/ScrollToTop";
import { SeoProvider } from "@/components/SeoManager";
import { lazy, Suspense } from "react";

const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminReviewsPage = lazy(() => import("./pages/AdminReviewsPage"));
const AdminBlogsPage = lazy(() => import("./pages/AdminBlogsPage"));
const AdminSubscribersPage = lazy(() => import("./pages/AdminSubscribersPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const LandscapingServicesPage = lazy(() => import("./pages/LandscapingServicesPage"));
const ConsultationRequestPage = lazy(() => import("./pages/ConsultationRequestPage"));
const FlowerWorkshopPage = lazy(() => import("./pages/FlowerWorkshopPage"));
const WorkshopsPage = lazy(() => import("./pages/WorkshopsPage"));
const WorkshopPostPage = lazy(() => import("./pages/WorkshopPostPage"));
const BlogsPage = lazy(() => import("./pages/BlogsPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectPostPage = lazy(() => import("./pages/ProjectPostPage"));
const AdminLandscapingProjectsPage = lazy(() => import("./pages/AdminLandscapingProjectsPage"));
const AdminConsultationRequestsPage = lazy(() => import("./pages/AdminConsultationRequestsPage"));
const AdminWorkshopsPage = lazy(() => import("./pages/AdminWorkshopsPage"));
const AdminWorkshopSlotsPage = lazy(() => import("./pages/AdminWorkshopSlotsPage"));
const AdminWorkshopBookingsPage = lazy(() => import("./pages/AdminWorkshopBookingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to auth with return URL
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center" aria-live="polite">
          <span className="text-muted-foreground">Loading page...</span>
        </main>
      }
    >
      <Routes>
      {/* Public routes - accessible without login */}
      <Route path="/" element={<Index />} />
      <Route path="/category/:category" element={<CategoryPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/landscaping-services" element={<LandscapingServicesPage />} />
      <Route path="/landscaping-services/request-consultation" element={<ConsultationRequestPage />} />
      <Route path="/flower-workshop" element={<FlowerWorkshopPage />} />
      <Route path="/workshops" element={<WorkshopsPage />} />
      <Route path="/workshop/:slug" element={<WorkshopPostPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/project/:slug" element={<ProjectPostPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      
      {/* Admin routes - require admin role */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute adminOnly><AdminReviewsPage /></ProtectedRoute>} />
      <Route path="/admin/landscaping-projects" element={<ProtectedRoute adminOnly><AdminLandscapingProjectsPage /></ProtectedRoute>} />
      <Route path="/admin/consultation-requests" element={<ProtectedRoute adminOnly><AdminConsultationRequestsPage /></ProtectedRoute>} />
      <Route path="/admin/workshops" element={<ProtectedRoute adminOnly><AdminWorkshopsPage /></ProtectedRoute>} />
      <Route path="/admin/workshop-slots" element={<ProtectedRoute adminOnly><AdminWorkshopSlotsPage /></ProtectedRoute>} />
      <Route path="/admin/workshop-bookings" element={<ProtectedRoute adminOnly><AdminWorkshopBookingsPage /></ProtectedRoute>} />
      <Route path="/admin/blogs" element={<ProtectedRoute adminOnly><AdminBlogsPage /></ProtectedRoute>} />
      <Route path="/admin/subscribers" element={<ProtectedRoute adminOnly><AdminSubscribersPage /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SeoProvider>
                <ScrollToTop />
                <AppRoutes />
                <WhatsAppFloatingButton />
              </SeoProvider>
            </BrowserRouter>
            <Analytics />
            <SpeedInsights />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
