import { createClient } from "@supabase/supabase-js";
import type { Product } from "@shared/types/product.types";
import { sanitizeProduct } from "@shared/types/product.types";

// Initialize Supabase client
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProductWithId extends Product {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  searchTerm?: string;
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest";
}

export const productService = {
  /**
   * Get all products with optional filters
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductWithId[]> {
    try {
      let query = supabase.from("products").select("*");

      // Apply filters
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.subcategory) {
        query = query.eq("subcategory", filters.subcategory);
      }

      if (filters.brand) {
        query = query.eq("brand", filters.brand);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.inStockOnly) {
        query = query.neq("stock_status", "out_of_stock");
      }

      if (filters.searchTerm) {
        // Search in name, description, and brand
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,brand.ilike.%${filters.searchTerm}%`,
        );
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("name", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("updated_at", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }

      // Apply sanitization to all products
      return (data || []).map((product) => {
        const sanitized = sanitizeProduct(product);
        return {
          ...sanitized,
          id: product.id,
          created_at: product.created_at,
          updated_at: product.updated_at,
        };
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      return [];
    }
  },

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<ProductWithId | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        return null;
      }

      // Apply sanitization to parse metadata and comments
      const sanitized = sanitizeProduct(data);
      return {
        ...sanitized,
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return null;
    }
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<ProductWithId[]> {
    return this.getProducts({ category });
  },

  /**
   * Get featured products (limited to 8)
   */
  async getFeaturedProducts(): Promise<ProductWithId[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("stock_status", "out_of_stock")
        .order("updated_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("Error fetching featured products:", error);
        return [];
      }

      // Apply sanitization to all products
      return (data || []).map((product) => {
        const sanitized = sanitizeProduct(product);
        return {
          ...sanitized,
          id: product.id,
          created_at: product.created_at,
          updated_at: product.updated_at,
        };
      });
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
      return [];
    }
  },

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .order("category");

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      // Extract unique categories
      const categories = data
        ?.map((item) => item.category)
        .filter(
          (category, index, self) =>
            category && self.indexOf(category) === index,
        );

      return categories || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  },

  /**
   * Get all unique brands
   */
  async getBrands(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("brand")
        .order("brand");

      if (error) {
        console.error("Error fetching brands:", error);
        return [];
      }

      // Extract unique brands
      const brands = data
        ?.map((item) => item.brand)
        .filter((brand, index, self) => brand && self.indexOf(brand) === index);

      return brands || [];
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      return [];
    }
  },

  /**
   * Get related products (same category, different product)
   */
  async getRelatedProducts(
    productId: string,
    category: string,
    limit = 4,
  ): Promise<ProductWithId[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .neq("id", productId)
        .neq("stock_status", "out_of_stock")
        .limit(limit);

      if (error) {
        console.error("Error fetching related products:", error);
        return [];
      }

      // Apply sanitization to all products
      return (data || []).map((product) => {
        const sanitized = sanitizeProduct(product);
        return {
          ...sanitized,
          id: product.id,
          created_at: product.created_at,
          updated_at: product.updated_at,
        };
      });
    } catch (error) {
      console.error("Failed to fetch related products:", error);
      return [];
    }
  },

  /**
   * Search products by query
   */
  async searchProducts(query: string): Promise<ProductWithId[]> {
    return this.getProducts({ searchTerm: query });
  },

  /**
   * Get price range for all products
   */
  async getPriceRange(): Promise<{ min: number; max: number }> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("price")
        .order("price");

      if (error) {
        console.error("Error fetching price range:", error);
        return { min: 0, max: 1000 };
      }

      const prices = data?.map((item) => item.price) || [];

      return {
        min: Math.min(...prices, 0),
        max: Math.max(...prices, 1000),
      };
    } catch (error) {
      console.error("Failed to fetch price range:", error);
      return { min: 0, max: 1000 };
    }
  },
};
