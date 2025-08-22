import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Eye, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@contexts/CartContext";
import { ProductWithId } from "@services/productService";
import { useFormatters } from "@utils/formatters";

interface ProductCardProps {
  product: ProductWithId;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { formatPrice } = useFormatters();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  const getStockBadge = () => {
    switch (product.stock_status) {
      case "in_stock":
        return (
          <span className="badge badge-success">{t("product.inStock")}</span>
        );
      case "limited":
        return (
          <span className="badge badge-warning">
            {t("product.limitedStock")}
          </span>
        );
      case "out_of_stock":
        return (
          <span className="badge badge-error">{t("product.outOfStock")}</span>
        );
      default:
        return null;
    }
  };

  const isOutOfStock = product.stock_status === "out_of_stock";

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="card h-full flex flex-col hover:shadow-lg transition-all duration-200">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl">📱</span>
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200">
            <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                aria-label={t("product.quickView")}
                onClick={(e) => e.preventDefault()}
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
              <button
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                aria-label={t("product.addToWishlist")}
                onClick={(e) => e.preventDefault()}
              >
                <Heart className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 space-y-2">
            {product.subcategory && (
              <span className="badge badge-primary">{product.subcategory}</span>
            )}
            {product.brand && (
              <span className="badge bg-gray-800 text-white">
                {product.brand}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Category */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category}
          </p>

          {/* Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#6d02a3] transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Rating */}
          {product.ratings && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.ratings || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.ratings} ({product.review_count || 0})
              </span>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="mb-3">
              <ul className="text-xs text-gray-600 space-y-1">
                {product.features.slice(0, 2).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[#6d02a3] mr-1">•</span>
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stock Status */}
          <div className="mb-3">{getStockBadge()}</div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-[#6d02a3]">
                {formatPrice(product.price)}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#6d02a3] hover:bg-[#4e0174] text-white hover:shadow-md"
                }
              `}
              aria-label={
                isOutOfStock ? t("product.outOfStock") : t("product.addToCart")
              }
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isOutOfStock ? t("product.outOfStock") : t("product.add")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
