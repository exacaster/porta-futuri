import React from 'react';
import { Check } from 'lucide-react';
import { App as WidgetApp } from '../../widget/App';

interface WidgetPreviewProps {
  apiKey: string;
  config: {
    position: string;
    primaryColor: string;
    apiUrl: string;
  };
  products?: any[];
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  apiKey,
  config,
  products
}) => {
  // Create widget configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvlbbgdkgneobvlyawix.supabase.co';
  // Use cloud Supabase for both development and production
  const widgetConfig = {
    apiKey,
    apiUrl: `${supabaseUrl}/functions/v1/recommendations`,  // Always use cloud Edge Function
    position: 'relative' as any, // Use relative positioning in preview (cast to any for custom position)
    theme: {
      primaryColor: config.primaryColor || '#007bff'
    },
    data: {
      products: products || []
    }
  };
  
  return (
    <div className="relative bg-slate-800 rounded-lg h-[600px] overflow-hidden">
      {/* Status indicator - lower z-index */}
      <div className="absolute top-4 right-4 z-[5]">
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          <Check className="w-4 h-4" />
          Widget Active
        </div>
      </div>
      
      {/* Sample page content for context */}
      <div className="p-8 pointer-events-none relative z-0">
        <h2 className="text-2xl font-bold mb-4 text-white">Sample E-Commerce Page</h2>
        <p className="text-gray-300 mb-4">
          This preview shows how the Porta Futuri widget will appear on your website.
          The widget is fully functional - try clicking the chat icon to interact with it.
        </p>
        
        {/* Sample product grid */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded shadow">
              <div className="h-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Sample navigation */}
        <div className="mt-8 flex gap-4">
          <div className="h-10 bg-white rounded px-4 py-2 shadow animate-pulse w-24"></div>
          <div className="h-10 bg-white rounded px-4 py-2 shadow animate-pulse w-32"></div>
          <div className="h-10 bg-white rounded px-4 py-2 shadow animate-pulse w-28"></div>
        </div>
      </div>
      
      {/* Widget container - highest z-index to be on top */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: 1000 }}
      >
        <WidgetApp config={widgetConfig} />
      </div>
      
      {/* Help text - lower z-index */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow-sm text-sm text-gray-600 pointer-events-none z-[5]">
        💡 The widget is live and interactive. Click the chat icon to test it!
      </div>
    </div>
  );
};