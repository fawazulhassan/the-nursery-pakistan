import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const CART_STORAGE_BASE_KEY = "leafy-luxe-cart";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  description?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => string;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Unique storage key for each user. If not logged in, use a guest key.
  const storageKey = user ? `${CART_STORAGE_BASE_KEY}-${user.id}` : `${CART_STORAGE_BASE_KEY}-guest`;

  // Load cart when user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCartItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }
  }, [storageKey]);

  // Save cart when items change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      // Ensure price is formatted as string
      const formattedItem = {
        ...item,
        price: typeof item.price === 'string' ? item.price : `Rs ${item.price}`,
        quantity
      };
      return [...prev, formattedItem];
    });
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((sum, item) => {
      let price = 0;
      if (typeof item.price === 'string') {
        // Remove "Rs" and any non-numeric/non-decimal characters, then parse float
        // Updated regex to keep the decimal point
        const cleanPrice = item.price.replace(/[^0-9.]/g, "");
        price = parseFloat(cleanPrice);
      } else {
        price = item.price;
      }

      // Safety check if parsing failed
      if (isNaN(price)) price = 0;

      return sum + price * item.quantity;
    }, 0);

    // Format back to locale string with max 2 decimals if needed
    return `Rs ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
