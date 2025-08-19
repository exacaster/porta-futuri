# PRP: Bilingual Demo Application (Lithuanian & English)

## Metadata
- **Created**: 2025-08-19
- **Type**: Feature Implementation
- **Priority**: High
- **Estimated Effort**: 3-4 hours
- **Confidence Score**: 9/10

## Goal
Implement bilingual support (Lithuanian and English) in the iTelecom demo e-commerce application with Lithuanian as the default language, following React i18next best practices and maintaining simplicity per project guidelines.

## Why
- **Business Value**: Expand market reach to Lithuanian-speaking customers
- **User Impact**: Native language experience improves user engagement and conversion
- **Strategic Alignment**: Demonstrates AI widget's multilingual capabilities to potential clients

## Context

### Current State
- Demo application (`/src/demo-site/`) has all text hardcoded in English
- No i18n library currently installed
- Currency formatting uses `Intl.NumberFormat` with 'en-US' locale
- Application follows KISS and YAGNI principles per CLAUDE.md

### Key Components Requiring Translation
1. **Layout Components**:
   - `/src/demo-site/components/layout/Header.tsx` - Navigation, search placeholders, support text
   - `/src/demo-site/components/layout/Footer.tsx` - Footer links and copyright

2. **Page Components**:
   - `/src/demo-site/pages/HomePage.tsx` - Hero text, feature descriptions, section headers
   - `/src/demo-site/pages/CartPage.tsx` - Cart labels, checkout text, trust badges
   - `/src/demo-site/pages/CategoryPage.tsx` - Filter labels, sorting options
   - `/src/demo-site/pages/ProductPage.tsx` - Product details, tabs, CTAs

3. **Product Components**:
   - `/src/demo-site/components/products/ProductCard.tsx` - Stock status, buttons, labels
   - `/src/demo-site/components/products/ProductGrid.tsx` - Loading states, empty states

4. **Common Elements**:
   - Button labels ("Add to Cart", "Continue Shopping", etc.)
   - Form placeholders and validation messages
   - Stock status badges
   - Error and success messages via Toaster

