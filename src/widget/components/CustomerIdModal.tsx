import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface CustomerIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerId: string) => void;
  allowSkip?: boolean;
}

export const CustomerIdModal: React.FC<CustomerIdModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allowSkip = true
}) => {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomerId('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (customerId.trim()) {
      setIsSubmitting(true);
      onSubmit(customerId.trim());
      // Modal will be closed by parent component
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customerId.trim()) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="pf-modal-backdrop"
        onClick={allowSkip ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'pf-fade-in 0.2s ease-out',
          cursor: allowSkip ? 'pointer' : 'default'
        }}
      />
      
      {/* Modal */}
      <div 
        className="pf-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '440px',
          width: 'calc(100% - 40px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 10001,
          animation: 'pf-slide-up 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {allowSkip && (
          <button
            onClick={onClose}
            className="pf-modal-close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s',
              color: '#6e6e80',
              fontSize: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f7f7f8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        )}

        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #10a37f 0%, #0ea570 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          fontSize: '24px',
          color: 'white'
        }}>
          👤
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#0d0d0d',
          marginBottom: '12px',
          lineHeight: '1.3'
        }}>
          {t('modal.customerIdTitle')}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: '14px',
          color: '#6e6e80',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {t('modal.customerIdDescription')}
        </p>

        {/* Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            ref={inputRef}
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('modal.customerIdPlaceholder')}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #e5e5e7',
              borderRadius: '8px',
              background: 'white',
              color: '#0d0d0d',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10a37f';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 163, 127, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e5e7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {allowSkip && (
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6e6e80',
                background: 'transparent',
                border: '1px solid #e5e5e7',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#f7f7f8';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {t('modal.skipForNow')}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!customerId.trim() || isSubmitting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              background: customerId.trim() && !isSubmitting 
                ? 'linear-gradient(135deg, #10a37f 0%, #0ea570 100%)' 
                : '#e5e5e7',
              border: 'none',
              borderRadius: '8px',
              cursor: customerId.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: customerId.trim() && !isSubmitting 
                ? '0 1px 2px rgba(0, 0, 0, 0.05)' 
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (customerId.trim() && !isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = customerId.trim() && !isSubmitting 
                ? '0 1px 2px rgba(0, 0, 0, 0.05)' 
                : 'none';
            }}
          >
            {isSubmitting ? t('common.loading') : t('common.continue')}
          </button>
        </div>
      </div>
    </>
  );
};