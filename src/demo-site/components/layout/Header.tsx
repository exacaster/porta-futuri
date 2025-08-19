import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, Phone, Wifi, Smartphone, Tv } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@contexts/CartContext';
import { productService } from '@services/productService';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Fetch categories for navigation
    productService.getCategories().then(setCategories);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('mobile') || lowerCategory.includes('phone')) return <Smartphone className="w-4 h-4" />;
    if (lowerCategory.includes('internet') || lowerCategory.includes('broadband')) return <Wifi className="w-4 h-4" />;
    if (lowerCategory.includes('tv') || lowerCategory.includes('television')) return <Tv className="w-4 h-4" />;
    return <Phone className="w-4 h-4" />;
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      {/* Top Bar */}
      <div className="bg-gradient-primary text-white py-2">
        <div className="container flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>📞 {t('features.support247')}: 1-800-TELECOM</span>
            <span className="hidden sm:inline">✉️ support@itelecom.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">🚀 {t('features.freeShipping')} - {t('features.ordersOver')}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">iTelecom</h1>
              <p className="text-xs text-gray-500">{t('hero.smartConnectivity')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
            >
              {t('nav.home')}
            </Link>
            
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-700 hover:text-[#6d02a3] transition-colors font-medium">
                {t('nav.products')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <Link 
                    to="/category/all" 
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#6d02a3] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {t('nav.allProducts')}
                  </Link>
                  {categories.slice(0, 5).map((category) => (
                    <Link
                      key={category}
                      to={`/category/${encodeURIComponent(category)}`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#6d02a3] transition-colors"
                    >
                      {getCategoryIcon(category)}
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link 
              to="/deals" 
              className="text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
            >
              {t('nav.deals')}
            </Link>
            <Link 
              to="/business" 
              className="text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
            >
              {t('nav.business')}
            </Link>
            <Link 
              to="/support" 
              className="text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
            >
              {t('nav.support')}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Search */}
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t('nav.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6d02a3] focus:ring-1 focus:ring-[#6d02a3]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6d02a3] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6d02a3] focus:ring-1 focus:ring-[#6d02a3]"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <nav className="container py-4 space-y-3">
            <Link
              to="/"
              className="block text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase">{t('nav.products')}</p>
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category}
                  to={`/category/${encodeURIComponent(category)}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#6d02a3] transition-colors pl-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {getCategoryIcon(category)}
                  {category}
                </Link>
              ))}
              <Link
                to="/category/all"
                className="flex items-center gap-2 text-gray-700 hover:text-[#6d02a3] transition-colors pl-4"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="w-4 h-4" />
                {t('nav.allProducts')}
              </Link>
            </div>

            <Link
              to="/deals"
              className="block text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.deals')}
            </Link>
            <Link
              to="/business"
              className="block text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.business')}
            </Link>
            <Link
              to="/support"
              className="block text-gray-700 hover:text-[#6d02a3] transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.support')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}