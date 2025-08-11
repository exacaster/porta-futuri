import Papa from 'papaparse';
import { 
  Product, 
  CustomerProfile, 
  ContextEvent,
  sanitizeProduct,
  sanitizeCustomerProfile,
  sanitizeContextEvent,
  isValidProduct,
  isValidCustomerProfile,
  isValidContextEvent
} from '@shared/types';
import { CSVParseResult, CSVParseError } from '@api/types/api.types';

export class CSVProcessor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_PRODUCTS = 10000;
  private readonly MAX_CONTEXT_EVENTS = 500;
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Process product catalog CSV
   */
  async processProductCSV(file: File): Promise<CSVParseResult<Product>> {
    const cacheKey = `products_${file.name}_${file.size}_${file.lastModified}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {return cached;}

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        data: [],
        errors: [{
          type: 'TooManyFields',
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          row: 0
        }],
        meta: this.getEmptyMeta()
      };
    }

    return new Promise((resolve) => {
      const products: Product[] = [];
      const errors: CSVParseError[] = [];
      let rowCount = 0;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        worker: true, // Use web worker for performance
        chunk: (results) => {
          results.data.forEach((row: any) => {
            rowCount++;
            
            // Skip if we've reached the limit
            if (products.length >= this.MAX_PRODUCTS) {
              return;
            }

            // Validate required fields
            if (!row.product_id || !row.name || !row.category || row.price === undefined || !row.description) {
              errors.push({
                type: 'MissingRequiredField',
                code: 'MISSING_FIELD',
                message: 'Missing required field(s)',
                row: rowCount,
                field: !row.product_id ? 'product_id' : !row.name ? 'name' : !row.category ? 'category' : !row.description ? 'description' : 'price'
              });
              return;
            }

            try {
              const product = sanitizeProduct(row);
              if (isValidProduct(product)) {
                products.push(product);
              } else {
                errors.push({
                  type: 'InvalidValue',
                  code: 'INVALID_PRODUCT',
                  message: 'Invalid product data',
                  row: rowCount
                });
              }
            } catch (error) {
              errors.push({
                type: 'InvalidValue',
                code: 'PARSE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to parse product',
                row: rowCount
              });
            }
          });
        },
        complete: (results) => {
          const result = {
            data: products,
            errors,
            meta: {
              fields: results.meta.fields || [],
              delimiter: results.meta.delimiter || ',',
              linebreak: results.meta.linebreak || '\n',
              aborted: results.meta.aborted || false,
              truncated: products.length >= this.MAX_PRODUCTS
            }
          };
          
          this.setCache(cacheKey, result);
          resolve(result);
        },
        error: (error) => {
          resolve({
            data: [],
            errors: [{
              type: 'InvalidValue',
              code: 'PARSE_ERROR',
              message: error.message,
              row: 0
            }],
            meta: this.getEmptyMeta()
          });
        }
      });
    });
  }

  /**
   * Process customer profile CSV
   */
  async processCustomerCSV(file: File): Promise<CSVParseResult<CustomerProfile>> {
    const cacheKey = `customer_${file.name}_${file.size}_${file.lastModified}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {return cached;}

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        data: [],
        errors: [{
          type: 'TooManyFields',
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          row: 0
        }],
        meta: this.getEmptyMeta()
      };
    }

    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: CSVParseError[] = [];
          const profiles: CustomerProfile[] = [];

          // Process only the first row for customer profile
          if (results.data.length > 0) {
            const row = results.data[0] as any;
            
            if (!row.customer_id) {
              errors.push({
                type: 'MissingRequiredField',
                code: 'MISSING_CUSTOMER_ID',
                message: 'customer_id is required',
                row: 1,
                field: 'customer_id'
              });
            } else {
              try {
                const profile = sanitizeCustomerProfile(row);
                if (isValidCustomerProfile(profile)) {
                  profiles.push(profile);
                } else {
                  errors.push({
                    type: 'InvalidValue',
                    code: 'INVALID_PROFILE',
                    message: 'Invalid customer profile data',
                    row: 1
                  });
                }
              } catch (error) {
                errors.push({
                  type: 'InvalidValue',
                  code: 'PARSE_ERROR',
                  message: error instanceof Error ? error.message : 'Failed to parse profile',
                  row: 1
                });
              }
            }
          }

          const result = {
            data: profiles,
            errors,
            meta: {
              fields: results.meta.fields || [],
              delimiter: results.meta.delimiter || ',',
              linebreak: results.meta.linebreak || '\n',
              aborted: results.meta.aborted || false,
              truncated: false
            }
          };
          
          this.setCache(cacheKey, result);
          resolve(result);
        },
        error: (error) => {
          resolve({
            data: [],
            errors: [{
              type: 'InvalidValue',
              code: 'PARSE_ERROR',
              message: error.message,
              row: 0
            }],
            meta: this.getEmptyMeta()
          });
        }
      });
    });
  }

  /**
   * Process context events CSV
   */
  async processContextCSV(file: File): Promise<CSVParseResult<ContextEvent>> {
    const cacheKey = `context_${file.name}_${file.size}_${file.lastModified}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {return cached;}

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        data: [],
        errors: [{
          type: 'TooManyFields',
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          row: 0
        }],
        meta: this.getEmptyMeta()
      };
    }

    return new Promise((resolve) => {
      const events: ContextEvent[] = [];
      const errors: CSVParseError[] = [];
      let rowCount = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        worker: true,
        chunk: (results) => {
          results.data.forEach((row: any) => {
            rowCount++;
            
            // Skip if we've reached the limit
            if (events.length >= this.MAX_CONTEXT_EVENTS) {
              return;
            }

            // Validate required fields
            if (!row.timestamp || !row.event_type) {
              errors.push({
                type: 'MissingRequiredField',
                code: 'MISSING_FIELD',
                message: 'Missing required field(s)',
                row: rowCount,
                field: !row.timestamp ? 'timestamp' : 'event_type'
              });
              return;
            }

            try {
              // Add session_id if missing
              if (!row.session_id) {
                row.session_id = 'default_session';
              }

              const event = sanitizeContextEvent(row);
              
              // Filter events older than 30 days
              const eventDate = new Date(event.timestamp);
              if (eventDate < thirtyDaysAgo) {
                return;
              }

              if (isValidContextEvent(event)) {
                events.push(event);
              } else {
                errors.push({
                  type: 'InvalidValue',
                  code: 'INVALID_EVENT',
                  message: 'Invalid context event data',
                  row: rowCount
                });
              }
            } catch (error) {
              errors.push({
                type: 'InvalidValue',
                code: 'PARSE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to parse event',
                row: rowCount
              });
            }
          });
        },
        complete: (results) => {
          // Sort events by timestamp (most recent first)
          events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          // Take only the most recent events up to the limit
          const limitedEvents = events.slice(0, this.MAX_CONTEXT_EVENTS);

          const result = {
            data: limitedEvents,
            errors,
            meta: {
              fields: results.meta.fields || [],
              delimiter: results.meta.delimiter || ',',
              linebreak: results.meta.linebreak || '\n',
              aborted: results.meta.aborted || false,
              truncated: events.length > this.MAX_CONTEXT_EVENTS
            }
          };
          
          this.setCache(cacheKey, result);
          resolve(result);
        },
        error: (error) => {
          resolve({
            data: [],
            errors: [{
              type: 'InvalidValue',
              code: 'PARSE_ERROR',
              message: error.message,
              row: 0
            }],
            meta: this.getEmptyMeta()
          });
        }
      });
    });
  }

  /**
   * Calculate hash for CSV content (for caching)
   */
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSV structure before processing
   */
  async validateCSVStructure(file: File, requiredFields: string[]): Promise<{ valid: boolean; errors: string[] }> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        preview: 1, // Only parse first row to get headers
        header: true,
        complete: (results) => {
          const fields = results.meta.fields || [];
          const errors: string[] = [];
          
          requiredFields.forEach(field => {
            if (!fields.includes(field)) {
              errors.push(`Missing required field: ${field}`);
            }
          });
          
          resolve({
            valid: errors.length === 0,
            errors
          });
        },
        error: () => {
          resolve({
            valid: false,
            errors: ['Invalid CSV format']
          });
        }
      });
    });
  }

  /**
   * Get processing progress for large files
   */
  getProcessingProgress(bytesProcessed: number, totalBytes: number): number {
    return Math.round((bytesProcessed / totalBytes) * 100);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {return null;}
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getEmptyMeta() {
    return {
      fields: [],
      delimiter: ',',
      linebreak: '\n',
      aborted: false,
      truncated: false
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const csvProcessor = new CSVProcessor();