import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  Check,
  Truck,
  Shield,
  RefreshCw,
  Package,
  X,
} from "lucide-react";
import { ProductGrid } from "@components/products/ProductGrid";
import { ProductFeatures } from "@components/products/ProductFeatures";
import { ProductReviews } from "@components/products/ProductReviews";
import { productService } from "@services/productService";
import { useCartWithToast } from "@contexts/CartContext";

export function ProductPage() {
  const { id, category, productName } = useParams<{ id?: string; category?: string; productName?: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCartWithToast();
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "features" | "reviews"
  >("description");

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id, category, productName],
    queryFn: async () => {
      // If we have an ID, use it directly (old URL format)
      if (id) {
        return productService.getProductById(id);
      }
      
      // Otherwise, try to find by semantic URL (new format)
      if (category && productName) {
        const products = await productService.getProducts();
        const found = products.find((p: any) => {
          const pCategory = p.category.toLowerCase().replace(/\s+/g, '-');
          const pName = p.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
          return pCategory === category && pName === productName;
        });
        
        if (found) return found;
        
        // Fallback: productName might actually be an ID
        try {
          return await productService.getProductById(productName);
        } catch {
          return null;
        }
      }
      
      return null;
    },
    enabled: !!id || (!!category && !!productName),
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ["relatedProducts", product?.category, product?.id],
    queryFn: () => productService.getRelatedProducts(product!.id, product!.category, 4),
    enabled: !!product && !!product.id,
  });

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/category/all" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock_status === "out_of_stock";
  const isLimitedStock = product.stock_status === "limited";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#6d02a3]">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <Link
              to={`/category/${encodeURIComponent(product.category)}`}
              className="hover:text-[#6d02a3]"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="container py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#6d02a3] mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("product.backToProducts")}
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-8xl">📱</span>
                </div>
              )}
            </div>

            {/* Image Actions */}
            <div className="flex gap-4 mt-6">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4" />
                {t("product.addToWishlist")}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                {t("product.share")}
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Category & Brand */}
            <div className="flex items-center gap-4 mb-4">
              <span className="badge badge-primary">{product.category}</span>
              {product.brand && (
                <span className="badge bg-gray-800 text-white">
                  {product.brand}
                </span>
              )}
              {product.subcategory && (
                <span className="badge bg-gray-200 text-gray-700">
                  {product.subcategory}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            {product.ratings && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.ratings || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.ratings} out of 5 ({product.review_count || 0}{" "}
                  reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-[#6d02a3]">
                  {formatPrice(product.price)}
                </span>
                {/* You could add original price here if there's a discount */}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t("product.vatIncluded")}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_status === "in_stock" && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t("product.inStock")}</span>
                </div>
              )}
              {isLimitedStock && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">
                    {t("product.limitedStockOrder")}
                  </span>
                </div>
              )}
              {isOutOfStock && (
                <div className="flex items-center gap-2 text-red-600">
                  <X className="w-5 h-5" />
                  <span className="font-medium">{t("product.outOfStock")}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Quantity & Add to Cart */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  disabled={isOutOfStock}
                >
                  -
                </button>
                <span className="px-6 py-3 font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  disabled={isOutOfStock}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isInCart(product.id)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-[#6d02a3] hover:bg-[#4e0174] text-white"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock
                  ? t("product.outOfStock")
                  : isInCart(product.id)
                    ? t("product.addToCart")
                    : t("product.addToCart")}
              </button>
            </div>

            {/* Delivery Info */}
            <div className="space-y-3 py-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#6d02a3]" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("product.freeDelivery")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("product.freeDeliveryOrders")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#6d02a3]" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("product.dayReturns")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("product.easyReturns")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#6d02a3]" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("product.warranty")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("product.yearWarranty")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activeTab === "description"
                    ? "text-[#6d02a3] border-b-2 border-[#6d02a3]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t("product.description")}
              </button>
              {((product.features && product.features.length > 0) ||
                product.attributes) && (
                <button
                  onClick={() => setActiveTab("features")}
                  className={`pb-4 px-2 font-medium transition-colors relative ${
                    activeTab === "features"
                      ? "text-[#6d02a3] border-b-2 border-[#6d02a3]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("product.features")}
                </button>
              )}
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activeTab === "reviews"
                    ? "text-[#6d02a3] border-b-2 border-[#6d02a3]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t("product.reviews")} ({product.comments?.length || 0})
              </button>
            </div>
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-600">{product.description}</p>
                {product.product_id && (
                  <p className="text-sm text-gray-500 mt-4">
                    SKU: {product.product_id}
                  </p>
                )}
              </div>
            )}

            {activeTab === "features" && (
              <>
                {product.features && product.features.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {product.features.map((feature: any, index: any) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {product.attributes && (
                  <ProductFeatures attributes={product.attributes} />
                )}
              </>
            )}

            {activeTab === "reviews" &&
              (product.comments && product.comments.length > 0 ? (
                <ProductReviews
                  comments={product.comments}
                  productRating={product.ratings}
                  reviewCount={product.review_count}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("product.noReviews")}
                  </h3>
                  <p className="text-gray-600">{t("product.beFirstReview")}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {t("product.relatedProducts")}
            </h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
