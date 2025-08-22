import { useEffect, useState } from "react";
import { App as WidgetApp } from "../../widget/App";
import { productService } from "@services/productService";

export function PortaFuturiWidget() {
  const [products, setProducts] = useState<any[]>([]);
  
  // Create widget configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Load products from database
  useEffect(() => {
    if (!supabaseUrl) return;
    
    const loadProducts = async () => {
      try {
        const allProducts = await productService.getProducts();
        // Keep both id and product_id fields for compatibility
        const productsWithIds = allProducts.map(p => ({
          ...p,
          // Ensure product_id exists for AI matching
          product_id: p.product_id || p.id,
          // Keep the UUID id for navigation
          id: p.id
        }));
        setProducts(productsWithIds);
      } catch (error) {
        console.error("Failed to load products for widget:", error);
      }
    };
    loadProducts();
  }, [supabaseUrl]);

  // Don't render widget if Supabase URL is not configured
  if (!supabaseUrl) {
    console.warn(
      "PortaFuturiWidget: VITE_SUPABASE_URL environment variable is not set",
    );
    return null;
  }

  const widgetConfig = {
    apiKey: import.meta.env.VITE_WIDGET_API_KEY || "demo-api-key",
    apiUrl: `${supabaseUrl}/functions/v1/recommendations`,
    position: "bottom-right" as const,
    theme: {
      primaryColor: "#6d02a3",
    },
    data: {
      products: products,
    },
    navigation: {
      productUrlPattern: "/product/{id}",
      baseUrl: window.location.origin,
      openInNewTab: false,
    },
  };

  return <WidgetApp config={widgetConfig} />;
}

// Helper hook to interact with the widget
export function usePortaFuturiWidget() {
  const openWidget = () => {
    const event = new CustomEvent("porta-futuri-open");
    window.dispatchEvent(event);
  };

  const closeWidget = () => {
    const event = new CustomEvent("porta-futuri-close");
    window.dispatchEvent(event);
  };

  const sendContext = (context: any) => {
    const event = new CustomEvent("porta-futuri-context", {
      detail: context,
    });
    window.dispatchEvent(event);
  };

  return {
    openWidget,
    closeWidget,
    sendContext,
  };
}
