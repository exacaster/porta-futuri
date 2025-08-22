import React from "react";

interface WidgetTriggerProps {
  onClick: () => void;
  isOpen: boolean;
  position: string;
}

export const WidgetTrigger: React.FC<WidgetTriggerProps> = ({
  onClick,
  isOpen,
}) => {
  return (
    <button
      onClick={onClick}
      className="pf-widget-trigger"
      aria-label={isOpen ? "Close chat" : "Open chat"}
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6d02a3 0%, #b12df4 100%)",
        border: "2px solid white",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow:
          "0 8px 16px -2px rgba(109, 2, 163, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.2)",
        transition: "transform 0.2s, box-shadow 0.2s",
        fontSize: "24px",
        position: "relative",
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow =
          "0 12px 20px -3px rgba(109, 2, 163, 0.5), 0 6px 10px -2px rgba(0, 0, 0, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow =
          "0 8px 16px -2px rgba(109, 2, 163, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.2)";
      }}
    >
      {isOpen ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ) : (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )}
    </button>
  );
};
