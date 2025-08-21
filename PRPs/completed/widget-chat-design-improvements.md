name: "Widget Chat Design Improvements - Modern UI with Language Support"
description: |

## Purpose
Comprehensive modernization of the Porta Futuri widget chat interface to implement deferred customer ID entry, OpenAI-inspired modern UI, and automatic language detection.

## Core Principles
1. **Modern Minimalist Design**: Clean, spacious, professional inspired by OpenAI.com
2. **User-Friendly Flow**: Don't require customer ID upfront - only when needed
3. **International Support**: Auto-detect and use page language
4. **Progressive Enhancement**: Start simple, validate, enhance iteratively

---

## Goal
Transform the widget chat interface into a modern, minimalist design inspired by OpenAI.com with:
- Deferred customer ID entry (only when profile icon is clicked)
- Beautiful, modern UI for customer profile display
- Automatic language detection from page's html lang attribute

## Why
- **Better UX**: Users can start chatting immediately without friction
- **Modern Appeal**: OpenAI-style interface creates professional, trustworthy impression  
- **International**: Automatic language support for Lithuanian/English markets
- **Increased Engagement**: Lower barrier to entry increases usage

## What
### User-visible behavior:
1. Widget loads WITHOUT requiring customer ID
2. Chat interface uses modern, clean design similar to OpenAI.com
3. Widget automatically speaks in page's language (Lithuanian/English)
4. Customer profile accessible via profile icon with beautiful modern UI
5. Customer ID requested only when profile icon clicked (if not already set)

### Success Criteria
- [ ] Widget loads without customer ID prompt
- [ ] Chat interface matches modern OpenAI-inspired design
- [ ] Language automatically detected from page
- [ ] Profile view has modern, beautiful UI
- [ ] Customer ID modal appears only when profile clicked
- [ ] All existing functionality preserved

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://platform.openai.com/docs/guides/chat
  why: Study OpenAI's chat interface patterns and design language
  
- file: /src/widget/App.tsx
  why: Main widget component that needs modification for deferred customer ID
  lines: 90-140 (customer ID initialization logic)
  
- file: /src/widget/components/CustomerProfile.tsx
  why: Profile component that needs UI redesign
  
- file: /src/widget/components/ChatInterface.tsx
  why: Chat interface that needs modern UI update
  
- file: /src/demo-site/i18n.ts
  why: Reference for i18n implementation pattern
  
- doc: https://ui.shadcn.com/docs/components
  section: Card, Dialog, Avatar, Badge components
  critical: Modern component patterns for clean UI
  
- docfile: /CLAUDE.md
  why: Project guidelines and constraints
```

### Current Codebase Structure
```bash
src/widget/
├── App.tsx                      # Main widget app - handles customer ID
├── components/
│   ├── ChatInterface.tsx        # Chat UI - needs modernization
│   ├── CustomerProfile.tsx      # Profile display - needs redesign
│   └── WidgetTrigger.tsx        # Widget button
├── hooks/
│   └── useWidgetConfig.tsx      # Config hook
├── services/
│   └── conversation/            # Conversation logic
└── styles/
    └── widget.css               # Widget styles

src/demo-site/
├── i18n.ts                      # i18n configuration reference
└── components/
    └── common/
        └── LanguageSwitcher.tsx # Language switching reference
```

### Desired Structure (files to add/modify)
```bash
src/widget/
├── App.tsx                      # MODIFY: Remove upfront customer ID
├── components/
│   ├── ChatInterface.tsx        # MODIFY: Modern UI
│   ├── CustomerProfile.tsx      # MODIFY: Beautiful redesign
│   ├── CustomerIdModal.tsx      # CREATE: Modal for customer ID entry
│   └── ProfileButton.tsx        # CREATE: Modern profile button
├── hooks/
│   └── useLanguage.tsx          # CREATE: Language detection hook
├── services/
│   └── i18n/
│       └── translations.ts      # CREATE: Widget translations
└── styles/
    └── widget.css               # MODIFY: Modern styles
```

### Known Gotchas & Patterns
```typescript
// CRITICAL: Customer ID priority order must be preserved
// 1. window.PortaFuturi?.customerId
// 2. URL parameter 'customer_id'  
// 3. Cookie 'porta_futuri_customer_id'
// 4. sessionStorage 'porta_futuri_customer_id'

// PATTERN: Language detection hierarchy
// 1. Check document.documentElement.lang
// 2. Check navigator.language
// 3. Default to 'lt' (Lithuanian)

// GOTCHA: Widget CSS must not affect host page
// All styles scoped with .pf-widget-container prefix

