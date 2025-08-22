# Widget Code Review and Refactoring Prompt

## Objective
Perform a comprehensive code review and refactoring of the Porta Futuri widget codebase to prepare it for production deployment. Remove all debug code, console logs, unused code, and improve code quality while maintaining all functionality.

## Context
The widget has recently undergone debugging to fix CDP data display issues. As a result, there are numerous debug console.log statements, temporary workarounds, and potentially unused code that needs to be cleaned up.

## Scope
Review and refactor the following components:
- `/src/widget/` - All widget components and services
- `/src/demo-site/components/PortaFuturiWidget.tsx` - Widget integration in demo
- `/supabase/functions/cdp-proxy/` - Edge function for CDP integration

## Specific Tasks

### 1. Remove Debug Code
- [ ] Remove ALL console.log statements with [DEBUG] prefix
- [ ] Remove temporary debug logging in:
  - `src/widget/App.tsx` (lines ~122-208 - CDP fetch debugging)
  - `src/widget/components/CustomerProfile.tsx` (lines ~23-27 - profile debugging)
  - `src/widget/components/DynamicFieldRenderer.tsx` (any debug logs)
  - Any other components with debug statements

### 2. Clean Up Console Statements
- [ ] Remove or convert console.warn to proper error handling
- [ ] Remove console.error statements used for debugging
- [ ] Keep only essential console.error for actual error scenarios
- [ ] Consider using a logging service or conditional logging based on environment

### 3. Code Quality Improvements

#### Type Safety
- [ ] Review and fix any TypeScript `any` types
- [ ] Ensure all props have proper TypeScript interfaces
- [ ] Add missing type definitions for:
  - CDP response structures
  - Customer profile data
  - Event tracking data

#### Error Handling
- [ ] Implement proper error boundaries for React components
- [ ] Add user-friendly error messages instead of console outputs
- [ ] Implement fallback UI for failed CDP calls
- [ ] Add retry logic with exponential backoff for API failures

#### Performance Optimization
- [ ] Review and optimize re-renders in:
  - `ChatInterface.tsx` - Check for unnecessary renders
  - `CustomerProfile.tsx` - Optimize field rendering
  - `DynamicFieldRenderer.tsx` - Memoize expensive computations
- [ ] Implement React.memo where appropriate
- [ ] Use useMemo/useCallback for expensive operations
- [ ] Lazy load heavy components

### 4. Remove Unused Code
- [ ] Identify and remove unused imports
- [ ] Remove commented-out code blocks
- [ ] Remove unused state variables
- [ ] Remove unused props
- [ ] Clean up unused CSS classes in widget.css

### 5. Code Organization

#### Component Structure
- [ ] Ensure consistent component structure:
  ```typescript
  // 1. Imports
  // 2. Types/Interfaces
  // 3. Component definition
  // 4. Hooks
  // 5. Event handlers
  // 6. Render logic
  ```

#### File Organization
- [ ] Move helper functions to appropriate utility files
- [ ] Consolidate duplicate logic
- [ ] Ensure proper separation of concerns

### 6. CDP Integration Cleanup
Review `src/widget/App.tsx` fetchCDPData function:
- [ ] Remove the legacy format transformation (lines ~150-195)
  - This was a temporary fix for old CDP format
  - The CDP proxy now returns the correct format
- [ ] Simplify the data transformation logic
- [ ] Add proper error types and handling

### 7. Production Readiness

#### Security
- [ ] Ensure no sensitive data is logged
- [ ] Validate all user inputs
- [ ] Sanitize data before rendering
- [ ] Review CORS configuration

#### Configuration
- [ ] Move hardcoded values to configuration
- [ ] Ensure environment variables are properly used
- [ ] Add configuration validation

#### Testing Preparation
- [ ] Ensure code is testable (no direct DOM manipulation)
- [ ] Add data-testid attributes for E2E testing
- [ ] Document any complex logic for test writing

### 8. Documentation
- [ ] Add JSDoc comments for public methods
- [ ] Document complex algorithms or business logic
- [ ] Update inline comments to be meaningful
- [ ] Remove obvious comments like "// Set state"

## Code Review Checklist

