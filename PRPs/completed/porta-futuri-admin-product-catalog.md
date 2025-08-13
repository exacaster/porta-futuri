# PRP: Porta Futuri Admin - Product Catalog Data Ingestion (FR-001)

## 1. Goal
Implement a secure, standalone admin interface for Porta Futuri that allows administrators to upload, validate, and manage product catalog CSV files (up to 10,000 products, 50MB max) with real-time validation, error handling, and database persistence.

**Success Metrics:**
- Admin can upload product CSV files via drag-and-drop or file selection
- Real-time validation provides immediate feedback on CSV format and data integrity
- Products are stored in Supabase database for API consumption
- Upload progress and error reporting is clear and actionable
- System handles files up to 50MB and 10,000 products efficiently

## 2. Why
As specified in requirement **FR-001 Product Catalog Data Ingestion** from `/PRPs/completed/porta-futuri-ai-addon-requirements.md`:
- Product catalog is the core data source for AI recommendations
- Admin needs a secure interface to manage product data
- CSV upload via "Porta Futuri Admin" component is the primary data ingestion method
- Validation ensures data quality for AI processing

## 3. Context

### 3.1 Existing Codebase Patterns
The project already has robust CSV processing infrastructure that we'll extend:

#### CSV Processor (Reuse Existing)
Location: `/src/widget/services/csvParser.ts`
- Already implements `processProductCSV()` with:
  - 50MB file size validation
  - 10,000 product limit
  - PapaParse streaming with web workers
  - Product validation and sanitization
  - Caching with 15-minute TTL
  - Error collection with row numbers

#### Database Schema
Need to create products table - currently missing from schema:
- `/supabase/migrations/001_initial_schema.sql` - Has API tables
- `/supabase/migrations/002_api_tables.sql` - Has rate limiting

#### UI Patterns
From `/src/widget/components/CustomerProfile.tsx`:
- Uses inline styles with CSS variables
- Simple component structure
- Tailwind-compatible styling approach

#### Supabase Integration
From `/supabase/functions/recommendations/index.ts`:
- Service role key authentication
- CORS headers implementation
- Error handling patterns

### 3.2 Technology Stack
- **Frontend**: React 18.3 with TypeScript
- **UI Components**: shadcn/ui (already installed)
- **File Upload**: react-dropzone (needs installation)
- **CSV Processing**: PapaParse (already installed)
- **Backend**: Supabase (configured)
- **Authentication**: Supabase Auth with admin role
- **State Management**: TanStack Query (already installed)
- **Build Tool**: Vite

### 3.3 External Documentation References

#### File Upload with shadcn/ui
- Community solution: https://github.com/diragb/shadcn-dropzone
- Uses react-dropzone with shadcn styling
- Pattern: Combine react-dropzone with shadcn/ui components

#### PapaParse Streaming
- Documentation: https://www.papaparse.com/docs
- Streaming API with chunk callback for large files
- Web Worker support with `worker: true` option
- TypeScript types available via @types/papaparse

#### Supabase Admin Authentication
- Guide: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- Pattern: Use Supabase Auth with role-based access
- Protected routes via session checking

## 4. Implementation Blueprint

### 4.1 Project Structure
```
porta-futuri/
├── src/
│   ├── admin/                     # NEW: Admin app
│   │   ├── App.tsx                # Admin app entry
│   │   ├── index.tsx              # Mount point
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Admin layout wrapper
│   │   │   ├── ProductUpload.tsx  # CSV upload component
│   │   │   ├── ProductTable.tsx   # Product listing
│   │   │   ├── FileDropzone.tsx   # Dropzone component
│   │   │   └── UploadProgress.tsx # Progress indicator
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Admin authentication
│   │   │   └── useProducts.ts     # Product CRUD operations
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Admin Supabase client
│   │   │   └── csvProcessor.ts    # Import from widget
│   │   └── styles/
│   │       └── admin.css          # Admin-specific styles
│   └── shared/                    # Existing shared code
├── supabase/
│   ├── migrations/
│   │   └── 003_products_table.sql # NEW: Products schema
│   └── functions/
│       └── admin-products/        # NEW: Admin API
│           └── index.ts
├── admin.html                     # NEW: Admin app HTML
└── vite.config.admin.ts           # NEW: Admin build config
```

### 4.2 Implementation Tasks (In Order)

#### Task 1: Database Schema
Create products table and admin tables in Supabase.

#### Task 2: Admin App Setup
Create separate admin React app with authentication.

#### Task 3: File Upload Component
Implement drag-and-drop CSV upload with react-dropzone.

#### Task 4: CSV Processing Integration
Connect existing CSV processor to admin interface.

#### Task 5: Product Management UI
Create table view for uploaded products.

#### Task 6: Supabase Edge Function
Create secure API endpoint for product operations.

#### Task 7: Authentication & Authorization
Implement admin-only access control.

#### Task 8: Error Handling & Validation
Add comprehensive error feedback.

#### Task 9: Testing & Documentation
Verify all requirements are met.

