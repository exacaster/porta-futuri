import React, { useState } from 'react';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: boolean }>;
  onOAuthLogin: (provider: 'google' | 'github') => void;
  onForgotPassword: (email: string) => Promise<{ error: boolean }>;
  error: { message: string; code?: string } | null;
  clearError: () => void;
}

export const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  // onOAuthLogin,  // Reserved for future OAuth implementation
  onForgotPassword,
  error,
  clearError
}) => {
  const [email, setEmail] = useState('egidijus@exacaster.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    
    const result = await onLogin(email, password);
    
    setIsLoading(false);
    if (!result.error) {
      // Clear form on successful login
      setPassword('');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    
    const result = await onForgotPassword(email);
    
    setIsLoading(false);
    if (!result.error) {
      setResetEmailSent(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmailSent(false);
      }, 5000);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {resetEmailSent ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Check your email
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>We've sent a password reset link to {email}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    clearError();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Back to login
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full mx-4">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-center items-center text-white">
          <div className="text-center">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" opacity="0.3"/>
                <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="2" opacity="0.5"/>
                <circle cx="50" cy="50" r="25" stroke="white" strokeWidth="2" opacity="0.7"/>
                <circle cx="50" cy="50" r="15" fill="white"/>
              </svg>
              <h1 className="text-4xl font-bold mb-2">Porta Futuri</h1>
              <p className="text-xl opacity-90">Admin Portal</p>
            </div>
            <div className="space-y-4 text-sm opacity-80">
              <p>• Manage Product Catalog</p>
              <p>• Upload CSV Files</p>
              <p>• User Administration</p>
              <p>• Analytics & Insights</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Login to Porta Futuri Admin
            </h2>
            <p className="text-gray-600 mb-8">
              Enter your credentials to access the admin dashboard
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <span className="text-sm font-medium">Hide</span>
                    ) : (
                      <span className="text-sm font-medium">Show</span>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Signing in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    clearError();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot your password?
                </button>
                <span className="text-gray-500">
                  Don't have an account? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Register</a>
                </span>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Default credentials: egidijus@exacaster.com / 123456789
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};