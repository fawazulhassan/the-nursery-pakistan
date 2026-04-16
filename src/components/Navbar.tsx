import { useState } from "react";
import { Search, ShoppingCart, User, Menu, LogOut, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/lib/constants";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Top Bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">
              The Nursery
            </div>
            <div className="hidden sm:block text-sm text-muted-foreground">Pakistan</div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search plants, pots, accessories..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative" title="Wishlist">
                <Heart className="h-5 w-5" />
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Button>
            </Link>
            {user ? (
              <>
                <Link to="/account" className="flex">
                  <Button variant="ghost" size="icon" title="My Account">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="hidden md:flex"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hidden md:flex"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon" title="Login or create account">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Categories + Mobile Account Links */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4">
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex md:items-center md:gap-1 py-2`}>
            {!user && (
              <div className="flex flex-col md:hidden border-b border-border pb-2 mb-2 gap-1">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-sm hover:text-primary">
                    <User className="h-4 w-4 mr-2" />
                    Login / Create Account
                  </Button>
                </Link>
              </div>
            )}
            {user && (
              <div className="flex flex-col md:hidden border-b border-border pb-2 mb-2 gap-1">
                <Link to="/account" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-sm hover:text-primary">
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </Button>
                </Link>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm hover:text-primary"
                    onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm hover:text-primary text-destructive"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="block"
              >
                <Button
                  variant="ghost"
                  className="w-full md:w-auto justify-start md:justify-center text-sm hover:text-primary"
                >
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
