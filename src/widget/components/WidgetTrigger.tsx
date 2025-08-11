import React from 'react';

interface WidgetTriggerProps {
  onClick: () => void;
  isOpen: boolean;
  position: string;
}

export const WidgetTrigger: React.FC<WidgetTriggerProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="pf-widget-trigger"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'hsl(var(--pf-primary))',
        border: 'none',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        fontSize: '24px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }}
    >
      {isOpen ? '✕' : '💬'}
    </button>
  );
};