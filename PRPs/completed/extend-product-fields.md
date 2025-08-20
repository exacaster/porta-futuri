# PRP: Extend Product Database with Additional Fields

## Goal
Extend the product database schema to support additional fields (attributes, ratings, comments) from CSV files and update the admin panel to handle these fields during upload, ensuring existing product records are updated appropriately.

## Why
- Enable richer product data for better AI recommendations
- Support customer reviews and ratings for improved trust signals
- Allow flexible product attributes (e.g., processor, screen size, battery)
- Maintain backward compatibility with existing data

## Context

### Current State
- Database has `products` table with basic fields (see `/supabase/migrations/005_products_table_safe.sql:6-25`)
- Admin panel supports CSV upload (see `/src/admin/components/ProductUpload.tsx`)
- CSV parser validates and processes product data (see `/src/widget/services/csvParser.ts:25-137`)
- Product type interface defines the data structure (see `/src/shared/types/product.types.ts:1-14`)
- Database has existing `metadata` JSONB field that can store attributes
- Database has `ratings` and `review_count` fields but no actual reviews storage

### Required Changes
1. Add `comments` field to database for storing customer reviews
2. Update Product interface to include `attributes` and `comments`
3. Modify CSV parser to handle these new fields
4. Update admin upload logic to process and store these fields
5. Ensure upsert logic updates existing products

### CSV Schema Requirements (from screenshot)
```typescript
interface CSVProduct {
  product_id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  sku?: string;
  brand?: string;
  stock_quantity?: number;
  image_url?: string;
  tags?: string | string[];
  attributes?: {
    [key: string]: any;  // JSON object for flexible attributes
  };
  rating?: number;
  comments?: Array<{
    reviewer_name: string;
    rating: number;
    date: string;
    comment: string;
    helpful_count: number;
  }>;
}
```

## Implementation Blueprint

### Phase 1: Database Schema Extension

1. **Create Migration for Comments Field**
```sql
-- File: /supabase/migrations/009_add_product_comments.sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_comments ON products USING gin(comments);

-- Add comment count computed column for efficiency
ALTER TABLE products
ADD COLUMN IF NOT EXISTS comment_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(comments)) STORED;
```

2. **Update RLS Policies**
```sql
-- Ensure RLS policies allow reading comments
-- Update existing policies if needed
```

### Phase 2: Update Type Definitions

1. **Extend Product Interface**
```typescript
// File: /src/shared/types/product.types.ts
export interface ProductComment {
  reviewer_name: string;
  rating: number;
  date: string;
  comment: string;
  helpful_count: number;
}

export interface Product {
  // ... existing fields ...
  attributes?: Record<string, any>;  // Using metadata field
  comments?: ProductComment[];       // New field
}
```

2. **Update Sanitization Functions**
```typescript
// Add to sanitizeProduct function
attributes: raw.attributes || raw.metadata || {},
comments: Array.isArray(raw.comments) ? 
  raw.comments.map(sanitizeComment) : []
```

### Phase 3: Update CSV Parser

1. **Modify processProductCSV Method**
```typescript
// In /src/widget/services/csvParser.ts
// Handle JSON fields parsing
const parseJSONField = (value: any, fieldName: string): any => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      console.warn(`Failed to parse JSON for ${fieldName}`);
      return null;
    }
  }
  return value;
};

// In the chunk processing:
const product = {
  ...sanitizeProduct(row),
  attributes: parseJSONField(row.attributes, 'attributes'),
  comments: parseJSONField(row.comments, 'comments')
};
```

### Phase 4: Update Admin Upload Component

1. **Modify ProductUpload Component**
```typescript
// In /src/admin/components/ProductUpload.tsx
// Transform products for database
const dbProducts = chunk.map(product => ({
  ...product,
  metadata: product.attributes || product.metadata || {},
  comments: product.comments || [],
  upload_batch_id: batch.id,
  uploaded_by: userData.user?.id
}));
```

### Phase 5: Database Upsert Logic

1. **Ensure Proper Upsert Behavior**
```typescript
// In ProductUpload.tsx, update upsert to merge data
const { error: insertError } = await supabase
  .from('products')
  .upsert(dbProducts, { 
    onConflict: 'product_id',
    ignoreDuplicates: false  // Ensure updates happen
  });
```