// CRITICAL: CDP integration expects customer_id
// Must handle gracefully when not available
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Language configuration
interface WidgetTranslations {
  lt: {
    greeting: string[];
    profile: {
      title: string;
      noProfile: string;
      enterCustomerId: string;
      // etc...
    };
    chat: {
      placeholder: string;
      send: string;
      thinking: string;
      // etc...
    };
  };
  en: {
    // Same structure as lt
  };
}

// Customer ID Modal State
interface CustomerIdModalState {
  isOpen: boolean;
  source: 'profile' | 'cdp' | null;
  onSuccess: (customerId: string) => void;
}

// Modern UI Theme
interface ModernTheme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    muted: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

### List of Tasks (in order)

```yaml
Task 1: Create Language Detection Hook
CREATE src/widget/hooks/useLanguage.tsx:
  - Detect language from document.documentElement.lang
  - Fallback to navigator.language
  - Default to 'lt'
  - Return current language and translation function

Task 2: Create Widget Translations
CREATE src/widget/services/i18n/translations.ts:
  - Define translations for Lithuanian and English
  - Include all UI strings from ChatInterface and CustomerProfile
  - Export translation getter function

Task 3: Create Customer ID Modal Component  
CREATE src/widget/components/CustomerIdModal.tsx:
  - Modern modal design with backdrop
  - Clean input field with validation
  - Smooth animations
  - Handles customer ID submission
  - Pattern: Similar to OpenAI's login modal

Task 4: Modify App.tsx for Deferred Customer ID
MODIFY src/widget/App.tsx:
  - Remove lines 90-97 (automatic customer ID prompt)
  - Keep getCustomerId() function intact
  - Add state for CustomerIdModal
  - Only show modal when profile clicked without ID
  - Initialize without blocking chat

Task 5: Create Modern Profile Button
CREATE src/widget/components/ProfileButton.tsx:
  - Modern circular button with avatar icon
  - Badge indicator when profile loaded
  - Smooth hover effects
  - Click handler for profile/modal

Task 6: Redesign Customer Profile Component
MODIFY src/widget/components/CustomerProfile.tsx:
  - Complete UI overhaul inspired by OpenAI
  - Card-based sections with shadows
  - Modern typography and spacing
  - Beautiful data visualization
  - Smooth transitions

Task 7: Modernize Chat Interface
MODIFY src/widget/components/ChatInterface.tsx:
  - Update message bubbles to modern style
  - Add typing indicators
  - Improve input field design
  - Better product card layouts
  - Use language from useLanguage hook

Task 8: Update Widget Styles
MODIFY src/widget/styles/widget.css:
  - Modern color palette
  - Improved spacing system
  - Better shadows and borders
  - Smooth animations
  - OpenAI-inspired aesthetics
```

### Pseudocode for Key Components

```typescript
// Task 1: useLanguage Hook
function useLanguage() {
  const [language, setLanguage] = useState<'lt' | 'en'>(() => {
    // 1. Check document lang
    const docLang = document.documentElement.lang;
    if (docLang?.startsWith('lt')) return 'lt';
    if (docLang?.startsWith('en')) return 'en';
    
    // 2. Check navigator
    const navLang = navigator.language;
    if (navLang?.startsWith('lt')) return 'lt';
    if (navLang?.startsWith('en')) return 'en';
    
    // 3. Default
    return 'lt';
  });

  const t = (key: string) => {
    // Get translation from translations object
    return translations[language][key] || key;
  };

  return { language, t, setLanguage };
}

// Task 3: CustomerIdModal Component
function CustomerIdModal({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;
  
  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h2>{t('profile.enterCustomerId')}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="pf-modal-body">
          <p>{t('profile.customerIdHelp')}</p>
          <input 
            type="text"
            placeholder="CUST123"
            className="pf-modern-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                onSubmit(e.currentTarget.value);
              }
            }}
          />
        </div>
        <div className="pf-modal-footer">
          <button className="pf-btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="pf-btn-primary" onClick={handleSubmit}>
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Task 4: Modified App.tsx initialization
useEffect(() => {
  const id = getCustomerId();
  if (id) {
    setCustomerId(id);
    fetchCDPData(id); // Try to fetch but don't block
  }
  // Remove setShowCustomerIdInput(true) - don't show upfront
  loadData(); // Load products immediately
}, []);

// Handle profile click
const handleProfileClick = () => {
  if (!customerId) {
    setShowCustomerIdModal(true);
  } else {
    setShowProfile(true);
  }
};
```