## 5. Detailed Implementation

### 5.1 Database Schema
```sql
-- File: /supabase/migrations/003_products_table.sql

-- Products table for catalog storage
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  attributes TEXT[],
  sock_status TEXT DEFAULT 'in_stock',
  image_url TEXT,
  rating DECIMAL(3, 2),
  comments JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID,
  upload_batch_id UUID
);

-- Upload batches for tracking CSV uploads
CREATE TABLE IF NOT EXISTS product_upload_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  total_products INTEGER,
  successful_products INTEGER,
  failed_products INTEGER,
  errors JSONB DEFAULT '[]',
  uploaded_by UUID,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_upload_batches_status ON product_upload_batches(status);

-- RLS policies for admin access only
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin users can do everything with products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );
```

### 5.2 Admin App Entry Point
```typescript
// File: /src/admin/App.tsx

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { ProductUpload } from './components/ProductUpload';
import { ProductTable } from './components/ProductTable';
import { useAuth } from './hooks/useAuth';
import './styles/admin.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function AdminApp() {
  const { user, loading, signIn, signOut } = useAuth(supabase);
  const [activeTab, setActiveTab] = useState<'upload' | 'products'>('upload');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center">Admin Login</h2>
          <button
            onClick={signIn}
            className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90"
          >
            Sign In with Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Layout user={user} onSignOut={signOut}>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Product Catalog Management</h1>
          
          <div className="mb-6 border-b">
            <nav className="flex space-x-8">
              <button
                className={`pb-2 px-1 ${activeTab === 'upload' ? 'border-b-2 border-primary' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload Products
              </button>
              <button
                className={`pb-2 px-1 ${activeTab === 'products' ? 'border-b-2 border-primary' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                View Products
              </button>
            </nav>
          </div>

          {activeTab === 'upload' ? (
            <ProductUpload supabase={supabase} />
          ) : (
            <ProductTable supabase={supabase} />
          )}
        </div>
      </Layout>
    </QueryClientProvider>
  );
}
```

### 5.3 File Upload Component with Dropzone
```typescript
// File: /src/admin/components/ProductUpload.tsx

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { csvProcessor } from '../../widget/services/csvParser';
import { Product } from '@shared/types';
import { UploadProgress } from './UploadProgress';

interface ProductUploadProps {
  supabase: any;
}

export const ProductUpload: React.FC<ProductUploadProps> = ({ supabase }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      setErrors([]);
      setSuccess(false);
      setStats(null);
    } else {
      setErrors(['Please upload a valid CSV file']);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setErrors([]);

    try {
      // Step 1: Validate CSV structure
      setProgress(10);
      const validation = await csvProcessor.validateCSVStructure(file, [
        'product_id', 'name', 'category', 'price', 'description'
      ]);

      if (!validation.valid) {
        setErrors(validation.errors);
        setUploading(false);
        return;
      }

      // Step 2: Process CSV
      setProgress(30);
      const result = await csvProcessor.processProductCSV(file);

      if (result.errors.length > 0) {
        // Show first 10 errors
        const errorMessages = result.errors.slice(0, 10).map(
          err => `Row ${err.row}: ${err.message}`
        );
        if (result.errors.length > 10) {
          errorMessages.push(`... and ${result.errors.length - 10} more errors`);
        }
        setErrors(errorMessages);
      }

      // Step 3: Calculate file hash for deduplication
      setProgress(50);
      const fileHash = await csvProcessor.calculateFileHash(file);

      // Step 4: Create upload batch
      const { data: batch, error: batchError } = await supabase
        .from('product_upload_batches')
        .insert({
          filename: file.name,
          file_hash: fileHash,
          total_products: result.data.length,
          successful_products: 0,
          failed_products: 0,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Step 5: Upload products in chunks
      const products = result.data;
      const chunkSize = 100;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const progress = 50 + ((i / products.length) * 40);
        setProgress(Math.round(progress));

        // Transform products for database
        const dbProducts = chunk.map(product => ({
          ...product,
          upload_batch_id: batch.id,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        }));

        const { error: insertError } = await supabase
          .from('products')
          .upsert(dbProducts, { onConflict: 'product_id' });

        if (insertError) {
          failCount += chunk.length;
          console.error('Insert error:', insertError);
        } else {
          successCount += chunk.length;
        }
      }

      // Step 6: Update batch status
      setProgress(95);
      await supabase
        .from('product_upload_batches')
        .update({
          successful_products: successCount,
          failed_products: failCount,
          status: 'completed',
          completed_at: new Date().toISOString(),
          errors: result.errors
        })
        .eq('id', batch.id);

      setProgress(100);
      setSuccess(true);
      setStats({
        total: products.length,
        successful: successCount,
        failed: failCount
      });

      // Clear file after successful upload
      setTimeout(() => {
        setFile(null);
        setProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${file ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setSuccess(false);
                setStats(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-lg">
              {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
            </p>
            <p className="text-sm text-gray-500">or click to select file</p>
            <p className="text-xs text-gray-400">Maximum file size: 50MB</p>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Upload Errors</p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {success && stats && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Upload Successful!</p>
              <p className="mt-1 text-sm text-green-700">
                Processed {stats.total} products: {stats.successful} successful, {stats.failed} failed
              </p>
            </div>
          </div>
        </div>
      )}

      {file && !uploading && !success && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90"
        >
          Upload Products
        </button>
      )}

      {uploading && (
        <UploadProgress progress={progress} />
      )}
    </div>
  );
};
```

### 5.4 Authentication Hook
```typescript
// File: /src/admin/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export const useAuth = (supabase: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await checkAdminStatus(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      setIsAdmin(!!data && !error);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin`
      }
    });
    if (error) console.error('Error signing in:', error);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  return { user, loading, isAdmin, signIn, signOut };
};
```

### 5.5 Vite Configuration for Admin App
```typescript
// File: /vite.config.admin.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  build: {
    outDir: 'dist/admin',
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    port: 5174,
  },
});
```

### 5.6 Admin HTML Entry
```html
<!-- File: /admin.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Porta Futuri Admin</title>
    <link rel="stylesheet" href="/src/admin/styles/admin.css">
  </head>
  <body>
    <div id="admin-root"></div>
    <script type="module" src="/src/admin/index.tsx"></script>
  </body>
