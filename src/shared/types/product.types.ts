export interface ProductComment {
  reviewer_name: string;
  rating: number;
  date: string;
  comment: string;
  helpful_count: number;
}

export interface Product {
  product_id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  description: string;
  features?: string[];
  stock_status: 'in_stock' | 'out_of_stock' | 'limited';
  image_url?: string;
  ratings?: number;
  review_count?: number;
  attributes?: Record<string, any>;  // Flexible attributes stored in metadata field
  comments?: ProductComment[];       // Customer reviews
}

export interface Recommendation extends Product {
  reasoning: string;
  match_score: number;
  position?: number;
}

export interface ProductCatalog {
  products: Product[];
  total: number;
  categories: string[];
  price_range: {
    min: number;
    max: number;
  };
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  in_stock_only?: boolean;
  min_rating?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  query: string;
}

export const isValidProduct = (data: any): data is Product => {
  return (
    typeof data === 'object' &&
    typeof data.product_id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.category === 'string' &&
    typeof data.price === 'number' &&
    typeof data.description === 'string' &&
    ['in_stock', 'out_of_stock', 'limited'].includes(data.stock_status)
  );
};

export const sanitizeComment = (raw: any): ProductComment => {
  return {
    reviewer_name: String(raw.reviewer_name || 'Anonymous'),
    rating: Number(raw.rating) || 0,
    date: String(raw.date || new Date().toISOString()),
    comment: String(raw.comment || ''),
    helpful_count: Number(raw.helpful_count) || 0
  };
};

export const sanitizeProduct = (raw: any): Product => {
  // Parse JSON fields if they are strings
  let attributes = raw.attributes || raw.metadata;
  if (typeof attributes === 'string') {
    try {
      attributes = JSON.parse(attributes);
    } catch {
      attributes = undefined;
    }
  }
  
  let comments = raw.comments;
  if (typeof comments === 'string') {
    try {
      comments = JSON.parse(comments);
    } catch {
      comments = undefined;
    }
  }
  
  return {
    product_id: String(raw.product_id || ''),
    name: String(raw.name || ''),
    category: String(raw.category || ''),
    subcategory: raw.subcategory ? String(raw.subcategory) : undefined,
    brand: raw.brand ? String(raw.brand) : undefined,
    price: Number(raw.price) || 0,
    description: String(raw.description || ''),
    features: Array.isArray(raw.features) ? raw.features.map(String) : undefined,
    stock_status: ['in_stock', 'out_of_stock', 'limited'].includes(raw.stock_status) 
      ? raw.stock_status 
      : 'out_of_stock',
    image_url: raw.image_url ? String(raw.image_url) : undefined,
    ratings: raw.ratings ? Number(raw.ratings) : undefined,
    review_count: raw.review_count ? Number(raw.review_count) : undefined,
    attributes: typeof attributes === 'object' && attributes !== null && !Array.isArray(attributes) 
      ? attributes 
      : undefined,
    comments: Array.isArray(comments) 
      ? comments.slice(0, 100).map(sanitizeComment) // Limit to 100 comments
      : undefined
  };
};