### Before Changes
- [ ] All existing functionality works correctly
- [ ] CDP data displays all fields properly
- [ ] Customer profile shows complete information
- [ ] Chat interface responds appropriately

### After Refactoring
- [ ] No console logs in production code
- [ ] All TypeScript errors resolved
- [ ] No ESLint warnings
- [ ] Code follows project conventions (check CLAUDE.md)
- [ ] Bundle size is optimized (<50KB compressed)
- [ ] Performance metrics maintained or improved

## Specific Code Sections to Review

### 1. App.tsx fetchCDPData (High Priority)
Current issues:
- Excessive debug logging
- Complex nested transformation logic
- Mixed concerns (fetching + transformation)

Suggested refactor:
```typescript
// Move to separate service file
class CDPService {
  async fetchCustomerData(customerId: string): Promise<CDPResponse> {
    // Clean implementation without logs
  }
  
  private transformResponse(data: any): CDPResponse {
    // Clean transformation logic
  }
}
```

### 2. CustomerProfile.tsx (Medium Priority)
Current issues:
- Debug console.logs at component level
- Complex conditional rendering
- Could benefit from component splitting

Suggested approach:
- Extract field rendering to separate components
- Use composition pattern for different profile states

### 3. DynamicFieldRenderer.tsx (Low Priority)
Current state is generally good, just needs:
- Remove any debug statements
- Add proper TypeScript types
- Consider memoization for renderValue()

## Expected Deliverables

1. **Clean Code**: All debug code removed, proper error handling
2. **Type Safety**: Full TypeScript coverage with no `any` types
3. **Performance**: Optimized renders and bundle size
4. **Maintainability**: Well-organized, documented code
5. **Production Ready**: Secure, configurable, testable

## Testing After Refactoring

Run these commands to verify:
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build and check bundle size
npm run build:widget
ls -lah dist/widget.js

# Test the widget
npm run dev:demo
# Then test:
# 1. Enter customer ID HH_9139599
# 2. Verify all 10 CDP fields display
# 3. Check console for any remaining logs
# 4. Test error scenarios (invalid customer ID)
```

## Important Notes

1. **Preserve Functionality**: The refactoring should not break any existing features
2. **Incremental Changes**: Make changes incrementally and test frequently
3. **Version Control**: Commit changes in logical chunks with clear messages
4. **Follow Guidelines**: Adhere to project guidelines in CLAUDE.md
5. **No Over-Engineering**: Keep solutions simple and maintainable

## Priority Order

1. **Critical**: Remove all debug console.logs
2. **High**: Fix TypeScript issues and any types
3. **Medium**: Improve error handling and user feedback
4. **Low**: Performance optimizations and code organization

## Success Criteria

- [ ] Zero console statements in production build
- [ ] 100% TypeScript type coverage
- [ ] All CDP fields display correctly
- [ ] Widget loads in <500ms
- [ ] Bundle size <50KB compressed
- [ ] Code passes all linting rules
- [ ] Clear separation of concerns
- [ ] Proper error handling with user feedback

---

## Example Refactoring Approach

### Before (Current Code):
```typescript
const fetchCDPData = async (customerId: string) => {
  console.log('[DEBUG] Starting CDP fetch for customer:', customerId);
  try {
    // ... lots of code with console.logs
    console.log('[DEBUG] CDP Response:', data);
    console.log('[DEBUG] CDP Available:', data.cdp_available);
    // ... complex transformation logic
  } catch (error) {
    console.error("[DEBUG] Failed to fetch CDP data:", error);
  }
};
```

### After (Refactored):
```typescript
const fetchCDPData = async (customerId: string): Promise<void> => {
  try {
    const cdpData = await cdpService.fetchCustomerProfile(customerId);
    
    if (cdpData.available) {
      setCustomerProfile(prev => ({
        ...prev,
        customer_id: customerId,
        cdp_data: cdpData
      }));
    }
  } catch (error) {
    handleCDPError(error as CDPError);
  }
};

const handleCDPError = (error: CDPError): void => {
  // Show user-friendly error message
  showNotification({
    type: 'error',
    message: getErrorMessage(error.code)
  });
  
  // Log to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    errorTracker.log(error);
  }
};
```

---

This refactoring will ensure the widget is production-ready, maintainable, and performs optimally.