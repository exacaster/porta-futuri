import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ProductWithId } from "@services/productService";
import { useToast } from "@/components/ui/Toaster";

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url?: string;
  brand?: string;
  stock_status?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductWithId, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "itelecom_cart";
const TAX_RATE = 0.21; // 21% VAT
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5.99;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on mount
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [items]);

  const addToCart = useCallback((product: ProductWithId, quantity = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        // Update quantity if item already exists
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        // Add new item to cart
        return [...currentItems, { ...product, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((item) => item.id === productId);
      return item?.quantity || 0;
    },
    [items],
  );

  const isInCart = useCallback(
    (productId: string) => {
      return items.some((item) => item.id === productId);
    },
    [items],
  );

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const totalPrice = subtotal + tax + shipping;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    totalItems,
    totalPrice,
    subtotal,
    tax,
    shipping,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// Enhanced cart hook with toast notifications
export const useCartWithToast = () => {
  const cart = useCart();
  const { addToast } = useToast();

  const addToCartWithToast = useCallback(
    (product: ProductWithId, quantity = 1) => {
      cart.addToCart(product, quantity);
      addToast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
        type: "success",
        duration: 3000,
      });
    },
    [cart, addToast],
  );

  const removeFromCartWithToast = useCallback(
    (productId: string) => {
      const item = cart.items.find((item) => item.id === productId);
      cart.removeFromCart(productId);
      if (item) {
        addToast({
          title: "Removed from cart",
          description: `${item.name} has been removed from your cart`,
          type: "info",
          duration: 3000,
        });
      }
    },
    [cart, addToast],
  );

  const clearCartWithToast = useCallback(() => {
    cart.clearCart();
    addToast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
      type: "info",
      duration: 3000,
    });
  }, [cart, addToast]);

  return {
    ...cart,
    addToCart: addToCartWithToast,
    removeFromCart: removeFromCartWithToast,
    clearCart: clearCartWithToast,
  };
};
