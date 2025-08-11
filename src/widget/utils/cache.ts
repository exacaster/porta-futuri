interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttlMinutes: number = 15) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access order (move to end) for LRU
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);
    
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Check if we need to evict items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    // Add new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {return false;}
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    let totalHits = 0;
    const now = Date.now();
    const entries: Array<{ key: string; hits: number; age: number }> = [];
    
    this.cache.forEach((entry, key) => {
      totalHits += entry.hits;
      entries.push({
        key,
        hits: entry.hits,
        age: now - entry.timestamp
      });
    });
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      entries: entries.sort((a, b) => b.hits - a.hits)
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });
    
    return removed;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    // Map maintains insertion order, so first item is oldest
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  /**
   * Get remaining TTL for a key
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) {return null;}
    
    const remaining = this.ttl - (Date.now() - entry.timestamp);
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Refresh TTL for a key
   */
  refresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {return false;}
    
    entry.timestamp = Date.now();
    return true;
  }
}

// Specialized cache for recommendations
export class RecommendationCache extends LRUCache<any> {
  constructor() {
    super(50, 15); // 50 entries, 15 minutes TTL
  }

  /**
   * Generate cache key for recommendations
   */
  generateKey(params: {
    query?: string;
    profileHash?: string;
    contextHash?: string;
    category?: string;
  }): string {
    const parts = [
      params.query || 'default',
      params.profileHash || 'no-profile',
      params.contextHash || 'no-context',
      params.category || 'all'
    ];
    
    return parts.join(':');
  }

  /**
   * Cache recommendation with metadata
   */
  setRecommendation(
    key: string,
    recommendations: any[],
    metadata: {
      responseTime: number;
      model: string;
      fallback: boolean;
    }
  ): void {
    this.set(key, {
      recommendations,
      metadata,
      cachedAt: new Date().toISOString()
    });
  }
}

// Singleton instances
export const recommendationCache = new RecommendationCache();
export const generalCache = new LRUCache<any>(100, 30); // 100 entries, 30 minutes TTL