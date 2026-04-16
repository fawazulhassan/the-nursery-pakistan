import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { resolvePrimaryProductImage } from "@/lib/productImages";

const WISHLIST_STORAGE_KEY = "leafy-luxe-wishlist";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description?: string;
  sale_percentage?: number;
  stock_quantity?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  toggleWishlist: (product: (Partial<WishlistItem> & { id: string; name: string }) & { image_urls?: string[] | null }) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const mapToWishlistItem = (product: (Partial<WishlistItem> & { id: string; name: string }) & { image_urls?: string[] | null }): WishlistItem => ({
  id: product.id,
  name: product.name,
  price: Number(product.price ?? 0),
  image_url: resolvePrimaryProductImage(product),
  category: product.category ?? "Uncategorized",
  description: product.description,
  sale_percentage: product.sale_percentage,
  stock_quantity: product.stock_quantity,
});

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!stored) {
        setWishlistItems([]);
        return;
      }

      const parsed = JSON.parse(stored);
      setWishlistItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setWishlistItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const isInWishlist = (productId: string) =>
    wishlistItems.some((item) => item.id === productId);

  const toggleWishlist = (product: (Partial<WishlistItem> & { id: string; name: string }) & { image_urls?: string[] | null }) => {
    const mappedItem = mapToWishlistItem(product);

    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === mappedItem.id);

      if (exists) {
        toast({
          title: "Removed from wishlist",
          description: `${mappedItem.name} has been removed from your wishlist.`,
        });
        return prev.filter((item) => item.id !== mappedItem.id);
      }

      toast({
        title: "Added to wishlist",
        description: `${mappedItem.name} has been added to your wishlist.`,
      });
      return [...prev, mappedItem];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const getWishlistCount = () => wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
