# PRP: Widget Navigation and UX Enhancements

**Created**: 2025-01-22
**Status**: Active
**Confidence Score**: 9/10

## Goal
Enhance the Porta Futuri widget with improved navigation, resizable interface, session persistence, and better user experience through modern icon-based navigation and profile management features.

## Why
Users need a more intuitive and flexible widget interface that maintains state across page refreshes, provides clear navigation between different views, and allows customization of the chat window size. The current 2-icon navigation is insufficient for the 3 main views, and the close buttons in sub-views create confusion.

## Context

### Requirements Reference
1. Enlarge header to fit "AI Apsipirkimo Asistentas" text and icons comfortably
2. Replace 2 icons with 3 modern icons: Chat, Profile, Real-Time Context
3. Only highlight active tab icon
4. Remove close ("X") buttons from Profile and Real-Time Context views
5. Make chat window resizable by users
6. Prevent session loss on page refresh with manual refresh context button
7. Add profile reset functionality to clear and enter new customer ID

### Existing Code Patterns

#### Current Navigation Structure (src/widget/App.tsx:327-404)
```typescript
<div className="pf-widget-header">
  <h3 className="pf-widget-title">{t("chat.title")}</h3>
  <div className="pf-widget-actions">
    <button onClick={() => setShowBrowsingHistory(!showBrowsingHistory)} className="pf-btn-icon">📊</button>
    <button onClick={handleProfileClick} className="pf-btn-icon">👤</button>
    <button onClick={() => setIsOpen(false)} className="pf-btn-icon">✕</button>
  </div>
</div>
```

#### Session Storage Pattern (src/widget/App.tsx:72-78)
```typescript
const [sessionId] = useState(() => {
  const stored = sessionStorage.getItem('porta_futuri_session_id');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('porta_futuri_session_id', newId);
  return newId;
});
```

#### CSS Variables (src/widget/styles/widget.css)
- Header height: Implicit (needs explicit sizing)
- Icon button size: 32px x 32px
- Widget panel: 380px width, 600px height

### Dependencies Available
- `lucide-react` (v0.400.0) - For modern icons
- `@radix-ui/react-tabs` - For tab navigation
- React 18.3 with TypeScript
- TailwindCSS for styling

## Implementation Blueprint

### Phase 1: Header and Navigation Enhancement

1. **Update Header Styling**
   - Increase header padding from 1rem to 1.25rem
   - Increase title font size from 16px to 18px
   - Ensure minimum header height of 70px

2. **Implement 3-Tab Navigation**
   - Replace current 2-button system with 3 icon tabs
   - Use lucide-react icons: MessageCircle (Chat), User (Profile), Activity (Real-Time Context)
   - Implement active state highlighting with primary color

3. **Remove Close Buttons from Sub-Views**
   - Remove close button from CustomerProfile component (line 55-79)
   - Remove close button from BrowsingHistory component (line 127-151)
   - Keep only main close button in widget header

### Phase 2: Resizable Widget Implementation

1. **Add Resize Handle**
   - Create resize handle at widget edges (right and bottom)
   - Use CSS resize property or implement custom drag handler
   - Store size preferences in sessionStorage

2. **Size Constraints**
   - Min width: 320px, Max width: 600px
   - Min height: 400px, Max height: 90vh
   - Maintain aspect ratio options

### Phase 3: Session Persistence

1. **State Persistence**
   - Save widget state to sessionStorage on changes
   - Restore on mount if session exists
   - Include: activeTab, isOpen, customerId, widgetSize, conversationHistory

2. **Manual Context Refresh**
   - Add refresh button in chat interface
   - Clear and reload context data without losing session

### Phase 4: Profile Management

1. **Profile Reset Feature**
   - Add "Clear Profile" button in CustomerProfile component
   - Clear customerId from sessionStorage
   - Show CustomerIdModal for new ID entry

