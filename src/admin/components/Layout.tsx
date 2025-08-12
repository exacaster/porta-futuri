import React from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, Package, User as UserIcon, Shield } from 'lucide-react';

interface LayoutProps {
  user: User;
  adminUser: {
    email: string;
    role: string;
  };
  onSignOut: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ adminUser, onSignOut, children }) => {
  const getRoleIcon = () => {
    switch (adminUser.role) {
      case 'super_admin':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'admin':
        return <UserIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold">Porta Futuri Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon()}
                <span className="text-sm text-gray-700">{adminUser.email}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                  {adminUser.role.replace('_', ' ')}
                </span>
              </div>
              
              <button
                onClick={onSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};