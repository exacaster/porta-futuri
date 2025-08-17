import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, Grid, List, ChevronDown } from 'lucide-react';
import { ProductGrid, ProductList } from '@components/products/ProductGrid';
import { productService, ProductFilters } from '@services/productService';

type ViewMode = 'grid' | 'list';
type SortOption = ProductFilters['sortBy'];

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ProductFilters>({
    category: category === 'all' ? undefined : category,
    sortBy: 'newest',
  });

  // Update filters when category changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category,
    }));
  }, [category]);

  // Fetch products with filters
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });

  // Fetch categories for filter sidebar
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  // Fetch brands for filter sidebar
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => productService.getBrands(),
  });

  // Fetch price range
  const { data: priceRange } = useQuery({
    queryKey: ['priceRange'],
    queryFn: () => productService.getPriceRange(),
  });

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setFilters(prev => ({ ...prev, sortBy: newSort }));
  };

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      category: category === 'all' ? undefined : category,
      sortBy: 'newest',
    });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
  ];

  const displayCategory = category === 'all' ? 'All Products' : category;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-[#6d02a3]">Home</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{displayCategory}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayCategory}</h1>
          <p className="text-gray-600">
            {products?.length || 0} products available
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 hover:bg-gray-50 cursor-pointer"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#6d02a3] hover:text-[#4e0174]"
                >
                  Clear all
                </button>
              </div>

              {/* Category Filter */}
              {categories && categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.category}
                        onChange={() => handleFilterChange({ category: undefined })}
                        className="mr-2 text-[#6d02a3] focus:ring-[#6d02a3]"
                      />
                      <span className="text-sm text-gray-700">All Categories</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === cat}
                          onChange={() => handleFilterChange({ category: cat })}
                          className="mr-2 text-[#6d02a3] focus:ring-[#6d02a3]"
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Filter */}
              {brands && brands.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Brand</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.brand === brand}
                          onChange={(e) => handleFilterChange({ 
                            brand: e.target.checked ? brand : undefined 
                          })}
                          className="mr-2 text-[#6d02a3] focus:ring-[#6d02a3] rounded"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              {priceRange && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Min Price (€)</label>
                      <input
                        type="number"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={filters.minPrice || ''}
                        onChange={(e) => handleFilterChange({ 
                          minPrice: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6d02a3]"
                        placeholder={`${priceRange.min}`}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Max Price (€)</label>
                      <input
                        type="number"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={filters.maxPrice || ''}
                        onChange={(e) => handleFilterChange({ 
                          maxPrice: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6d02a3]"
                        placeholder={`${priceRange.max}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Status Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly || false}
                    onChange={(e) => handleFilterChange({ inStockOnly: e.target.checked })}
                    className="mr-2 text-[#6d02a3] focus:ring-[#6d02a3] rounded"
                  />
                  <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid/List */}
          <div className="lg:col-span-3">
            {viewMode === 'grid' ? (
              <ProductGrid
                products={products || []}
                loading={isLoading}
                emptyMessage={`No products found in ${displayCategory}`}
              />
            ) : (
              <ProductList
                products={products || []}
                loading={isLoading}
                emptyMessage={`No products found in ${displayCategory}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}