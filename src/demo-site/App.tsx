import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@components/layout/Header';
import { Footer } from '@components/layout/Footer';
import { HomePage } from '@pages/HomePage';
import { CategoryPage } from '@pages/CategoryPage';
import { ProductPage } from '@pages/ProductPage';
import { CartPage } from '@pages/CartPage';
import { CartProvider } from '@contexts/CartContext';
import { PortaFuturiWidget } from '@components/PortaFuturiWidget';
import { Toaster, ToasterProvider } from '@/components/ui/Toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToasterProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                </Routes>
              </main>
              <Footer />
              <PortaFuturiWidget />
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </ToasterProvider>
    </QueryClientProvider>
  );
}