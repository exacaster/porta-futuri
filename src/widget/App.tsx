import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from './components/ChatInterface';
import { WidgetTrigger } from './components/WidgetTrigger';
import { CustomerProfile } from './components/CustomerProfile';
import { useWidgetConfig } from './hooks/useWidgetConfig';
import { csvProcessor } from './services/csvParser';
import { Product, CustomerProfile as CustomerProfileType, ContextEvent } from '@shared/types';
import './styles/widget.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface WidgetConfig {
  apiKey: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  data?: {
    productCatalogUrl?: string;
    customerProfileUrl?: string;
    contextUrl?: string;
    products?: Product[];  // Allow direct product data
  };
}

interface AppProps {
  config: WidgetConfig;
}

function AppContent({ config }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileType | null>(null);
  const [contextEvents, setContextEvents] = useState<ContextEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCustomerIdInput, setShowCustomerIdInput] = useState(false);

  const { widgetConfig } = useWidgetConfig(config.apiKey);

  // Get customer ID from multiple sources
  const getCustomerId = (): string | null => {
    // 1. Check JavaScript variable (highest priority)
    if (window.PortaFuturi?.customerId) {return window.PortaFuturi.customerId;}
    
    // 2. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlCustomerId = urlParams.get('customer_id');
    if (urlCustomerId) {return urlCustomerId;}
    
    // 3. Check cookie
    const cookieValue = getCookie('porta_futuri_customer_id');
    if (cookieValue) {return cookieValue;}
    
    // 4. Check sessionStorage (for persistence)
    const sessionValue = sessionStorage.getItem('porta_futuri_customer_id');
    if (sessionValue) {return sessionValue;}
    
    // 5. Return null to trigger manual entry UI
    return null;
  };

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {c = c.substring(1, c.length);}
      if (c.indexOf(nameEQ) === 0) {return c.substring(nameEQ.length, c.length);}
    }
    return null;
  };

  // Initialize customer ID on mount
  useEffect(() => {
    const id = getCustomerId();
    if (id) {
      setCustomerId(id);
      fetchCDPData(id);
    } else {
      setShowCustomerIdInput(true);
    }
    loadData();
  }, [config.data]);

  // Fetch CDP data if customer ID is available
  const fetchCDPData = async (customerId: string) => {
    try {
      const response = await fetch(`${config.apiUrl || '/api/v1'}/cdp-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        },
        body: JSON.stringify({
          action: 'fetch',
          customer_id: customerId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cdp_available) {
          // Enhance customer profile with CDP data
          setCustomerProfile(prev => ({
            ...prev,
            customer_id: customerId,
            cdp_data: data
          } as CustomerProfileType));
        }
      }
    } catch (error) {
      console.warn('Failed to fetch CDP data:', error);
      // Fallback to CSV data
    }
  };

  // Handle manual customer ID submission
  const handleCustomerIdSubmit = (id: string) => {
    setCustomerId(id);
    sessionStorage.setItem('porta_futuri_customer_id', id);
    setShowCustomerIdInput(false);
    fetchCDPData(id);
  };

  const loadData = async () => {
    setDataLoading(true);
    setDataError(null);

    try {
      const promises = [];

      // Check if products are directly provided
      if (config.data?.products && config.data.products.length > 0) {
        setProducts(config.data.products);
      } 
      // Load product catalog from URL
      else if (config.data?.productCatalogUrl) {
        promises.push(
          fetch(config.data.productCatalogUrl)
            .then(res => res.blob())
            .then(blob => new File([blob], 'products.csv'))
            .then(file => csvProcessor.processProductCSV(file))
            .then(result => {
              if (result.errors.length > 0) {
                console.warn('Product CSV errors:', result.errors);
              }
              setProducts(result.data);
            })
        );
      }

      // Load customer profile
      if (config.data?.customerProfileUrl) {
        promises.push(
          fetch(config.data.customerProfileUrl)
            .then(res => res.blob())
            .then(blob => new File([blob], 'customer.csv'))
            .then(file => csvProcessor.processCustomerCSV(file))
            .then(result => {
              if (result.errors.length > 0) {
                console.warn('Customer CSV errors:', result.errors);
              }
              setCustomerProfile(result.data[0] || null);
            })
        );
      }

      // Load context events
      if (config.data?.contextUrl) {
        promises.push(
          fetch(config.data.contextUrl)
            .then(res => res.blob())
            .then(blob => new File([blob], 'context.csv'))
            .then(file => csvProcessor.processContextCSV(file))
            .then(result => {
              if (result.errors.length > 0) {
                console.warn('Context CSV errors:', result.errors);
              }
              setContextEvents(result.data);
            })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError('Failed to load data. Please check your CSV files.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleFileUpload = async (files: {
    products?: File;
    customer?: File;
    context?: File;
  }) => {
    setDataLoading(true);
    setDataError(null);

    try {
      if (files.products) {
        const result = await csvProcessor.processProductCSV(files.products);
        if (result.errors.length > 0) {
          console.warn('Product CSV errors:', result.errors);
        }
        setProducts(result.data);
      }

      if (files.customer) {
        const result = await csvProcessor.processCustomerCSV(files.customer);
        if (result.errors.length > 0) {
          console.warn('Customer CSV errors:', result.errors);
        }
        setCustomerProfile(result.data[0] || null);
      }

      if (files.context) {
        const result = await csvProcessor.processContextCSV(files.context);
        if (result.errors.length > 0) {
          console.warn('Context CSV errors:', result.errors);
        }
        setContextEvents(result.data);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setDataError('Failed to process uploaded files.');
    } finally {
      setDataLoading(false);
    }
  };

  const position = config.position || widgetConfig?.position || 'bottom-right';
  const theme = { ...widgetConfig?.theme, ...config.theme };

  // Apply theme CSS variables
  useEffect(() => {
    if (theme.primaryColor) {
      document.documentElement.style.setProperty('--pf-primary', theme.primaryColor);
    }
    if (theme.secondaryColor) {
      document.documentElement.style.setProperty('--pf-secondary', theme.secondaryColor);
    }
    if (theme.fontFamily) {
      document.documentElement.style.setProperty('--pf-font-family', theme.fontFamily);
    }
  }, [theme]);

  return (
    <div className={`pf-widget-container pf-${position}`}>
      <WidgetTrigger 
        onClick={() => setIsOpen(!isOpen)} 
        isOpen={isOpen}
        position={position}
      />
      
      {isOpen && (
        <div className="pf-widget-panel">
          <div className="pf-widget-header">
            <h3 className="pf-widget-title">AI Shopping Assistant</h3>
            <div className="pf-widget-actions">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="pf-btn-icon"
                title="View Profile"
              >
                👤
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="pf-btn-icon"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {showCustomerIdInput && !customerId ? (
            <div className="pf-widget-customer-input">
              <h4>Welcome! Please enter your Customer ID</h4>
              <input
                type="text"
                placeholder="e.g., CUST123"
                className="pf-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleCustomerIdSubmit(e.currentTarget.value);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input?.value) {
                    handleCustomerIdSubmit(input.value);
                  }
                }}
                className="pf-btn-primary"
              >
                Continue
              </button>
              <p className="pf-text-small">Your Customer ID helps us provide personalized recommendations</p>
            </div>
          ) : dataLoading ? (
            <div className="pf-widget-loading">
              <div className="pf-spinner"></div>
              <p>Loading data...</p>
            </div>
          ) : dataError ? (
            <div className="pf-widget-error">
              <p>{dataError}</p>
              <button onClick={loadData} className="pf-btn-primary">
                Retry
              </button>
            </div>
          ) : showProfile ? (
            <CustomerProfile
              profile={customerProfile}
              contextEvents={contextEvents}
              onClose={() => setShowProfile(false)}
            />
          ) : (
            <ChatInterface
              apiKey={config.apiKey}
              apiUrl={config.apiUrl}
              products={products}
              customerProfile={customerProfile}
              contextEvents={contextEvents}
              onFileUpload={handleFileUpload}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function App(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent {...props} />
    </QueryClientProvider>
  );
}