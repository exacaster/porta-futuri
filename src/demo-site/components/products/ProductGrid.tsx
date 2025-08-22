import React from "react";
import { ProductCard } from "./ProductCard";
import { ProductWithId } from "@services/productService";

interface ProductGridProps {
  products: ProductWithId[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = "No products found",
}: ProductGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-5 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-gray-200 rounded w-24" />
                <div className="h-9 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Product list variant for different layouts
export function ProductList({
  products,
  loading = false,
  emptyMessage = "No products found",
}: ProductGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card flex animate-pulse">
            <div className="w-48 h-48 bg-gray-200 rounded-l-lg" />
            <div className="flex-1 p-6 space-y-3">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-8 bg-gray-200 rounded w-32" />
                <div className="h-10 bg-gray-200 rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  // Product list
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductListItem key={product.id} product={product} />
      ))}
    </div>
  );
}

// Individual list item component
function ProductListItem({ product }: { product: ProductWithId }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div className="card flex flex-col sm:flex-row hover:shadow-lg transition-shadow duration-200">
      <div className="sm:w-48 h-48 bg-gray-100 rounded-t-lg sm:rounded-l-lg sm:rounded-t-none overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">📱</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-6">
        <div className="flex flex-col h-full">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          {product.features && product.features.length > 0 && (
            <ul className="text-sm text-gray-600 mb-3 space-y-1">
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-[#6d02a3] mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <div className="flex-1" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#6d02a3]">
                {formatPrice(product.price)}
              </p>
              {product.stock_status === "in_stock" && (
                <p className="text-sm text-green-600">In Stock</p>
              )}
            </div>
            <button className="btn-primary">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
