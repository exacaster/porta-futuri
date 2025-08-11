# Create Widget PRP

## Feature: $ARGUMENTS

Generate a specialized PRP for Porta Futuri widget components with React, TypeScript, and shadcn/ui.

## Research Process

1. **Component Analysis**
   - Check existing widget components in src/widget/components/
   - Review shadcn/ui patterns and Radix UI usage
   - Analyze current styling with Tailwind CSS
   - Note TypeScript interfaces and types

2. **Performance Considerations**
   - Bundle size impact (<50KB target)
   - React.memo usage patterns
   - Lazy loading requirements
   - TanStack Query integration

3. **Widget Requirements**
   - Check requirements in porta-futuri-ai-addon-requirements.md
   - Review CLAUDE.md for widget guidelines
   - Consider embedding constraints
   - API integration patterns

## PRP Generation

Using PRPs/templates/feature-template.md as base:

### Critical Context
- **React Patterns**: Functional components with hooks
- **TypeScript**: Strict mode, proper interfaces
- **Styling**: Tailwind CSS with shadcn/ui
- **State**: TanStack Query for server state
- **Icons**: Lucide React only
- **Performance**: <500ms load time

### Implementation Tasks
1. Create component structure
2. Define TypeScript interfaces
3. Implement UI with shadcn/ui
4. Add API integration
5. Implement error boundaries
6. Add loading states
7. Test bundle size
8. Performance optimization

### Validation Gates
```bash
# TypeScript check
npm run typecheck

# Linting
npm run lint

# Bundle size check
npm run build:widget && ls -lh dist/widget.js

# Tests
npm test src/widget/**/*.test.tsx
```

## Widget-Specific Checks
- [ ] Component under 300 lines
- [ ] Proper TypeScript typing
- [ ] Error boundary implemented
- [ ] Loading states handled
- [ ] Responsive design
- [ ] Accessibility (ARIA)
- [ ] Bundle size impact checked

Output: `PRPs/widget-{component-name}.md`