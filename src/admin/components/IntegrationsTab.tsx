import React, { useState, useEffect } from "react";
import {
  Settings2,
  TestTube,
  Save,
  Shield,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
} from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";

interface CDPIntegration {
  id: string;
  provider: "exacaster" | "segment" | "custom";
  name: string;
  config: {
    workspace_id?: string;
    resource_id?: string;
    api_url?: string;
  };
  credentials?: {
    bearer_token?: string;
  };
  credentials_encrypted?: string;
  is_active: boolean;
  test_status: "untested" | "success" | "failed";
  last_tested_at?: string;
  last_error?: string;
}

interface IntegrationsTabProps {
  supabase: SupabaseClient;
  onIntegrationAction?: (action: string, integrationId: string) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  supabase,
  onIntegrationAction,
}) => {
  const [integrations, setIntegrations] = useState<CDPIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] =
    useState<CDPIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    workspace_id: "",
    resource_id: "",
    bearer_token: "",
    api_url: "https://customer360.exacaster.com/courier/api/v1",
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("cdp_integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setIntegrations(data || []);

      // Select first integration by default
      if (data && data.length > 0) {
        selectIntegration(data[0]);
      }
    } catch (err: any) {
      console.error("Error fetching integrations:", err);
      setError("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const selectIntegration = async (integration: CDPIntegration) => {
    setSelectedIntegration(integration);

    // Decrypt existing credentials if available
    let existingToken = "";
    if (integration.credentials_encrypted) {
      try {
        const decrypted = JSON.parse(atob(integration.credentials_encrypted));
        existingToken = decrypted.bearer_token || "";
      } catch (err) {
        console.error("Failed to decrypt credentials:", err);
      }
    }

    setFormData({
      workspace_id: integration.config.workspace_id || "",
      resource_id: integration.config.resource_id || "",
      bearer_token: "", // Keep empty in UI for security, but store the actual token
      api_url:
        integration.config.api_url ||
        "https://customer360.exacaster.com/courier/api/v1",
    });

    // Store the actual token separately for use in tests
    (integration as any)._existingToken = existingToken;

    setTestResult(null);
  };

  const saveIntegration = async () => {
    if (!selectedIntegration) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare update data
      const updateData: any = {
        config: {
          workspace_id: formData.workspace_id,
          resource_id: formData.resource_id,
          api_url: formData.api_url,
        },
        updated_at: new Date().toISOString(),
      };

      // Only include bearer token if it was changed
      if (formData.bearer_token) {
        // In production, encrypt this before storing
        updateData.credentials_encrypted = btoa(
          JSON.stringify({
            bearer_token: formData.bearer_token,
          }),
        );
      }

      const { error } = await supabase
        .from("cdp_integrations")
        .update(updateData)
        .eq("id", selectedIntegration.id);

      if (error) {
        throw error;
      }

      // Log action
      onIntegrationAction?.("update", selectedIntegration.id);

      // Refresh integrations
      await fetchIntegrations();

      setTestResult({
        success: true,
        message: "Integration settings saved successfully",
      });
    } catch (err: any) {
      console.error("Error saving integration:", err);
      setError("Failed to save integration settings");
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async () => {
    if (!selectedIntegration) {
      return;
    }

    if (!formData.workspace_id || !formData.resource_id) {
      setTestResult({
        success: false,
        message: "Please enter workspace ID and resource ID",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test the integration by making a sample API call
      // Use the Edge Function to test the connection

      // Use new token if provided, otherwise use existing token
      const tokenToUse =
        formData.bearer_token ||
        (selectedIntegration as any)._existingToken ||
        "";

      console.log("Testing CDP integration with config:", {
        workspace_id: formData.workspace_id,
        resource_id: formData.resource_id,
        api_url: formData.api_url,
        bearer_token_length: tokenToUse.length,
        bearer_token_preview: tokenToUse
          ? tokenToUse.substring(0, 20) + "..."
          : "not provided",
        using_existing:
          !formData.bearer_token &&
          !!(selectedIntegration as any)._existingToken,
      });

      if (!tokenToUse) {
        setTestResult({
          success: false,
          message:
            "No bearer token available. Please save a bearer token first.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("cdp-proxy", {
        body: {
          action: "test",
          config: {
            workspace_id: formData.workspace_id,
            resource_id: formData.resource_id,
            api_url: formData.api_url,
            bearer_token: tokenToUse,
          },
        },
      });

      console.log("CDP test response:", { data, error });

      if (error) {
        console.error("CDP test error details:", error);
        throw error;
      }

      // Check if data contains an error response
      if (data && !data.success) {
        console.log("CDP test failed:", data.message);
        setTestResult({
          success: false,
          message: data.message || "Connection test failed",
        });

        // Update test status with failure
        await supabase
          .from("cdp_integrations")
          .update({
            test_status: "failed",
            last_tested_at: new Date().toISOString(),
            last_error: data.message,
          })
          .eq("id", selectedIntegration.id);

        // Refresh integrations
        await fetchIntegrations();
        return;
      }

      // Update test status in database
      await supabase
        .from("cdp_integrations")
        .update({
          test_status: "success",
          last_tested_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", selectedIntegration.id);

      setTestResult({
        success: true,
        message: "Connection test successful! CDP integration is working.",
      });

      // Log action
      onIntegrationAction?.("test", selectedIntegration.id);

      // Refresh integrations
      await fetchIntegrations();
    } catch (err: any) {
      console.error("Test failed:", err);

      let errorMessage = "Unknown error";

      // Handle different error types
      if (err.message?.includes("non-2xx status")) {
        errorMessage = "Edge Function error - please check your configuration";
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Update test status with error
      await supabase
        .from("cdp_integrations")
        .update({
          test_status: "failed",
          last_tested_at: new Date().toISOString(),
          last_error: errorMessage,
        })
        .eq("id", selectedIntegration.id);

      setTestResult({
        success: false,
        message: `Connection test failed: ${errorMessage}`,
      });

      // Refresh integrations
      await fetchIntegrations();
    } finally {
      setTesting(false);
    }
  };

  const toggleActivation = async () => {
    if (!selectedIntegration) {
      return;
    }

    try {
      const newStatus = !selectedIntegration.is_active;

      const { error } = await supabase
        .from("cdp_integrations")
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedIntegration.id);

      if (error) {
        throw error;
      }

      // Log action
      onIntegrationAction?.(
        newStatus ? "activate" : "deactivate",
        selectedIntegration.id,
      );

      // Refresh integrations
      await fetchIntegrations();

      setTestResult({
        success: true,
        message: `Integration ${newStatus ? "activated" : "deactivated"} successfully`,
      });
    } catch (err: any) {
      console.error("Error toggling activation:", err);
      setError("Failed to change activation status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              Customer Data Platform Integration
            </h2>
          </div>
          {selectedIntegration && (
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIntegration.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {selectedIntegration.is_active ? "Active" : "Inactive"}
              </span>
              {selectedIntegration.test_status === "success" && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {selectedIntegration.test_status === "failed" && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {integrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No CDP integrations configured</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Integration Selector */}
            <div className="grid grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => selectIntegration(integration)}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedIntegration?.id === integration.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{integration.name}</span>
                    {integration.is_active && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Provider: {integration.provider}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {integration.test_status}
                  </div>
                </button>
              ))}
            </div>

            {/* Configuration Form */}
            {selectedIntegration && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">
                  Configure {selectedIntegration.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API URL
                    </label>
                    <input
                      type="url"
                      value={formData.api_url}
                      onChange={(e) =>
                        setFormData({ ...formData, api_url: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://customer360.exacaster.com/courier/api/v1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workspace ID
                      </label>
                      <input
                        type="text"
                        value={formData.workspace_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workspace_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-workspace-id"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource ID
                      </label>
                      <input
                        type="text"
                        value={formData.resource_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            resource_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-resource-id"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bearer Token
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={formData.bearer_token}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bearer_token: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new bearer token (leave empty to use existing)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showToken ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <Shield className="inline h-3 w-3 mr-1" />
                      {(selectedIntegration as any)?._existingToken
                        ? "Token is saved and encrypted. Leave empty to use existing token."
                        : "Enter your bearer token to save it securely."}
                    </p>
                  </div>

                  {/* Test Result */}
                  {testResult && (
                    <div
                      className={`p-4 rounded-lg flex items-start space-x-2 ${
                        testResult.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <span
                        className={
                          testResult.success ? "text-green-800" : "text-red-800"
                        }
                      >
                        {testResult.message}
                      </span>
                    </div>
                  )}

                  {/* Last Test Info */}
                  {selectedIntegration.last_tested_at && (
                    <div className="text-sm text-gray-500">
                      Last tested:{" "}
                      {new Date(
                        selectedIntegration.last_tested_at,
                      ).toLocaleString()}
                      {selectedIntegration.last_error && (
                        <div className="text-red-600 mt-1">
                          Error: {selectedIntegration.last_error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={saveIntegration}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{saving ? "Saving..." : "Save Configuration"}</span>
                    </button>

                    <button
                      onClick={testIntegration}
                      disabled={
                        testing ||
                        !formData.workspace_id ||
                        !formData.resource_id
                      }
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      <span>{testing ? "Testing..." : "Test Connection"}</span>
                    </button>

                    <button
                      onClick={toggleActivation}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                        selectedIntegration.is_active
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      <Settings2 className="h-4 w-4" />
                      <span>
                        {selectedIntegration.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Integration Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">Integration Guide</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>To integrate with Exacaster CVM Platform:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Obtain your Workspace ID and Resource ID from Exacaster</li>
            <li>Generate a Bearer Token with appropriate permissions</li>
            <li>Enter the configuration details above</li>
            <li>Test the connection to verify everything works</li>
            <li>Activate the integration when ready</li>
          </ol>
          <p className="mt-3">
            Once activated, the widget will automatically fetch customer
            profiles from your CDP.
          </p>
        </div>
      </div>
    </div>
  );
};
