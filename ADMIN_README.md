# Porta Futuri Admin Dashboard

## Overview
The Porta Futuri Admin Dashboard is a secure interface for managing product catalogs, users, and system configurations for the AI recommendation widget.

## Features
- **Product Catalog Management**: Upload and manage product data via CSV files
- **User Management**: Create and manage admin users with role-based permissions
- **Audit Logging**: Track all admin actions for security and compliance
- **Real-time Validation**: Immediate feedback on CSV uploads and data integrity

## Getting Started

### Prerequisites
1. Node.js 18+ and npm 9+
2. Supabase project with proper configuration
3. Environment variables configured (see below)

### Environment Setup
Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup
Run the migrations to create necessary tables:
```bash
npm run supabase:migrate
```

### Installation
```bash
# Install dependencies
npm install

# Run the admin app in development mode
npm run dev:admin

# Build for production
npm run build:admin
```

## Usage

### Default Login
- Email: `egidijus@exacaster.com`
- Password: `123456789`

### Uploading Products
1. Navigate to "Upload Products" tab
2. Drag and drop or select a CSV file (max 50MB, 10,000 products)
3. Required CSV columns:
   - `product_id` - Unique product identifier
   - `name` - Product name
   - `category` - Product category
   - `price` - Product price
   - `description` - Product description

### User Roles
- **Super Admin**: Full system access
- **Admin**: Product and limited user management
- **Viewer**: Read-only access

### Testing
A sample CSV file is provided at `test-products.csv` for testing the upload functionality.

## Security Features
- Row Level Security (RLS) policies
- Session management with 30-minute timeout
- Account lockout after 5 failed login attempts
- Audit logging for all admin actions
- HTTPS-only in production

## Troubleshooting

### CSV Upload Errors
- Ensure file is valid CSV format
- Check that required fields are present
- Verify file size is under 50MB
- Product count should not exceed 10,000

### Authentication Issues
- Check Supabase configuration
- Verify user exists in admin_users table
- Ensure user account is active

### Permission Denied
- Verify user has appropriate role
- Check RLS policies in Supabase
- Ensure database migrations have run

## Development

### Project Structure
```
src/admin/
├── App.tsx              # Main admin app
├── components/          # React components
│   ├── Layout.tsx       # App layout wrapper
│   ├── Login.tsx        # Authentication UI
│   ├── ProductUpload.tsx # CSV upload interface
│   ├── ProductTable.tsx # Product management
│   └── UserManagement.tsx # User administration
├── hooks/              # Custom React hooks
│   └── useAuth.ts      # Authentication logic
└── styles/             # Admin-specific styles
    └── admin.css       # Main stylesheet
```

### Available Scripts
- `npm run dev:admin` - Start development server
- `npm run build:admin` - Build for production
- `npm run preview:admin` - Preview production build
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint

## Support
For issues or questions, contact the development team or refer to the main project documentation.