### Technical Requirements
- Use react-i18next for internationalization (https://react.i18next.com/)
- Lithuanian language code: "lt" (simpler) or "lt-LT" (with regional formatting)
- Store translations in JSON files: `/public/locales/{lang}/translation.json`
- Implement language switcher in header
- Persist language preference in localStorage
- Update currency/date formatting to respect selected locale

## Implementation Blueprint

### Phase 1: Setup i18n Infrastructure

```bash
# 1. Install required packages
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend

# 2. Create i18n configuration file
# Path: /src/demo-site/i18n.ts
```

```typescript
// /src/demo-site/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'lt', // Lithuanian as default
    supportedLngs: ['lt', 'en'],
    debug: false, // Set to true during development
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    }
  });

export default i18n;
```

### Phase 2: Create Translation Files

```json
// /public/locales/lt/translation.json
{
  "nav": {
    "home": "Pradžia",
    "products": "Produktai",
    "deals": "Pasiūlymai",
    "business": "Verslui",
    "support": "Pagalba",
    "search": "Ieškoti produktų...",
    "cart": "Krepšelis",
    "allProducts": "Visi produktai"
  },
  "hero": {
    "title": "Sveiki atvykę į telekomunikacijų sprendimų ateitį",
    "subtitle": "Atraskite pažangiausius mobiliojo ryšio planus, itin greitą internetą ir novatoriškus verslo sprendimus, pritaikytus jūsų skaitmeniniam gyvenimo būdui.",
    "shopNow": "Apsipirkti dabar",
    "businessSolutions": "Verslo sprendimai",
    "smartConnectivity": "Išmanūs ryšiai",
    "poweredByAI": "Veikia su DI rekomendacijomis"
  },
  "features": {
    "freeShipping": "Nemokamas pristatymas",
    "ordersOver": "Užsakymams virš €50",
    "fastSetup": "Greitas įdiegimas",
    "sameDayActivation": "Aktyvavimas tą pačią dieną",
    "secure": "Saugus",
    "protectedPayments": "Apsaugoti mokėjimai",
    "support247": "24/7 Pagalba",
    "alwaysHere": "Visada pasiruošę padėti"
  },
  "sections": {
    "shopByCategory": "Apsipirkite pagal kategoriją",
    "findPerfectSolution": "Raskite tobulą sprendimą savo poreikiams",
    "featuredProducts": "Rekomenduojami produktai",
    "handpickedSelections": "Specialiai jums atrinkti pasiūlymai",
    "viewAll": "Peržiūrėti viską"
  },
  "product": {
    "inStock": "Sandėlyje",
    "limitedStock": "Ribotas kiekis",
    "outOfStock": "Išparduota",
    "addToCart": "Į krepšelį",
    "add": "Pridėti",
    "quickView": "Peržiūra",
    "addToWishlist": "Į norų sąrašą",
    "exploreProducts": "Naršyti produktus →",
    "each": "vnt."
  },
  "cart": {
    "title": "Pirkinių krepšelis",
    "itemsInCart": "{{count}} prekė jūsų krepšelyje",
    "itemsInCart_other": "{{count}} prekės jūsų krepšelyje",
    "empty": "Jūsų krepšelis tuščias",
    "emptyMessage": "Atrodo, kad dar nieko neįdėjote į krepšelį.",
    "startShopping": "Pradėti apsipirkimą",
    "cartItems": "Krepšelio prekės",
    "clearCart": "Išvalyti krepšelį",
    "removeFromCart": "Pašalinti iš krepšelio",
    "continueShopping": "Tęsti apsipirkimą",
    "orderSummary": "Užsakymo suvestinė",
    "subtotal": "Tarpinė suma",
    "vat": "PVM (21%)",
    "shipping": "Pristatymas",
    "free": "NEMOKAMAI",
    "addMoreForFreeShipping": "Pridėkite už {{amount}} daugiau nemokamam pristatymui",
    "total": "Iš viso",
    "proceedToCheckout": "Pereiti į apmokėjimą",
    "promoCode": "Turite nuolaidos kodą?",
    "enterCode": "Įveskite kodą",
    "apply": "Pritaikyti",
    "secureCheckout": "Saugus apmokėjimas",
    "returnPolicy": "30 dienų grąžinimo politika",
    "reliableShipping": "Greitas ir patikimas pristatymas"
  },
  "newsletter": {
    "title": "Būkite informuoti apie naujausius pasiūlymus",
    "subtitle": "Užsiprenumeruokite mūsų naujienlaiškį ir niekada nepraleiskite išskirtinių pasiūlymų bei naujų produktų",
    "emailPlaceholder": "Įveskite el. pašto adresą",
    "subscribe": "Prenumeruoti",
    "privacyNote": "Prenumeruodami sutinkate su mūsų Privatumo politika ir Paslaugų teikimo sąlygomis"
  },
  "ai": {
    "title": "Gaukite DI valdomus pasiūlymus",
    "description": "Mūsų išmanus asistentas padeda rasti tobulus telekomunikacijų sprendimus pagal jūsų poreikius ir pageidavimus.",
    "smartAssistant": "Išmanus asistentas",
    "instantHelp": "Greita pagalba",
    "personalized": "Personalizuota",
    "chatWithAI": "Kalbėtis su DI asistentu",
    "available247": "Prieinamas 24/7 jums padėti",
    "startChat": "Pradėti pokalbį"
  },
  "common": {
    "loading": "Kraunama...",
    "error": "Klaida",
    "tryAgain": "Bandyti dar kartą",
    "noResults": "Rezultatų nerasta",
    "showMore": "Rodyti daugiau",
    "showLess": "Rodyti mažiau"
  }
}
```

```json
// /public/locales/en/translation.json
{
  "nav": {
    "home": "Home",
    "products": "Products",
    "deals": "Deals",
    "business": "Business",
    "support": "Support",
    "search": "Search products...",
    "cart": "Cart",
    "allProducts": "All Products"
  },
  "hero": {
    "title": "Welcome to the Future of Telecom Solutions",
    "subtitle": "Discover cutting-edge mobile plans, lightning-fast internet, and innovative business solutions tailored for your digital lifestyle.",
    "shopNow": "Shop Now",
    "businessSolutions": "Business Solutions",
    "smartConnectivity": "Smart Connectivity",
    "poweredByAI": "Powered by AI Recommendations"
  },
  "features": {
    "freeShipping": "Free Shipping",
    "ordersOver": "Orders over €50",
    "fastSetup": "Fast Setup",
    "sameDayActivation": "Same day activation",
    "secure": "Secure",
    "protectedPayments": "Protected payments",
    "support247": "24/7 Support",
    "alwaysHere": "Always here to help"
  },
  "sections": {
    "shopByCategory": "Shop by Category",
    "findPerfectSolution": "Find the perfect solution for your needs",
    "featuredProducts": "Featured Products",
    "handpickedSelections": "Handpicked selections just for you",
    "viewAll": "View All"
  },
  "product": {
    "inStock": "In Stock",
    "limitedStock": "Limited Stock",
    "outOfStock": "Out of Stock",
    "addToCart": "Add to Cart",
    "add": "Add",
    "quickView": "Quick view",
    "addToWishlist": "Add to wishlist",
    "exploreProducts": "Explore products →",
    "each": "each"
  },
  "cart": {
    "title": "Shopping Cart",
    "itemsInCart": "{{count}} item in your cart",
    "itemsInCart_other": "{{count}} items in your cart",
    "empty": "Your Cart is Empty",
    "emptyMessage": "Looks like you haven't added anything to your cart yet.",
    "startShopping": "Start Shopping",
    "cartItems": "Cart Items",
    "clearCart": "Clear Cart",
    "removeFromCart": "Remove from cart",
    "continueShopping": "Continue Shopping",
    "orderSummary": "Order Summary",
    "subtotal": "Subtotal",
    "vat": "VAT (21%)",
    "shipping": "Shipping",
    "free": "FREE",
    "addMoreForFreeShipping": "Add {{amount}} more for free shipping",
    "total": "Total",
    "proceedToCheckout": "Proceed to Checkout",
    "promoCode": "Have a promo code?",
    "enterCode": "Enter code",
    "apply": "Apply",
    "secureCheckout": "Secure checkout",
    "returnPolicy": "30-day return policy",
    "reliableShipping": "Fast & reliable shipping"
  },
  "newsletter": {
    "title": "Stay Updated with Latest Offers",
    "subtitle": "Subscribe to our newsletter and never miss exclusive deals and new product launches",
    "emailPlaceholder": "Enter your email address",
    "subscribe": "Subscribe",
    "privacyNote": "By subscribing, you agree to our Privacy Policy and Terms of Service"
  },
  "ai": {
    "title": "Get AI-Powered Recommendations",
    "description": "Our intelligent assistant helps you find the perfect telecom solutions based on your needs and preferences.",
    "smartAssistant": "Smart Assistant",
    "instantHelp": "Instant Help",
    "personalized": "Personalized",
    "chatWithAI": "Chat with AI Assistant",
    "available247": "Available 24/7 to help you",
    "startChat": "Start Chat"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "tryAgain": "Try Again",
    "noResults": "No results found",
    "showMore": "Show More",
    "showLess": "Show Less"
  }
}
```

### Phase 3: Update Main Entry Point

```typescript
// Update /src/demo-site/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import './i18n'; // Add this line

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Phase 4: Create Language Switcher Component

```typescript
// Create /src/demo-site/components/common/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'lt' ? 'en' : 'lt';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      aria-label="Change language"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {i18n.language === 'lt' ? 'EN' : 'LT'}
      </span>
    </button>
  );
}
```

### Phase 5: Update Components with Translations

#### Example: Header Component Update

```typescript
// Update /src/demo-site/components/layout/Header.tsx
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();
  // ... existing code ...

  // Replace hardcoded text with t() function:
  // Old: <span>24/7 Support: 1-800-TELECOM</span>
  // New: <span>{t('nav.support')}: 1-800-TELECOM</span>

  // Add LanguageSwitcher to header actions
  return (
    <header>
      {/* ... existing header code ... */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {/* ... existing actions ... */}
      </div>
    </header>
  );
}
```

### Phase 6: Update Currency Formatting

```typescript
// Create utility: /src/demo-site/utils/formatters.ts
import { useTranslation } from 'react-i18next';