2. **Profile Switching**
   - Allow changing customer ID without clearing entire session
   - Maintain conversation history per customer ID

## Detailed Implementation Steps

### File: src/widget/App.tsx

```typescript
// 1. Add new state for active tab and widget size
const [activeTab, setActiveTab] = useState<'chat' | 'profile' | 'context'>('chat');
const [widgetSize, setWidgetSize] = useState({ width: 380, height: 600 });

// 2. Enhanced session restoration
useEffect(() => {
  const savedState = sessionStorage.getItem('porta_futuri_widget_state');
  if (savedState) {
    const state = JSON.parse(savedState);
    setActiveTab(state.activeTab || 'chat');
    setWidgetSize(state.widgetSize || { width: 380, height: 600 });
    setIsOpen(state.isOpen || false);
    // Restore other state...
  }
}, []);

// 3. Save state on changes
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

// 4. New navigation structure
<div className="pf-widget-header-enhanced">
  <h3 className="pf-widget-title-enhanced">{t("chat.title")}</h3>
  <div className="pf-widget-navigation">
    <button 
      onClick={() => setActiveTab('chat')}
      className={`pf-nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
      title={t("navigation.chat")}
    >
      <MessageCircle size={18} />
    </button>
    <button 
      onClick={() => handleTabChange('profile')}
      className={`pf-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
      title={t("navigation.profile")}
    >
      <User size={18} />
    </button>
    <button 
      onClick={() => setActiveTab('context')}
      className={`pf-nav-tab ${activeTab === 'context' ? 'active' : ''}`}
      title={t("navigation.context")}
    >
      <Activity size={18} />
    </button>
  </div>
  <button onClick={() => setIsOpen(false)} className="pf-btn-close">
    <X size={20} />
  </button>
</div>

// 5. Tab content rendering
{activeTab === 'chat' && <ChatInterface ... />}
{activeTab === 'profile' && <CustomerProfile ... onReset={handleProfileReset} />}
{activeTab === 'context' && <BrowsingHistory ... />}
```

### File: src/widget/styles/widget.css

```css
/* Enhanced header styles */
.pf-widget-header-enhanced {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  min-height: 70px;
  border-bottom: 1px solid var(--pf-modern-border);
  background: var(--pf-modern-surface);
  gap: 1rem;
}

.pf-widget-title-enhanced {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Navigation tabs */
.pf-widget-navigation {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: 0.5rem;
}

.pf-nav-tab {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--pf-modern-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--pf-modern-muted);
}

.pf-nav-tab:hover {
  background: var(--pf-modern-surface);
  transform: translateY(-1px);
}

.pf-nav-tab.active {
  background: var(--pf-modern-primary);
  border-color: var(--pf-modern-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
}

/* Resizable widget */
.pf-widget-panel-resizable {
  resize: both;
  overflow: auto;
  min-width: 320px;
  max-width: 600px;
  min-height: 400px;
  max-height: 90vh;
  position: relative;
}

.pf-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--pf-modern-border) 50%);
}
```

### File: src/widget/components/CustomerProfile.tsx

```typescript
// Add profile reset functionality
interface CustomerProfileProps {
  profile: CustomerProfileType | null;
  contextEvents: ContextEvent[];
  onReset?: () => void; // New prop
}

// Add reset button in the profile section
<button
  onClick={onReset}
  style={{
    padding: "8px 16px",
    background: "#ff4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  }}
>
  {t("profile.clearProfile")}
</button>
```

### File: src/widget/services/i18n/translations.ts

```typescript
// Add new translation keys
navigation: {
  chat: "Chat",
  profile: "Profile", 
  context: "Real-Time Context"
},
profile: {
  clearProfile: "Clear Profile",
  enterNewId: "Enter New ID",
  // ... existing translations
}
```

### File: src/widget/hooks/useResizable.tsx (NEW)

```typescript
import { useState, useEffect, useCallback } from 'react';

interface Size {
  width: number;
  height: number;
}

export const useResizable = (initialSize: Size, constraints: {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}) => {
  const [size, setSize] = useState<Size>(() => {
    const saved = sessionStorage.getItem('porta_futuri_widget_size');
    return saved ? JSON.parse(saved) : initialSize;
  });

  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback((e: MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.min(Math.max(e.clientX, constraints.minWidth), constraints.maxWidth);
    const newHeight = Math.min(Math.max(e.clientY, constraints.minHeight), constraints.maxHeight);
    
    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, constraints]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, resize, stopResize]);

  useEffect(() => {
    sessionStorage.setItem('porta_futuri_widget_size', JSON.stringify(size));
  }, [size]);

  return { size, startResize, isResizing };
};
```

## Validation Gates

### 1. Syntax and Type Checking
```bash
npm run typecheck
npm run lint
```

### 2. Visual Testing Checklist
- [ ] Header text "AI Apsipirkimo Asistentas" displays without truncation
- [ ] All 3 navigation icons are visible and properly spaced
- [ ] Active tab highlighting works correctly
- [ ] No close buttons appear in Profile or Context views
- [ ] Widget can be resized smoothly
- [ ] Resize constraints are enforced (min/max dimensions)

### 3. Functional Testing
```bash
# Test session persistence
# 1. Open widget, change tabs, resize
# 2. Refresh page
# 3. Verify state is restored

# Test profile reset
# 1. Enter customer ID
# 2. Click Clear Profile
# 3. Verify modal appears for new ID

# Test navigation
# 1. Click each tab icon
# 2. Verify correct content displays
# 3. Verify active state updates
```

### 4. Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile responsive behavior

### 5. Performance Metrics
- [ ] Header render < 50ms
- [ ] Tab switching < 100ms
- [ ] Resize operation smooth (60fps)
- [ ] Session save/restore < 10ms

## Error Handling

1. **Session Restoration Failures**
   - Gracefully fallback to default state
   - Log error to console
   - Don't show error to user

2. **Resize Boundary Violations**
   - Enforce min/max constraints
   - Smooth boundary snapping
   - Visual feedback at limits

3. **Missing Translations**
   - Fallback to English
   - Log missing keys
   - Use key as placeholder

## Security Considerations

1. **SessionStorage Validation**
   - Validate JSON structure before parsing
   - Sanitize stored customer IDs
   - Clear expired sessions (>24 hours)

2. **XSS Prevention**
   - Sanitize all user inputs
   - Use React's built-in escaping
   - Validate customerID format

## Success Criteria

1. Header accommodates full title and 3 icons without overflow
2. Navigation between tabs is smooth and intuitive
3. Active tab is clearly indicated
4. Widget size persists across refreshes
5. Profile can be cleared and re-entered
6. Session data survives page refresh
7. No close buttons in sub-views
8. Resize works smoothly within constraints

## Documentation Updates

Update CLAUDE.md with:
- New navigation pattern
- Session persistence behavior
- Resizable widget constraints
- Profile management features

## Rollback Plan

If issues arise:
1. Revert to previous navigation (2 icons)
2. Disable resize functionality
3. Clear sessionStorage for fresh start
4. Restore close buttons in sub-views

## Dependencies and External Resources

### NPM Packages (Already Installed)
- lucide-react: Icon library
- @radix-ui/react-tabs: Tab component foundation

### References
- [React Resizable Panels Best Practices](https://www.patterns.dev/posts/resizable-panels)
- [Session Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [Lucide Icons](https://lucide.dev/icons/)

## Quality Score: 9/10

**Confidence Level**: High confidence in implementation success due to:
- Clear existing patterns to follow
- All dependencies already available
- Well-defined validation criteria
- Comprehensive error handling
- Clear rollback strategy

**Risk Factors** (1 point deduction):
- Resize implementation may need cross-browser testing
- Session persistence edge cases with multiple tabs