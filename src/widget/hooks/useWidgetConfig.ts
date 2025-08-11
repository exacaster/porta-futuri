import { useState, useEffect } from 'react';

interface WidgetConfig {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  features?: {
    chat: boolean;
    profile: boolean;
    analytics: boolean;
  };
}

export function useWidgetConfig(apiKey: string) {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // TODO: Implement error handling when fetching config from API
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For MVP, return default config
    // In production, this would fetch from the API
    setWidgetConfig({
      theme: {},
      position: 'bottom-right',
      features: {
        chat: true,
        profile: true,
        analytics: false,
      },
    });
    setIsLoading(false);
  }, [apiKey]);

  return { widgetConfig, isLoading };
}