import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatInterface } from "./components/ChatInterface";
import { WidgetTrigger } from "./components/WidgetTrigger";
import { CustomerProfile } from "./components/CustomerProfile";
import { CustomerIdModal } from "./components/CustomerIdModal";
import { BrowsingHistory } from "./components/BrowsingHistory";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import { useLanguage } from "./hooks/useLanguage";
import { useBrowsingHistory } from "./hooks/useBrowsingHistory";
import { csvProcessor } from "./services/csvParser";
import { MessageCircle, User, Activity, X } from "lucide-react";
import {
  Product,
  CustomerProfile as CustomerProfileType,
  ContextEvent,
} from "@shared/types";
import "./styles/widget.css";

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
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "relative";
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  data?: {
    productCatalogUrl?: string;
    customerProfileUrl?: string;
    contextUrl?: string;
    products?: Product[]; // Allow direct product data
  };
  navigation?: {
    productUrlPattern?: string;
    baseUrl?: string;
    openInNewTab?: boolean;
  };
}

interface AppProps {
  config: WidgetConfig;
}

function AppContent({ config }: AppProps) {
  // Main widget state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'profile' | 'context'>('chat');
  const [widgetSize, setWidgetSize] = useState({ width: 380, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfileType | null>(null);
  const [contextEvents, setContextEvents] = useState<ContextEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showCustomerIdModal, setShowCustomerIdModal] = useState(false);

  const { widgetConfig } = useWidgetConfig(config.apiKey);
  const { t } = useLanguage();
  
  // Generate session ID for browsing history
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('porta_futuri_session_id');
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('porta_futuri_session_id', newId);
    return newId;
  });
  
  // Initialize browsing history tracking
  const { events, detectedIntent, clearHistory } = useBrowsingHistory(sessionId);

  // Restore widget state from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('porta_futuri_widget_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const age = Date.now() - state.timestamp;
        
        // Only restore if less than 30 minutes old
        if (age < 30 * 60 * 1000) {
          setActiveTab(state.activeTab || 'chat');
          setWidgetSize(state.widgetSize || { width: 380, height: 600 });
          setIsOpen(state.isOpen || false);
          if (state.customerId) {
            setCustomerId(state.customerId);
          }
        }
      } catch (error) {
        console.error('Failed to restore widget state:', error);
      }
    }
  }, []);

  // Save widget state on changes
  useEffect(() => {
    const state = {
      activeTab,
      widgetSize,
      isOpen,
      customerId,
      sessionId,
      timestamp: Date.now()
    };
    sessionStorage.setItem('porta_futuri_widget_state', JSON.stringify(state));
  }, [activeTab, widgetSize, isOpen, customerId, sessionId]);

  // Handle resize from top-left corner
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widgetSize.width;
    const startHeight = widgetSize.height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const deltaY = startY - moveEvent.clientY;
      
      const newWidth = Math.min(Math.max(startWidth + deltaX, 320), 600);
      const newHeight = Math.min(Math.max(startHeight + deltaY, 400), window.innerHeight * 0.9);
      
      setWidgetSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get customer ID from multiple sources
  const getCustomerId = (): string | null => {
    // 1. Check JavaScript variable (highest priority)
    if (window.PortaFuturi?.customerId) {
      return window.PortaFuturi.customerId;
    }

    // 2. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlCustomerId = urlParams.get("customer_id");
    if (urlCustomerId) {
      return urlCustomerId;
    }

    // 3. Check cookie
    const cookieValue = getCookie("porta_futuri_customer_id");
    if (cookieValue) {
      return cookieValue;
    }

    // 4. Check sessionStorage (for persistence)
    const sessionValue = sessionStorage.getItem("porta_futuri_customer_id");
    if (sessionValue) {
      return sessionValue;
    }

    // 5. Return null to trigger manual entry UI
    return null;
  };

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  // Initialize customer ID on mount (deferred - don't prompt upfront)
  useEffect(() => {
    const id = getCustomerId();
    if (id) {
      setCustomerId(id);
      fetchCDPData(id);
    }
    // Don't show customer ID input automatically - let users start chatting immediately
    loadData();
  }, [config.data]);

  // Fetch CDP data if customer ID is available
  const fetchCDPData = async (customerId: string) => {
    try {
      // Get Supabase URL and anon key from config or environment
      const supabaseUrl =
        config.apiUrl?.split("/functions")[0] ||
        import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/cdp-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          action: "fetch",
          customer_id: customerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cdp_available) {
          // CDP proxy now returns data in the correct format with fields
          setCustomerProfile(
            (prev) => ({
              ...prev,
              customer_id: customerId,
              cdp_data: data,
            } as CustomerProfileType)
          );
        }
      }
    } catch (error) {
      // Silently fallback to CSV data
    }
  };

  // Handle manual customer ID submission
  const handleCustomerIdSubmit = (id: string) => {
    setCustomerId(id);
    sessionStorage.setItem("porta_futuri_customer_id", id);
    setShowCustomerIdModal(false);
    fetchCDPData(id);
  };

  // Handle tab switching
  const handleTabChange = (tab: 'chat' | 'profile' | 'context') => {
    // If switching to profile and no customer ID, show modal
    if (tab === 'profile' && !customerId) {
      setShowCustomerIdModal(true);
      return;
    }
    setActiveTab(tab);
  };

  // Handle profile reset
  const handleProfileReset = () => {
    setCustomerId(null);
    setCustomerProfile(null);
    sessionStorage.removeItem('porta_futuri_customer_id');
    setShowCustomerIdModal(true);
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
            .then((res) => res.blob())
            .then((blob) => new File([blob], "products.csv"))
            .then((file) => csvProcessor.processProductCSV(file))
            .then((result) => {
              // Silently handle CSV errors - data still loads
              setProducts(result.data);
            }),
        );
      }

      // Load customer profile
      if (config.data?.customerProfileUrl) {
        promises.push(
          fetch(config.data.customerProfileUrl)
            .then((res) => res.blob())
            .then((blob) => new File([blob], "customer.csv"))
            .then((file) => csvProcessor.processCustomerCSV(file))
            .then((result) => {
              // Silently handle CSV errors - data still loads
              setCustomerProfile(result.data[0] || null);
            }),
        );
      }

      // Load context events
      if (config.data?.contextUrl) {
        promises.push(
          fetch(config.data.contextUrl)
            .then((res) => res.blob())
            .then((blob) => new File([blob], "context.csv"))
            .then((file) => csvProcessor.processContextCSV(file))
            .then((result) => {
              // Silently handle CSV errors - data still loads
              setContextEvents(result.data);
            }),
        );
      }

      await Promise.all(promises);
    } catch (error) {
      setDataError("Failed to load data. Please check your CSV files.");
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
        // Silently handle CSV errors - data still loads
        setProducts(result.data);
      }

      if (files.customer) {
        const result = await csvProcessor.processCustomerCSV(files.customer);
        // Silently handle CSV errors - data still loads
        setCustomerProfile(result.data[0] || null);
      }

      if (files.context) {
        const result = await csvProcessor.processContextCSV(files.context);
        // Silently handle CSV errors - data still loads
        setContextEvents(result.data);
      }
    } catch (error) {
      setDataError("Failed to process uploaded files.");
    } finally {
      setDataLoading(false);
    }
  };

  const position = config.position || widgetConfig?.position || "bottom-right";
  const theme = { ...widgetConfig?.theme, ...config.theme };

  // Apply theme CSS variables
  useEffect(() => {
    if (theme.primaryColor) {
      document.documentElement.style.setProperty(
        "--pf-primary",
        theme.primaryColor,
      );
    }
    if (theme.secondaryColor) {
      document.documentElement.style.setProperty(
        "--pf-secondary",
        theme.secondaryColor,
      );
    }
    if (theme.fontFamily) {
      document.documentElement.style.setProperty(
        "--pf-font-family",
        theme.fontFamily,
      );
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
        <div className="pf-widget-panel" style={{ width: `${widgetSize.width}px`, height: `${widgetSize.height}px`, cursor: isResizing ? 'nwse-resize' : 'auto' }}>
          {/* Top-left resize handle */}
          <div 
            className="pf-resize-handle-topleft" 
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              cursor: 'nwse-resize',
              zIndex: 10,
              background: 'linear-gradient(-45deg, transparent 45%, var(--pf-modern-border) 45%, var(--pf-modern-border) 55%, transparent 55%)',
            }}
          />
          <div className="pf-widget-header-enhanced">
            <h3 className="pf-widget-title-enhanced">{t("chat.title")}</h3>
            <div className="pf-widget-navigation">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`pf-nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
                title={t("navigation.chat") || "Chat"}
              >
                <MessageCircle size={18} />
              </button>
              <button 
                onClick={() => handleTabChange('profile')}
                className={`pf-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                title={t("navigation.profile") || "Profile"}
                style={{ position: "relative" }}
              >
                <User size={18} />
                {customerId && (
                  <span
                    className="pf-profile-indicator"
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      width: "8px",
                      height: "8px",
                      background: "#10a37f",
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('context')}
                className={`pf-nav-tab ${activeTab === 'context' ? 'active' : ''}`}
                title={t("navigation.context") || "Real-Time Context"}
                style={{ position: "relative" }}
              >
                <Activity size={18} />
                {detectedIntent && (
                  <span
                    className="pf-profile-indicator"
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      width: "8px",
                      height: "8px",
                      background: "#10a37f",
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                )}
              </button>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="pf-btn-close"
              title={t("common.close")}
            >
              <X size={20} />
            </button>
          </div>

          {dataLoading ? (
            <div className="pf-widget-loading">
              <div className="pf-spinner"></div>
              <p>{t("chat.loadingData")}</p>
            </div>
          ) : dataError ? (
            <div className="pf-widget-error">
              <p>{dataError}</p>
              <button onClick={loadData} className="pf-btn-primary">
                {t("chat.retryButton")}
              </button>
            </div>
          ) : activeTab === 'context' ? (
            <BrowsingHistory
              events={events}
              detectedIntent={detectedIntent}
              onClearHistory={clearHistory}
              onClose={() => setActiveTab('chat')}
            />
          ) : activeTab === 'profile' ? (
            <CustomerProfile
              profile={customerProfile}
              contextEvents={contextEvents}
              onClose={() => setActiveTab('chat')}
              onReset={handleProfileReset}
            />
          ) : (
            <ChatInterface
              apiKey={config.apiKey}
              apiUrl={config.apiUrl}
              products={products}
              customerProfile={customerProfile}
              contextEvents={contextEvents}
              onFileUpload={handleFileUpload}
              navigation={config.navigation}
            />
          )}
        </div>
      )}

      {/* Customer ID Modal */}
      <CustomerIdModal
        isOpen={showCustomerIdModal}
        onClose={() => setShowCustomerIdModal(false)}
        onSubmit={handleCustomerIdSubmit}
        allowSkip={true}
      />
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