export const useFormatters = () => {
  const { i18n } = useTranslation();
  
  const formatPrice = (price: number) => {
    const locale = i18n.language === 'lt' ? 'lt-LT' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };
  
  const formatDate = (date: Date) => {
    const locale = i18n.language === 'lt' ? 'lt-LT' : 'en-US';
    return new Intl.DateTimeFormat(locale).format(date);
  };
  
  return { formatPrice, formatDate };
};
```

### Implementation Tasks (in order)

1. **Setup i18n** (30 min)
   - Install packages
   - Create i18n configuration
   - Import in main.tsx
   - Verify initialization

2. **Create Translation Files** (45 min)
   - Create Lithuanian translations
   - Create English translations
   - Organize by component namespaces
   - Validate JSON structure

3. **Build Language Switcher** (20 min)
   - Create LanguageSwitcher component
   - Add to Header
   - Test language switching
   - Verify localStorage persistence

4. **Update Layout Components** (30 min)
   - Update Header.tsx with translations
   - Update Footer.tsx with translations
   - Test all navigation items

5. **Update Page Components** (45 min)
   - Update HomePage.tsx
   - Update CartPage.tsx
   - Update CategoryPage.tsx
   - Update ProductPage.tsx

6. **Update Product Components** (30 min)
   - Update ProductCard.tsx
   - Update ProductGrid.tsx
   - Update stock status badges

7. **Update Formatters** (20 min)
   - Create formatters utility
   - Update all price formatting
   - Update date formatting where needed

8. **Testing & Polish** (20 min)
   - Test all pages in both languages
   - Verify localStorage persistence
   - Check for missed translations
   - Validate currency formatting

## Validation Gates

### Automated Tests
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build:demo
```