### Modern UI Styles Reference
```css
/* OpenAI-inspired design tokens */
:root {
  --pf-modern-bg: #ffffff;
  --pf-modern-surface: #f7f7f8;
  --pf-modern-border: #e5e5e7;
  --pf-modern-text: #0d0d0d;
  --pf-modern-muted: #6e6e80;
  --pf-modern-primary: #10a37f;
  --pf-modern-radius-sm: 6px;
  --pf-modern-radius-md: 12px;
  --pf-modern-radius-lg: 16px;
  --pf-modern-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --pf-modern-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --pf-modern-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}

/* Modern message bubbles */
.pf-message-user {
  background: var(--pf-modern-text);
  color: white;
  border-radius: var(--pf-modern-radius-md);
  padding: 12px 16px;
  max-width: 70%;
  margin-left: auto;
}

.pf-message-assistant {
  background: var(--pf-modern-surface);
  color: var(--pf-modern-text);
  border-radius: var(--pf-modern-radius-md);
  padding: 12px 16px;
  max-width: 70%;
}

/* Modern profile cards */
.pf-profile-card {
  background: white;
  border: 1px solid var(--pf-modern-border);
  border-radius: var(--pf-modern-radius-lg);
  padding: 20px;
  box-shadow: var(--pf-modern-shadow-md);
  margin-bottom: 16px;
}
```

## Validation Loop

### Level 1: Syntax & Type Checking
```bash
# TypeScript compilation
npm run typecheck

# Linting
npm run lint

# Expected: No errors
```

### Level 2: Component Tests
```typescript
// Test language detection
describe('useLanguage', () => {
  it('detects Lithuanian from html lang', () => {
    document.documentElement.lang = 'lt';
    const { language } = useLanguage();
    expect(language).toBe('lt');
  });

  it('detects English from html lang', () => {
    document.documentElement.lang = 'en';
    const { language } = useLanguage();
    expect(language).toBe('en');
  });

  it('defaults to Lithuanian', () => {
    document.documentElement.lang = '';
    const { language } = useLanguage();
    expect(language).toBe('lt');
  });
});

// Test deferred customer ID
describe('Widget initialization', () => {
  it('loads without requiring customer ID', () => {
    const wrapper = render(<App config={mockConfig} />);
    expect(wrapper.queryByText(/enter.*customer.*id/i)).toBeNull();
    expect(wrapper.getByText(/greeting/)).toBeInTheDocument();
  });

  it('shows modal when profile clicked without ID', () => {
    const wrapper = render(<App config={mockConfig} />);
    fireEvent.click(wrapper.getByTestId('profile-button'));
    expect(wrapper.getByText(/enter.*customer.*id/i)).toBeInTheDocument();
  });
});
```

### Level 3: Visual & Integration Testing
```bash
# Start widget demo
npm run dev:widget-demo

# Manual testing checklist:
# 1. Widget loads without customer ID prompt ✓
# 2. Can send messages immediately ✓
# 3. Profile button visible in header ✓
# 4. Clicking profile without ID shows modal ✓
# 5. Entering ID in modal loads profile ✓
# 6. UI looks modern and clean ✓
# 7. Language matches page lang attribute ✓

# Test with Lithuanian page
# Set demo.html lang="lt" and verify Lithuanian UI

# Test with English page  
# Set demo.html lang="en" and verify English UI
```

### Level 4: Cross-browser Testing
```bash
# Test in multiple browsers
# Chrome, Firefox, Safari, Edge
# Verify:
# - Styles render correctly
# - Animations smooth
# - Modal works properly
# - Language detection works
```

## Final Validation Checklist
- [ ] Widget loads without customer ID requirement
- [ ] Chat immediately available for use
- [ ] Profile button in header shows profile/modal appropriately
- [ ] Customer ID modal has modern, clean design
- [ ] Profile view redesigned with OpenAI-inspired UI
- [ ] Chat interface modernized with clean message bubbles
- [ ] Language automatically detected from page
- [ ] All text properly translated (LT/EN)
- [ ] Existing CDP integration still works
- [ ] No regression in existing features
- [ ] CSS doesn't affect host page
- [ ] Performance metrics maintained (<500ms load)

## Anti-Patterns to Avoid
- ❌ Don't require customer ID upfront - defeats the purpose
- ❌ Don't hardcode language - must be dynamic
- ❌ Don't break existing customer ID sources priority
- ❌ Don't use global CSS that affects host page
- ❌ Don't remove existing functionality
- ❌ Don't make design too complex - keep it minimal
- ❌ Don't forget mobile responsiveness

---

## Expected Outcome
A modern, beautiful widget chat interface that:
1. Reduces friction by not requiring customer ID upfront
2. Provides a clean, OpenAI-inspired professional design
3. Automatically adapts to the page's language
4. Maintains all existing functionality while improving UX
5. Increases user engagement through better design

## Confidence Score: 9/10
High confidence due to:
- Clear existing codebase structure
- Well-defined requirements
- Reference implementations available (i18n, OpenAI)
- Modular changes that don't break existing flow
- Clear validation steps

Risk factors:
- CSS styling complexity for OpenAI-like design
- Ensuring CDP integration works without customer ID