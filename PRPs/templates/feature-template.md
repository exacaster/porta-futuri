# PRP: [Feature Name]

## Goal
[One sentence describing what needs to be built]

## Why
[Business value and user impact - 2-3 sentences explaining why this matters]

## What
[Detailed description of the feature, including:]
- User stories
- Functional requirements
- Non-functional requirements
- Edge cases to handle

### Success Criteria
- [ ] [Specific, measurable objective 1]
- [ ] [Specific, measurable objective 2]
- [ ] [Specific, measurable objective 3]

## Context

### Requirements Reference
- Link to: `/porta-futuri-ai-addon-requirements.md#[relevant-section]`
- Specific requirements: [FR-XXX, NFR-XXX]

### Existing Code
```typescript
// Reference to existing code that this feature will interact with
// Include file paths: src/widget/components/ExistingComponent.tsx
```

### Dependencies
- React 18.3
- Supabase Client: @supabase/supabase-js@2.x
- TanStack Query: @tanstack/react-query@5.x
- [Other relevant libraries with versions]

### API Endpoints
```http
# Existing endpoints this feature will use
POST /api/v1/recommendations
GET /api/v1/profile
```

### Known Gotchas
<!-- CRITICAL: Important implementation notes that could cause issues -->
- CSV file size limit: 50MB
- Rate limiting: 100 requests/minute
- Session timeout: 30 minutes
- [Other technical constraints]

## Implementation Blueprint

### Phase 1: Setup
1. Create component structure in `src/widget/components/`
2. Set up TypeScript interfaces in `src/shared/types/`
3. Configure API service in `src/widget/services/`

### Phase 2: Core Implementation
```typescript
// Pseudocode for main logic
interface FeatureProps {
  // Define props
}

const FeatureComponent: React.FC<FeatureProps> = (props) => {
  // 1. Set up state management
  // 2. Implement data fetching with TanStack Query
  // 3. Handle user interactions
  // 4. Render UI with shadcn/ui components
}
```

### Phase 3: Integration
1. Connect to existing widget infrastructure
2. Update API endpoints if needed
3. Add error handling and loading states
4. Implement caching strategy

### Phase 4: Polish
1. Add accessibility features (ARIA labels, keyboard navigation)
2. Optimize performance (React.memo, lazy loading)
3. Add telemetry/logging
4. Update documentation

## Validation Loop

### Level 1: Syntax & Type Checking
```bash
# Run TypeScript compiler
npm run typecheck

# Run linter
npm run lint

# Format code
npm run format
```

### Level 2: Unit Tests
```bash
# Create test file: src/widget/components/[Feature].test.tsx
# Run unit tests
npm run test:unit -- [Feature]

# Check coverage
npm run test:coverage
```

#### Test Cases
- [ ] Component renders correctly
- [ ] User interactions work as expected
- [ ] Error states are handled
- [ ] Loading states are shown
- [ ] Accessibility requirements met

### Level 3: Integration Tests
```bash
# Create integration test: tests/integration/[feature].test.ts
# Run integration tests
npm run test:integration

# Test with real CSV data
# Test API endpoint integration
# Test rate limiting behavior
```

### Level 4: E2E Tests
```bash
# Create E2E test: tests/e2e/[feature].spec.ts
# Run E2E tests
npm run test:e2e

# Test complete user flow
# Test cross-browser compatibility
# Test mobile responsiveness
```

## Performance Targets
- Response time: <3 seconds (P95)
- Widget impact: <10ms added to load time
- Memory usage: <5MB additional
- Bundle size increase: <10KB gzipped

## Security Checklist
- [ ] Input validation implemented
- [ ] XSS prevention measures in place
- [ ] CORS configured correctly
- [ ] No sensitive data logged
- [ ] Rate limiting tested

## Documentation Updates
- [ ] Update README.md with new feature
- [ ] Add JSDoc comments to new functions
- [ ] Update API documentation if applicable
- [ ] Create user guide section

## Rollout Plan
1. Deploy to development environment
2. Internal testing with sample data
3. Deploy to staging with pilot customer
4. Monitor metrics and gather feedback
5. Production deployment with feature flag
6. Gradual rollout to all customers

## Notes
[Any additional context, decisions made, or open questions]

---
**Created**: [Date]
**Author**: [Your name]
**Status**: Draft | In Progress | Ready for Review | Completed