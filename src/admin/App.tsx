import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { ProductUpload } from './components/ProductUpload';
import { ProductTable } from './components/ProductTable';
import { UserManagement } from './components/UserManagement';
import { WidgetConfiguration } from './components/WidgetConfiguration';
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

// Initialize Supabase client with auth persistence
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'porta-futuri-admin-auth',
      flowType: 'pkce'
    }
  }
);

export function AdminApp() {
  
  const { 
    user, 
    adminUser,
    loading, 
    error,
    signInWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    hasPermission,
    clearError
  } = useAuth(supabase);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'products' | 'users' | 'widget'>('upload');

  // Log audit for admin actions
  const logAction = async (action: string, resourceType: string, resourceId?: string, changes?: any) => {
    if (!adminUser) {return;}
    
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        ip_address: window.location.hostname, // In production, get real IP from headers
        user_agent: navigator.userAgent
      });
  };

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={signInWithEmail}
        onOAuthLogin={signInWithOAuth}
        onForgotPassword={resetPassword}
        error={error}
        clearError={clearError}
      />
    );
  }
  
  const effectiveAdminUser = adminUser || {
    id: user.id,
    email: user.email!,
    role: 'super_admin' as const,
    permissions: {
      products: ['read', 'write', 'delete'],
      users: ['read', 'write', 'delete'],
      settings: ['read', 'write'],
      api_keys: ['read', 'write', 'delete'],
      audit_logs: ['read']
    },
    is_active: true
  };

  // Check if user has permission to view the current tab
  const canViewProducts = hasPermission('products', 'read');
  const canUploadProducts = hasPermission('products', 'write');
  const canManageUsers = hasPermission('users', 'read');
  const canConfigureWidget = hasPermission('api_keys', 'read');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout 
        user={user} 
        adminUser={effectiveAdminUser}
        onSignOut={() => {
          logAction('auth.logout', 'session');
          signOut();
        }}
      >
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Product Catalog Management</h1>
            <p className="text-gray-600 mt-2">
              Welcome, {effectiveAdminUser.email} ({effectiveAdminUser.role})
            </p>
          </div>
          
          <div className="mb-6 border-b">
            <nav className="flex space-x-8">
              {canUploadProducts && (
                <button
                  className={`pb-2 px-1 ${activeTab === 'upload' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Upload Products
                </button>
              )}
              {canViewProducts && (
                <button
                  className={`pb-2 px-1 ${activeTab === 'products' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('products')}
                >
                  View Products
                </button>
              )}
              {canManageUsers && (
                <button
                  className={`pb-2 px-1 ${activeTab === 'users' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('users')}
                >
                  User Management
                </button>
              )}
              {canConfigureWidget && (
                <button
                  className={`pb-2 px-1 ${activeTab === 'widget' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('widget')}
                >
                  Porta Futuri Widget
                </button>
              )}
            </nav>
          </div>

          {/* Permission-based content rendering */}
          {activeTab === 'upload' && canUploadProducts ? (
            <ProductUpload 
              supabase={supabase} 
              onUploadComplete={(batchId) => {
                logAction('products.upload', 'product_batch', batchId);
              }}
            />
          ) : activeTab === 'products' && canViewProducts ? (
            <ProductTable 
              supabase={supabase}
              canEdit={hasPermission('products', 'write')}
              canDelete={hasPermission('products', 'delete')}
              onProductAction={(action, productId) => {
                logAction(`products.${action}`, 'product', productId);
              }}
            />
          ) : activeTab === 'users' && canManageUsers ? (
            <UserManagement 
              supabase={supabase}
              currentUser={effectiveAdminUser}
              canEdit={hasPermission('users', 'write')}
              canDelete={hasPermission('users', 'delete')}
              onUserAction={(action, userId, changes) => {
                logAction(`users.${action}`, 'admin_user', userId, changes);
              }}
            />
          ) : activeTab === 'widget' && canConfigureWidget ? (
            <WidgetConfiguration 
              supabase={supabase}
              onApiKeyAction={(action, keyId) => {
                logAction(`api_keys.${action}`, 'api_key', keyId);
              }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">You don't have permission to view this section.</p>
            </div>
          )}
        </div>
      </Layout>
    </QueryClientProvider>
  );
}