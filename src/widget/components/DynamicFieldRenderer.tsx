import React from "react";
import { FieldValue } from "@shared/types";
import { useLanguage } from "../hooks/useLanguage";

interface DynamicFieldRendererProps {
  fieldKey: string;
  field: FieldValue;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  fieldKey,
  field,
}) => {
  const { t } = useLanguage();

  const renderValue = () => {
    switch (field.type) {
      case "boolean":
        return field.value ? t("common.yes") : t("common.no");
      case "number":
        // Check if field name suggests currency
        if (
          fieldKey.includes("revenue") ||
          fieldKey.includes("value") ||
          fieldKey.includes("price")
        ) {
          return `$${field.value.toLocaleString()}`;
        }
        return field.value.toLocaleString();
      case "date":
        return new Date(field.value).toLocaleDateString();
      case "array":
        return Array.isArray(field.value)
          ? field.value.join(", ")
          : String(field.value);
      case "object":
        return JSON.stringify(field.value, null, 2);
      default:
        return String(field.value);
    }
  };

  const getValueColor = () => {
    if (field.type === "boolean") {
      return field.value ? "#10a37f" : "#ef4444";
    }
    return "#0d0d0d";
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "14px", color: "#6e6e80" }}>
        {field.display_name || fieldKey}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: getValueColor(),
          fontWeight: "500",
        }}
      >
        {renderValue()}
      </span>
    </div>
  );
};
