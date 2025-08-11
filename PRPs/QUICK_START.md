# Quick Start Guide for PRPs

## Your First PRP in 5 Minutes

### Step 1: Choose What to Build
Look at the requirements document (`/porta-futuri-ai-addon-requirements.md`) and pick a feature to implement.

### Step 2: Create Your PRP
```bash
# Copy the appropriate template
cp PRPs/templates/feature-template.md PRPs/2025-08-08-my-feature.md
```

### Step 3: Fill Out the Essential Sections

At minimum, complete these sections:
1. **Goal** - What you're building
2. **Why** - Why it matters
3. **Implementation Blueprint** - How to build it
4. **Validation** - How to test it

### Step 4: Use with Claude Code
```bash
# Option 1: Direct implementation
claude "Implement the PRP in PRPs/2025-08-08-my-feature.md"

# Option 2: Review first
claude "Review the PRP in PRPs/2025-08-08-my-feature.md and suggest improvements"

# Option 3: Phased approach
claude "Implement Phase 1 of the PRP in PRPs/2025-08-08-my-feature.md"
```

## Example Commands for Common Tasks

### Starting a New Feature
```bash
claude "Create a PRP for implementing the CSV parser component based on the requirements in porta-futuri-ai-addon-requirements.md#FR-001"
```

### Implementing an Existing PRP
```bash
claude "Read and implement PRPs/csv-parser.md following all validation steps"
```

### Testing Implementation
```bash
claude "Run the validation loop from PRPs/csv-parser.md and fix any issues"
```

## PRP Best Practices Checklist

Before asking Claude to implement:
- ✅ Goal is clear and specific
- ✅ File paths are absolute and correct
- ✅ Library versions are specified
- ✅ Test criteria are defined
- ✅ Performance targets are noted
- ✅ Security requirements are listed

## Common Pitfalls to Avoid

1. **Too Vague**: "Build a recommendation system"
   **Better**: "Build a React component at src/widget/components/RecommendationCard.tsx that displays 3-5 product recommendations"

2. **Missing Context**: "Use the AI service"
   **Better**: "Use the Anthropic Claude API with the SDK version @anthropic-ai/sdk@0.6.0"

3. **No Success Criteria**: "Make it work"
   **Better**: "Response time <3 seconds, displays 3-5 products, includes reasoning for each"

## Priority Order for Porta Futuri MVP

Based on your requirements, implement PRPs in this order:

### Phase 1: Foundation (Week 1)
1. Project setup and configuration
2. CSV parser and validator
3. Basic widget structure
4. Supabase connection

### Phase 2: Core Features (Week 2)
1. Recommendation engine
2. Chat interface
3. API endpoints
4. Customer profile view

### Phase 3: Integration (Week 3)
1. LLM integration
2. Real-time updates
3. Error handling
4. Caching layer

### Phase 4: Polish (Week 4)
1. Performance optimization
2. Security hardening
3. Testing suite
4. Documentation

## Getting Help

### When Claude Gets Stuck
```bash
# Provide more context
claude "Review CLAUDE.md and PRPs/ai_docs/tech-stack.md then retry implementing PRPs/my-feature.md"

# Break it down
claude "Implement only the setup phase from PRPs/my-feature.md"

# Debug specific issues
claude "Debug why the test in PRPs/my-feature.md validation section is failing"
```

### Useful Context Commands
```bash
# Load project context
claude "Read CLAUDE.md and understand the project structure"

# Review requirements
claude "What are the requirements for FR-001 in porta-futuri-ai-addon-requirements.md?"

# Check implementation status
claude "List all PRPs and their current status"
```

## Quick Reference

### File Locations
- Requirements: `/porta-futuri-ai-addon-requirements.md`
- Guidelines: `/CLAUDE.md`
- Templates: `/PRPs/templates/`
- Tech Reference: `/PRPs/ai_docs/tech-stack.md`

### Key Commands
- Dev server: `npm run dev`
- Tests: `npm test`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`

### Performance Targets
- Response time: <3 seconds
- Widget load: <500ms
- Bundle size: <50KB
- CSV parsing: <1 second

### Limits
- CSV files: 50MB max
- Products: 10,000 max
- API rate: 100 req/min
- Cache TTL: 15 minutes

---

Ready to start? Create your first PRP and let Claude Code handle the implementation!