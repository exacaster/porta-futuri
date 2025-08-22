import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@components/layout/Header";
import { Footer } from "@components/layout/Footer";
import { HomePage } from "@pages/HomePage";
import { CategoryPage } from "@pages/CategoryPage";
import { ProductPage } from "@pages/ProductPage";
import { CartPage } from "@pages/CartPage";
import { CartProvider } from "@contexts/CartContext";
import { PortaFuturiWidget } from "@components/PortaFuturiWidget";
import { Toaster, ToasterProvider } from "@/components/ui/Toaster";
import { initWidgetNavigationHandler } from "./utils/widgetIntegration";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const location = useLocation();
  
  useEffect(() => {
    // Send page view event to widget on route change
    const sendPageViewEvent = () => {
      // Dispatch a custom event that the widget can listen to
      const event = new CustomEvent('porta-futuri-page-view', {
        detail: {
          url: location.pathname,
          title: document.title
        }
      });
      window.dispatchEvent(event);
      
      // Also try to send via postMessage if widget is in iframe (for future)
      const iframe = document.querySelector('iframe#porta-futuri-widget');
      if (iframe && (iframe as HTMLIFrameElement).contentWindow) {
        (iframe as HTMLIFrameElement).contentWindow!.postMessage({
          type: 'porta-futuri-page-view',
          url: location.pathname,
          title: document.title
        }, '*');
      }
    };
    
    // Send event after a short delay to ensure page has loaded
    const timer = setTimeout(sendPageViewEvent, 100);
    return () => clearTimeout(timer);
  }, [location]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/category/:category"
                    element={<CategoryPage />}
                  />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/:category/:productName" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>
      <Footer />
      <PortaFuturiWidget />
      <Toaster />
    </div>
  );
}

export function App() {
  useEffect(() => {
    // Initialize widget navigation handler
    initWidgetNavigationHandler();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToasterProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </ToasterProvider>
    </QueryClientProvider>
  );
}
