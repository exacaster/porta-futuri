import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Zap, Shield, Headphones, Truck, Phone, Wifi, Tv, Briefcase, Speaker, Home, Satellite, Watch, Laptop, Tablet } from 'lucide-react';
import { ProductGrid } from '@components/products/ProductGrid';
import { productService } from '@services/productService';

export function HomePage() {
  const { t } = useTranslation();
  
  // Helper function to get icon for category
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    // Map Lithuanian category names to icons
    if (categoryLower.includes('telefon') || categoryLower.includes('phone')) {
      return <Phone className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('ausinės') || categoryLower.includes('ausines') || categoryLower.includes('headphone')) {
      return <Headphones className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('garso') || categoryLower.includes('kolonėlės') || categoryLower.includes('koloneles') || categoryLower.includes('speaker')) {
      return <Speaker className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('planšet') || categoryLower.includes('planset') || categoryLower.includes('tablet')) {
      return <Tablet className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('kompiuter') || categoryLower.includes('nešiojam') || categoryLower.includes('nesiojam') || categoryLower.includes('laptop')) {
      return <Laptop className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('laikrod') || categoryLower.includes('išman') || categoryLower.includes('isman') || categoryLower.includes('watch') || categoryLower.includes('smart')) {
      return <Watch className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('internet') || categoryLower.includes('wifi')) {
      return <Wifi className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('tv') || categoryLower.includes('televizor')) {
      return <Tv className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('verslo') || categoryLower.includes('business')) {
      return <Briefcase className="w-12 h-12 text-[#6d02a3]" />;
    }
    if (categoryLower.includes('namai') || categoryLower.includes('home')) {
      return <Home className="w-12 h-12 text-[#6d02a3]" />;
    }
    
    // Default fallback icon
    return <Satellite className="w-12 h-12 text-[#6d02a3]" />;
  };
  
  // Fetch featured products
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeaturedProducts(),
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-primary text-white">
        <div className="container py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-white/90">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/category/all" className="btn-secondary bg-white hover:bg-gray-100 text-[#6d02a3] px-8 py-3 text-lg font-semibold rounded-lg inline-flex items-center justify-center">
                  {t('hero.shopNow')}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/business" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold rounded-lg inline-flex items-center justify-center transition-colors">
                  {t('hero.businessSolutions')}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/10 backdrop-blur rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">📱</div>
                  <p className="text-2xl font-semibold">{t('hero.smartConnectivity')}</p>
                  <p className="text-white/80 mt-2">{t('hero.poweredByAI')}</p>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white text-[#6d02a3] px-4 py-2 rounded-full font-semibold shadow-lg">
                5G Ready
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#b12df4] text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                AI Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6d02a3]/10 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#6d02a3]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('features.freeShipping')}</p>
                <p className="text-sm text-gray-600">{t('features.ordersOver')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6d02a3]/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#6d02a3]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('features.fastSetup')}</p>
                <p className="text-sm text-gray-600">{t('features.sameDayActivation')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6d02a3]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#6d02a3]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('features.secure')}</p>
                <p className="text-sm text-gray-600">{t('features.protectedPayments')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6d02a3]/10 rounded-lg flex items-center justify-center">
                <Headphones className="w-6 h-6 text-[#6d02a3]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('features.support247')}</p>
                <p className="text-sm text-gray-600">{t('features.alwaysHere')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('sections.shopByCategory')}</h2>
              <p className="text-lg text-gray-600">{t('sections.findPerfectSolution')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category}
                  to={`/category/${encodeURIComponent(category)}`}
                  className="group"
                >
                  <div className="card hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1">
                    <div className="aspect-square bg-gradient-to-br from-[#6d02a3]/10 to-[#b12df4]/10 rounded-t-lg flex items-center justify-center">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#6d02a3] transition-colors">
                        {category}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{t('product.exploreProducts')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('sections.featuredProducts')}</h2>
              <p className="text-lg text-gray-600">{t('sections.handpickedSelections')}</p>
            </div>
            <Link
              to="/category/all"
              className="hidden sm:flex items-center gap-2 text-[#6d02a3] hover:text-[#4e0174] font-semibold transition-colors"
            >
              {t('sections.viewAll')}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts || []} loading={loadingFeatured} />
          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 text-[#6d02a3] hover:text-[#4e0174] font-semibold transition-colors"
            >
              {t('nav.allProducts')}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-16">
        <div className="container">
          <div className="bg-gradient-primary rounded-2xl p-8 lg:p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">
                  {t('ai.title')}
                </h3>
                <p className="text-lg text-white/90 mb-6">
                  {t('ai.description')}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <span className="font-semibold">{t('ai.smartAssistant')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <span className="font-semibold">{t('ai.instantHelp')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <span className="font-semibold">{t('ai.personalized')}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl font-semibold mb-2">{t('ai.chatWithAI')}</p>
                  <p className="text-white/80 mb-4">{t('ai.available247')}</p>
                  <button
                    onClick={() => {
                      // The widget should be visible and can be triggered
                      const event = new CustomEvent('porta-futuri-open');
                      window.dispatchEvent(event);
                    }}
                    className="bg-white text-[#6d02a3] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {t('ai.startChat')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('newsletter.title')}
            </h3>
            <p className="text-gray-600 mb-8">
              {t('newsletter.subtitle')}
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('newsletter.emailPlaceholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6d02a3] focus:ring-1 focus:ring-[#6d02a3]"
              />
              <button
                type="submit"
                className="btn-primary px-8 py-3 font-semibold"
              >
                {t('newsletter.subscribe')}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              {t('newsletter.privacyNote')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}