### Phase 6: Add Validation and Error Handling

1. **Validate JSON Structure**
```typescript
const validateComments = (comments: any[]): boolean => {
  return comments.every(comment => 
    comment.reviewer_name && 
    typeof comment.rating === 'number' &&
    comment.date &&
    comment.comment
  );
};

const validateAttributes = (attributes: any): boolean => {
  return typeof attributes === 'object' && 
         attributes !== null && 
         !Array.isArray(attributes);
};
```

## Implementation Tasks (in order)

1. [ ] Create and run database migration for comments field
2. [ ] Update Product interface in product.types.ts
3. [ ] Update sanitizeProduct function to handle new fields
4. [ ] Modify CSV parser to parse JSON fields (attributes, comments)
5. [ ] Update CSV validation to check new fields
6. [ ] Modify ProductUpload component to map fields correctly
7. [ ] Test with sample CSV containing new fields
8. [ ] Add error handling for malformed JSON
9. [ ] Update existing products with merge logic
10. [ ] Add unit tests for new functionality

## Validation Gates

```bash
# Type checking
npm run typecheck

# Lint checking
npm run lint

# Test CSV upload with new fields
# Create test CSV with attributes and comments
echo 'product_id,name,price,category,description,attributes,comments
TEST001,"Test Product",99.99,"Electronics","Test Description","{""processor"":""Intel"",""ram"":""8GB""}","[{""reviewer_name"":""John"",""rating"":5,""date"":""2025-01-20"",""comment"":""Great product"",""helpful_count"":10}]"' > test-products.csv

# Upload via admin panel and verify in database
npm run dev:admin
# Navigate to http://localhost:5174 and upload test-products.csv

# Verify database update
npx supabase db dump --data-only --table products | grep TEST001

# Run tests if available
npm test 2>/dev/null || echo "No tests configured"
```

## Error Handling Strategy

1. **JSON Parse Errors**: Log warning, store as string in metadata
2. **Missing Fields**: Use defaults, don't fail entire upload
3. **Invalid Data Types**: Attempt conversion, use defaults if fails
4. **Large Comments Arrays**: Limit to 100 comments per product
5. **Database Errors**: Batch retry with exponential backoff

## Security Considerations

1. Sanitize all user input in comments to prevent XSS
2. Validate JSON structure to prevent injection
3. Limit comment size to prevent DoS
4. Ensure RLS policies are maintained

## Performance Considerations

1. Use JSONB indexes for efficient querying
2. Consider pagination for products with many comments
3. Batch database operations in chunks of 100
4. Use streaming for large CSV files

## Testing Checklist

- [ ] Upload CSV with all new fields populated
- [ ] Upload CSV with partial new fields
- [ ] Upload CSV with malformed JSON
- [ ] Upload CSV to update existing products
- [ ] Verify attributes stored in metadata field
- [ ] Verify comments stored and indexed
- [ ] Test with 10MB+ CSV file
- [ ] Verify no data loss on re-upload

## Documentation Updates

1. Update API documentation with new fields
2. Add CSV template with example data
3. Update admin panel user guide
4. Document field mapping logic

## Rollback Plan

If issues occur:
1. Remove comments column: `ALTER TABLE products DROP COLUMN IF EXISTS comments;`
2. Revert type definitions to previous version
3. Redeploy previous admin panel version
4. Clear cache and restart services

## Success Criteria

- ✅ CSV files with attributes and comments upload successfully
- ✅ Existing products update with new data on re-upload
- ✅ No breaking changes to existing functionality
- ✅ Admin panel displays upload status correctly
- ✅ Database queries remain performant
- ✅ All validation gates pass

## References

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Upsert Documentation](https://supabase.com/docs/reference/javascript/upsert)
- [PapaParse JSON Parsing](https://www.papaparse.com/docs#config)
- Current Implementation: `/src/admin/components/ProductUpload.tsx:38-171`
- CSV Parser: `/src/widget/services/csvParser.ts:25-137`
- Database Schema: `/supabase/migrations/005_products_table_safe.sql`

## Notes

- The `metadata` field already exists in the database and can store attributes
- The `ratings` field exists but `comments` needs to be added
- Using JSONB for flexibility and query performance
- Maintaining backward compatibility is critical
