import React from "react";
import {
  CustomerProfile as CustomerProfileType,
  ContextEvent,
} from "@shared/types";
import { useLanguage } from "../hooks/useLanguage";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";

interface CustomerProfileProps {
  profile: CustomerProfileType | null;
  contextEvents: ContextEvent[];
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  profile,
  contextEvents,
  onClose,
}) => {
  const { t } = useLanguage();
  const recentEvents = contextEvents.slice(0, 10);
  
  // Debug logging
  console.log('[DEBUG CustomerProfile] Profile received:', profile);
  console.log('[DEBUG CustomerProfile] CDP Data:', profile?.cdp_data);
  console.log('[DEBUG CustomerProfile] CDP Fields:', profile?.cdp_data?.fields);
  console.log('[DEBUG CustomerProfile] Has fields?', profile?.cdp_data?.fields && Object.keys(profile.cdp_data.fields).length > 0);

  return (
    <div
      style={{
        height: "calc(100% - 60px)",
        overflowY: "auto",
        background: "#f7f7f8",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          background: "white",
          borderBottom: "1px solid #e5e5e7",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "600",
            color: "#0d0d0d",
          }}
        >
          {t("profile.title")}
        </h3>
        <button
          onClick={onClose}
          style={{
            width: "32px",
            height: "32px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            transition: "background 0.2s",
            color: "#6e6e80",
            fontSize: "18px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        {profile ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Profile Card */}
            <section
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e5e7",
              }}
            >
              {/* Avatar and ID */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background:
                      "linear-gradient(135deg, #10a37f 0%, #0ea570 100%)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    color: "white",
                  }}
                >
                  👤
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#0d0d0d",
                    }}
                  >
                    {profile.customer_id}
                  </h4>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "14px",
                      color: "#6e6e80",
                    }}
                  >
                    {t("profile.customerId")}
                  </p>
                </div>
              </div>

              {/* Dynamic Customer Data */}
              {profile.cdp_data?.fields &&
              Object.keys(profile.cdp_data.fields).length > 0 ? (
                <>
                  <h5
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6e6e80",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "12px",
                    }}
                  >
                    {t("profile.customerData")}
                  </h5>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {Object.entries(profile.cdp_data.fields)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([fieldKey, field]) => (
                        <DynamicFieldRenderer
                          key={fieldKey}
                          fieldKey={fieldKey}
                          field={field}
                        />
                      ))}
                  </div>
                </>
              ) : (
                /* Fallback to legacy fields if no dynamic data */
                <>
                  <h5
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6e6e80",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "12px",
                    }}
                  >
                    {t("profile.basicInfo")}
                  </h5>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {profile.age_group && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#6e6e80" }}>
                          {t("profile.ageGroup")}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#0d0d0d",
                            fontWeight: "500",
                          }}
                        >
                          {profile.age_group}
                        </span>
                      </div>
                    )}
                    {profile.gender && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#6e6e80" }}>
                          {t("profile.gender")}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#0d0d0d",
                            fontWeight: "500",
                          }}
                        >
                          {profile.gender}
                        </span>
                      </div>
                    )}
                    {profile.location && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#6e6e80" }}>
                          {t("profile.location")}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#0d0d0d",
                            fontWeight: "500",
                          }}
                        >
                          {profile.location}
                        </span>
                      </div>
                    )}
                    {profile.segment && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#6e6e80" }}>
                          {t("profile.segment")}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#0d0d0d",
                            fontWeight: "500",
                          }}
                        >
                          {profile.segment}
                        </span>
                      </div>
                    )}
                    {profile.lifetime_value !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#6e6e80" }}>
                          {t("profile.lifetimeValue")}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#10a37f",
                            fontWeight: "600",
                          }}
                        >
                          ${profile.lifetime_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Preferences */}
            {profile.preferences && profile.preferences.length > 0 && (
              <section
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e5e5e7",
                }}
              >
                <h5
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6e6e80",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "12px",
                  }}
                >
                  {t("profile.preferences")}
                </h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {profile.preferences.map((pref, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "6px 12px",
                        background:
                          "linear-gradient(135deg, #10a37f 0%, #0ea570 100%)",
                        color: "white",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Activity */}
            {recentEvents.length > 0 && (
              <section
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e5e5e7",
                }}
              >
                <h5
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6e6e80",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "16px",
                  }}
                >
                  {t("profile.recentActivity")}
                </h5>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {recentEvents.map((event, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px",
                        background: "#f7f7f8",
                        borderRadius: "8px",
                        border: "1px solid #e5e5e7",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#0d0d0d",
                            textTransform: "capitalize",
                          }}
                        >
                          {t(`events.${event.event_type}`) ||
                            event.event_type.replace("_", " ")}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6e6e80",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.product_id && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6e6e80",
                            marginTop: "4px",
                          }}
                        >
                          <span style={{ fontWeight: "500" }}>
                            {t("profile.product")}:
                          </span>{" "}
                          {event.product_id}
                        </div>
                      )}
                      {event.category_viewed && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6e6e80",
                            marginTop: "4px",
                          }}
                        >
                          <span style={{ fontWeight: "500" }}>
                            {t("profile.category")}:
                          </span>{" "}
                          {event.category_viewed}
                        </div>
                      )}
                      {event.search_query && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6e6e80",
                            marginTop: "4px",
                          }}
                        >
                          <span style={{ fontWeight: "500" }}>
                            {t("profile.search")}:
                          </span>{" "}
                          "{event.search_query}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e5e5e7",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#f7f7f8",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "28px",
                color: "#6e6e80",
              }}
            >
              👤
            </div>
            <p
              style={{
                color: "#6e6e80",
                fontSize: "14px",
                margin: 0,
              }}
            >
              {t("profile.noProfile")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