</html>
```

## 6. Validation Gates

```bash
# 1. TypeScript compilation check
npm run typecheck

# 2. Linting
npm run lint

# 3. Build admin app
npm run build:admin

# 4. Run admin development server
npm run dev:admin

# 5. Test CSV upload with sample file
# Create test-products.csv with valid data
# Upload via admin interface
# Verify in Supabase dashboard

# 6. Test file size limits
# Create large CSV (>50MB)
# Verify rejection with clear error

# 7. Test product count limits
# Create CSV with >10,000 products
# Verify truncation at 10,000

# 8. Verify authentication
# Access /admin without login
# Verify redirect to login
# Login and verify access

# 9. Check database
# Verify products table has data
# Check upload_batches table for history
```

## 7. Error Handling Strategy

### 7.1 File Validation Errors
- File too large: Clear message with size limit
- Wrong format: "Please upload a CSV file"
- Missing columns: List missing required fields
- Invalid data: Show row numbers with errors

### 7.2 Upload Errors
- Network errors: Retry mechanism with exponential backoff
- Database errors: Transaction rollback, show error message
- Auth errors: Redirect to login
- Partial failures: Report success/failure counts

### 7.3 Security Considerations
- Admin-only access via RLS policies
- File hash for deduplication
- Sanitization of all CSV data
- Rate limiting on uploads (1 per minute)
- Audit trail via upload_batches table

## 8. Dependencies to Install

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/react-dropzone": "^5.1.0"
  }
}
```

## 9. NPM Scripts to Add

```json
{
  "scripts": {
    "dev:admin": "vite --config vite.config.admin.ts",
    "build:admin": "tsc && vite build --config vite.config.admin.ts",
    "preview:admin": "vite preview --config vite.config.admin.ts"
  }
}
```

## 10. Success Criteria
- [ ] Admin can login with Google OAuth
- [ ] CSV files upload with drag-and-drop
- [ ] Real-time validation shows errors immediately
- [ ] Progress bar shows upload status
- [ ] Products appear in database after upload
- [ ] Upload history is tracked
- [ ] 50MB file size limit enforced
- [ ] 10,000 product limit enforced
- [ ] Error messages are clear and actionable
- [ ] Admin interface is responsive and fast

## 11. Testing Checklist
- [ ] Upload valid CSV with 100 products
- [ ] Upload invalid CSV (missing columns)
- [ ] Upload large file (45MB, valid)
- [ ] Upload oversized file (55MB)
- [ ] Upload 10,000+ products (verify truncation)
- [ ] Test concurrent uploads (should queue)
- [ ] Test network interruption during upload
- [ ] Verify RLS policies (non-admin rejection)
- [ ] Test logout/login flow
- [ ] Verify product deduplication by product_id

## Implementation Confidence Score: 9/10

**Rationale**: This PRP provides comprehensive context including:
- Complete file structure and code examples
- Existing patterns from the codebase to follow
- External documentation references
- Detailed error handling strategy
- Clear validation gates
- All necessary SQL schemas
- Full authentication implementation

The only point deducted is for potential edge cases in Supabase Auth configuration that might require environment-specific adjustments.

## Notes for AI Implementation

1. **Start with database migration** - Run the products table migration first
2. **Reuse existing CSV processor** - Import from `/src/widget/services/csvParser.ts`
3. **Follow existing UI patterns** - Match style from CustomerProfile component
4. **Use service role key for admin operations** - Required for bypassing RLS
5. **Test with small CSV first** - Use 10-20 products for initial testing
6. **Monitor Supabase dashboard** - Check logs during implementation

This PRP contains all necessary context for one-pass implementation. The existing CSV processing infrastructure significantly reduces implementation complexity.