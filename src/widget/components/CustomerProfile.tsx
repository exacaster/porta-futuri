import React from 'react';
import { CustomerProfile as CustomerProfileType, ContextEvent } from '@shared/types';

interface CustomerProfileProps {
  profile: CustomerProfileType | null;
  contextEvents: ContextEvent[];
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ 
  profile, 
  contextEvents, 
  onClose 
}) => {
  const recentEvents = contextEvents.slice(0, 10);
  
  return (
    <div style={{ padding: '1rem', height: 'calc(100% - 60px)', overflowY: 'auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Customer Profile</h3>
        <button
          onClick={onClose}
          className="pf-btn-icon"
          style={{ width: '24px', height: '24px' }}
        >
          ✕
        </button>
      </div>

      {profile ? (
        <div>
          <section style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--pf-muted-foreground))' }}>
              Basic Information
            </h4>
            <div style={{ background: 'hsl(var(--pf-secondary))', padding: '0.75rem', borderRadius: 'var(--pf-radius)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Customer ID:</strong> {profile.customer_id}
              </div>
              {profile.age_group && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Age Group:</strong> {profile.age_group}
                </div>
              )}
              {profile.gender && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Gender:</strong> {profile.gender}
                </div>
              )}
              {profile.location && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Location:</strong> {profile.location}
                </div>
              )}
              {profile.segment && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Segment:</strong> {profile.segment}
                </div>
              )}
              {profile.lifetime_value !== undefined && (
                <div>
                  <strong>Lifetime Value:</strong> ${profile.lifetime_value}
                </div>
              )}
            </div>
          </section>

          {profile.preferences && profile.preferences.length > 0 && (
            <section style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--pf-muted-foreground))' }}>
                Preferences
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.preferences.map((pref, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'hsl(var(--pf-primary))',
                      color: 'hsl(var(--pf-primary-foreground))',
                      borderRadius: 'calc(var(--pf-radius) - 2px)',
                      fontSize: '12px',
                    }}
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'hsl(var(--pf-muted-foreground))', padding: '2rem' }}>
          <p>No customer profile loaded</p>
        </div>
      )}

      {recentEvents.length > 0 && (
        <section>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--pf-muted-foreground))' }}>
            Recent Activity
          </h4>
          <div style={{ background: 'hsl(var(--pf-secondary))', padding: '0.75rem', borderRadius: 'var(--pf-radius)' }}>
            {recentEvents.map((event, i) => (
              <div
                key={i}
                style={{
                  padding: '0.5rem 0',
                  borderBottom: i < recentEvents.length - 1 ? '1px solid hsl(var(--pf-border))' : 'none',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong>{event.event_type.replace('_', ' ').toUpperCase()}</strong>
                  <span style={{ color: 'hsl(var(--pf-muted-foreground))', fontSize: '11px' }}>
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                {event.product_id && (
                  <div style={{ fontSize: '12px', color: 'hsl(var(--pf-muted-foreground))' }}>
                    Product: {event.product_id}
                  </div>
                )}
                {event.category_viewed && (
                  <div style={{ fontSize: '12px', color: 'hsl(var(--pf-muted-foreground))' }}>
                    Category: {event.category_viewed}
                  </div>
                )}
                {event.search_query && (
                  <div style={{ fontSize: '12px', color: 'hsl(var(--pf-muted-foreground))' }}>
                    Search: "{event.search_query}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};