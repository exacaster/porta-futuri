interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    if (!entry) {return null;}
    return entry.resetTime;
  }

  /**
   * Reset limits for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.limits.delete(key);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(key: string): Record<string, string> {
    const remaining = this.getRemaining(key);
    const resetTime = this.getResetTime(key);

    return {
      'X-RateLimit-Limit': String(this.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': resetTime ? String(Math.floor(resetTime / 1000)) : String(Date.now() / 1000)
    };
  }
}

// Request queue for handling rate limited requests
export class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
    timestamp: number;
  }> = [];
  private processing = false;
  private readonly maxConcurrent: number;
  private activeRequests = 0;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add request to queue
   */
  async add<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      this.queue.push({
        id,
        fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      });

      // Sort by priority (higher first) then by timestamp (older first)
      this.queue.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.processing = true;
    this.activeRequests++;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeRequests--;
      this.processing = false;
      
      // Process next item
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    activeRequests: number;
    maxConcurrent: number;
  } {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Exponential backoff utility
export class ExponentialBackoff {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly factor: number;

  constructor(options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}) {
    this.maxAttempts = options.maxAttempts || 5;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.factor = options.factor || 2;
  }

  /**
   * Get next delay
   */
  getNextDelay(): number | null {
    if (this.attempt >= this.maxAttempts) {
      return null;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(this.factor, this.attempt),
      this.maxDelay
    );

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    
    this.attempt++;
    return Math.floor(delay + jitter);
  }

  /**
   * Reset backoff
   */
  reset(): void {
    this.attempt = 0;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attempt);
  }

  /**
   * Execute function with backoff
   */
  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry?: (error: any) => boolean
  ): Promise<T> {
    this.reset();

    while (true) {
      try {
        return await fn();
      } catch (error) {
        const delay = this.getNextDelay();
        
        if (!delay || (shouldRetry && !shouldRetry(error))) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Singleton instances
export const apiRateLimiter = new RateLimiter(100, 1); // 100 requests per minute
export const requestQueue = new RequestQueue(3); // Max 3 concurrent requests
export const backoff = new ExponentialBackoff();