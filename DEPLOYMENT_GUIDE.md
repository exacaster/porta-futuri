# 🚀 Deployment Guide: Backend to Supabase Cloud + Admin UI Local

## Your Setup
- **Supabase Project URL**: `https://rvlbbgdkgneobvlyawix.supabase.co`
- **Project Reference**: `rvlbbgdkgneobvlyawix`
- **Admin UI Port**: `http://localhost:5174`

## 📦 Quick Deployment (Automated)

Run the deployment script:
```bash
./deploy-to-supabase.sh
```

This will:
1. Link to your Supabase project
2. Push all database migrations
3. Set API keys as secrets
4. Deploy Edge Functions

## 📝 Manual Deployment Steps

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI if needed
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref rvlbbgdkgneobvlyawix

# 4. Push database schema
supabase db push

# 5. Set secrets for Edge Functions
supabase secrets set ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# 6. Deploy Edge Functions
supabase functions deploy recommendations --no-verify-jwt
```

### Option B: Using Supabase Dashboard

1. **Go to SQL Editor** in [Supabase Dashboard](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/sql)

2. **Run migrations in order**:
   - Run contents of `supabase/migrations/001_initial_schema.sql`
   - Run contents of `supabase/migrations/002_api_tables.sql`
   - Run contents of `supabase/migrations/003_products_table.sql`
   - Run contents of `supabase/migrations/004_seed_default_admin.sql`

3. **Set up Edge Function secrets**:
   - Go to Settings → Edge Functions
   - Add secret: `ANTHROPIC_API_KEY` with your Claude API key

4. **Deploy Edge Functions manually**:
   ```bash
   supabase functions deploy recommendations --no-verify-jwt
   ```

## 🖥️ Run Admin UI Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Admin UI
```bash
npm run dev:admin
```

### 3. Access Admin Dashboard
Open browser: `http://localhost:5174`

### 4. Login with Default Credentials
- **Email**: `egidijus@exacaster.com`
- **Password**: `123456789`

## ✅ Verify Deployment

### 1. Check Database Tables
Go to [Table Editor](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/editor) and verify these tables exist:
- ✅ `products`
- ✅ `product_upload_batches`
- ✅ `admin_users`
- ✅ `user_sessions`
- ✅ `audit_logs`
- ✅ `api_keys`

### 2. Check Edge Functions
Go to [Edge Functions](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/functions) and verify:
- ✅ `recommendations` function is deployed

### 3. Test Admin Login
1. Open `http://localhost:5174`
2. Login with default credentials
3. You should see the admin dashboard

### 4. Test Product Upload
1. Go to "Upload Products" tab
2. Upload the `test-products.csv` file
3. Check products appear in Supabase Table Editor

## 🔧 Troubleshooting

### Issue: "Project not linked"
```bash
supabase link --project-ref rvlbbgdkgneobvlyawix --password "ukztyTsUwYJtE21"
```

### Issue: "Cannot connect to database"
Check your database password in Supabase Dashboard → Settings → Database

### Issue: "Admin login fails"
1. Check if admin user exists in `admin_users` table
2. If not, run this in SQL Editor:
```sql
-- Create default admin user
INSERT INTO admin_users (
  email,
  role,
  permissions,
  is_active,
  is_email_verified
) VALUES (
  'egidijus@exacaster.com',
  'super_admin',
  '{"products": ["read", "write", "delete"], "users": ["read", "write", "delete"]}'::jsonb,
  true,
  true
) ON CONFLICT (email) DO NOTHING;
```

3. Create auth user in Authentication → Users → Invite User

### Issue: "Edge Function not working"
Check logs:
```bash
supabase functions logs recommendations
```

### Issue: "CORS errors"
Add your local URL to allowed origins in Edge Function:
```typescript
// In supabase/functions/_shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5174',
  // ... rest of headers
}
```

## 🔒 Security Notes

1. **Never commit `.env.local` to git** - it contains sensitive keys
2. **Change default admin password** after first login
3. **Enable RLS policies** (already in migrations)
4. **Set up proper authentication** in production

## 📊 Monitor Your Deployment

- **Database Metrics**: [Database](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/database/tables)
- **API Logs**: [Logs](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/logs/edge-functions)
- **Authentication**: [Auth Users](https://app.supabase.com/project/rvlbbgdkgneobvlyawix/auth/users)

## 🎉 Success Checklist

- [ ] Database tables created
- [ ] Edge functions deployed
- [ ] Admin UI runs locally
- [ ] Can login with default credentials
- [ ] Can upload CSV files
- [ ] Products appear in database

---

**Need help?** Check the Supabase project dashboard:
https://app.supabase.com/project/rvlbbgdkgneobvlyawix