### Manual Testing Checklist
- [ ] Language switcher appears in header
- [ ] Default language is Lithuanian (lt)
- [ ] Switching languages updates all text immediately
- [ ] Language preference persists after page refresh
- [ ] Currency formatting respects selected locale
- [ ] All pages display correctly in Lithuanian
- [ ] All pages display correctly in English
- [ ] No console errors during language switching
- [ ] Cart functionality works in both languages
- [ ] Search placeholder updates with language

### Performance Validation
- [ ] Translation files load < 100ms
- [ ] Language switch < 50ms
- [ ] No visible flicker during language change
- [ ] Bundle size increase < 15KB

## Error Handling

1. **Missing Translations**
   - Fallback to key name (visible to developers)
   - Log warning in development mode
   - Use English as fallback language

2. **Failed Translation Loading**
   - Use inline translations as fallback
   - Show error message to user
   - Allow retry

3. **Invalid Language Code**
   - Default to Lithuanian
   - Log error for monitoring

## Documentation Links

- React i18next Official Docs: https://react.i18next.com/
- i18next Configuration: https://www.i18next.com/overview/configuration-options
- Language Detection: https://github.com/i18next/i18next-browser-languageDetector
- Best Practices Guide: https://react.i18next.com/latest/using-with-hooks

## Success Criteria

- ✅ Demo site fully functional in Lithuanian and English
- ✅ Lithuanian set as default language
- ✅ Language preference persists across sessions
- ✅ All user-facing text is translated
- ✅ Currency/date formatting respects locale
- ✅ No performance degradation
- ✅ Clean, maintainable code following KISS principle

## Notes for AI Implementation

- Follow existing code patterns in demo-site components
- Use TypeScript strictly - no `any` types
- Keep translations organized by component/section
- Don't over-engineer - simple solution per KISS principle
- Test each component after updating
- Ensure all aria-labels are also translated for accessibility
- Consider pluralization rules for Lithuanian (use i18next plurals)

## Quality Checklist

- [x] Goal is specific and measurable
- [x] All file paths are absolute
- [x] Library versions will use latest stable
- [x] Test commands are executable
- [x] Performance targets defined
- [x] Error handling documented
- [x] Security requirements listed (N/A for this feature)
- [x] Validation gates included

**Confidence Score: 9/10**

The implementation is straightforward with well-documented libraries. The only minor complexity is ensuring all text is properly extracted and translated, but the systematic approach outlined above minimizes this risk.