import { App as WidgetApp } from '../../widget/App';

export function PortaFuturiWidget() {
  // Create widget configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvlbbgdkgneobvlyawix.supabase.co';
  
  const widgetConfig = {
    apiKey: import.meta.env.VITE_WIDGET_API_KEY || 'demo-api-key',
    apiUrl: `${supabaseUrl}/functions/v1/recommendations`,
    position: 'bottom-right' as const,
    theme: {
      primaryColor: '#6d02a3'
    },
    customerId: localStorage.getItem('itelecom_customer_id') || 'DEMO_USER_001',
    data: {
      products: []
    }
  };

  return <WidgetApp config={widgetConfig} />;
}

// Helper hook to interact with the widget
export function usePortaFuturiWidget() {
  const openWidget = () => {
    const event = new CustomEvent('porta-futuri-open');
    window.dispatchEvent(event);
  };

  const closeWidget = () => {
    const event = new CustomEvent('porta-futuri-close');
    window.dispatchEvent(event);
  };

  const sendContext = (context: any) => {
    const event = new CustomEvent('porta-futuri-context', {
      detail: context
    });
    window.dispatchEvent(event);
  };

  return {
    openWidget,
    closeWidget,
    sendContext
  };
}