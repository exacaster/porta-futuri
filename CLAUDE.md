# Porta Futuri AI Add-On Development Guidelines

## Project Overview
Porta Futuri AI Add-On is a lightweight, embeddable recommendation widget that provides intelligent product suggestions using AI-powered analysis of customer data. 

## Core Development Principles

### 1. KISS (Keep It Simple, Stupid)
- Start with the simplest solution that works
- Avoid over-engineering
- Refactor only when necessary

### 2. YAGNI (You Aren't Gonna Need It)
- Implement features only when required
- Avoid speculative generality
- Focus on current requirements

### 3. Privacy First
- No persistent storage of customer data
- Process data in real-time only
- Clear data handling policies

### 4. Performance Oriented
- Target <3 second response time (P95)
- Widget load time <500ms
- Optimize LLM token usage

## Technology Stack

### Frontend (Widget)
- **Framework**: React 18.3 with TypeScript
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite (target <50KB compressed)
- **Icons**: Lucide React

### Backend
- **Platform**: Supabase
  - PostgreSQL for data storage
  - Edge Functions for serverless endpoints
  - Real-time subscriptions
- **LLM Integration**: 
  - Primary: Claude (Anthropic SDK)
  - Fallback: GPT-4 (OpenAI SDK)
- **CSV Processing**: PapaParse with streaming

## Code Structure Guidelines

### File Organization
```
porta-futuri/
├── src/
│   ├── widget/           # React widget code
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   ├── api/              # Backend API code
│   │   ├── functions/    # Supabase Edge Functions
│   │   ├── lib/          # Shared backend libraries
│   │   └── types/        # TypeScript type definitions
│   └── shared/           # Shared code between frontend/backend
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
└── PRPs/                 # Product Requirement Prompts
```

### Coding Standards

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Use ESLint and Prettier for formatting
- Maximum file size: 300 lines
- Maximum function size: 50 lines
- Use descriptive variable names

#### React Components
- Functional components with hooks only
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Keep components focused and single-purpose
- Use React.memo for expensive components

#### Testing
- Minimum 80% code coverage
- Test files alongside source files (*.test.ts)
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Mock external dependencies

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Development
```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Format code
npm run format
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

### Build
```bash
# Build widget for production
npm run build:widget

# Build API functions
npm run build:api

# Build everything
npm run build
```

## PRP (Product Requirement Prompt) Framework

### Overview
This project uses the PRP framework for AI-assisted development. PRPs are comprehensive documents that provide AI coding assistants with all context needed to implement features correctly in a single pass.

### Available Claude Commands
Use these commands with `/` prefix in Claude Code:
- `/create-base-prp` - Create a general feature PRP
- `/execute-base-prp` - Execute an existing PRP
- `/create-widget-prp` - Create widget-specific PRP
- `/create-api-prp` - Create API endpoint PRP
- `/list-prps` - List all PRPs and their status
- `/planning-create` - Create implementation plan
- `/spec-create-adv` - Create advanced specification
- `/spec-execute` - Execute specification
- `/review-general` - Review code changes
- `/refactor-simple` - Simple refactoring
- `/prime-core` - Prime AI with core context
- `/onboarding` - Onboarding new developers
- `/debug` - Debug issues

### When to Create a PRP
- New features or significant enhancements
- Complex refactoring tasks
- Integration with external services
- Performance optimizations
- Any task requiring multiple coordinated changes

### PRP Structure
Each PRP must include:
1. **Goal**: Clear, measurable objective
2. **Why**: Business value and user impact
3. **Context**: Requirements reference, existing code patterns
4. **Implementation Blueprint**: Detailed, ordered steps
5. **Validation**: Executable tests and success criteria

### PRP Workflow
1. **Create PRP**: Use appropriate `/create-*-prp` command
2. **Review PRP**: Ensure completeness and accuracy
3. **Execute PRP**: Use `/execute-base-prp` command
4. **Validate**: Run validation gates specified in PRP
5. **Complete**: Move to `PRPs/completed/` when done

### PRP Naming Convention
- Format: `YYYY-MM-DD-feature-name.md`
- Example: `2025-08-08-csv-parser.md`
- Templates: Keep in `PRPs/templates/`
- Active: Keep in `PRPs/`
- Completed: Move to `PRPs/completed/`

### PRP Execution
```bash
# Interactive execution
python PRPs/scripts/prp_runner.py PRPs/feature-name.md

# Direct with Claude Code
claude "Implement PRPs/feature-name.md following all validation steps"

# Phased approach
claude "Implement Phase 1 of PRPs/feature-name.md"
```

### Quality Checklist for PRPs
- [ ] Goal is specific and measurable
- [ ] All file paths are absolute
- [ ] Library versions specified
- [ ] Test commands are executable
- [ ] Performance targets defined
- [ ] Error handling documented
- [ ] Security requirements listed
- [ ] Validation gates included

## API Design Principles

### RESTful Endpoints
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Include error details in responses
- Version APIs (/api/v1/)

### Rate Limiting
- 100 requests per minute per API key
- Implement exponential backoff
- Return clear rate limit headers

### Security
- Validate all inputs
- Use parameterized queries
- Implement CORS properly
- Never log sensitive data

## CSV Processing Guidelines

### File Limits
- Maximum file size: 50MB
- Products: up to 10,000 items
- Customer: single record
- Context: last 500 events or 30 days

### Error Handling
- Validate CSV structure before processing
- Handle missing fields gracefully
- Provide clear error messages
- Support UTF-8 encoding

## LLM Integration Best Practices

### Prompt Engineering
- Keep prompts concise and specific
- Include relevant context only
- Use system prompts for consistency
- Implement prompt templates

### Cost Optimization
- Cache responses for 15 minutes
- Implement request batching
- Use smaller models for simple tasks
- Monitor token usage

### Fallback Strategy
- Static recommendations as fallback
- Multiple LLM provider support
- Graceful degradation
- User notification of degraded service

## Performance Requirements

### Response Times
- Initial recommendation: <3 seconds (P95)
- Follow-up queries: <2 seconds (P95)
- Widget load: <500ms
- CSV parsing: <1 second per file

### Optimization Strategies
- Implement lazy loading
- Use React.memo and useMemo
- Optimize bundle size with tree shaking
- Enable gzip compression
- Use CDN for static assets

## Security Guidelines

### Data Protection
- TLS 1.3 for all communications
- No persistent storage of PII
- Session timeout after 30 minutes
- Sanitize all user inputs

### Authentication
- API key validation
- Rate limiting per key
- CORS configuration
- Input validation

## Documentation Requirements

### Code Documentation
- JSDoc comments for public APIs
- README for each module
- Inline comments for complex logic
- Keep documentation updated

### User Documentation
- Integration guide
- API reference
- Troubleshooting guide
- Example implementations

## Deployment Checklist

Before deploying:
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Monitoring configured

## Behavioral Guidelines for AI Assistants

When working with this codebase:
1. Always check existing code patterns before implementing new features
2. Verify library availability before importing
3. Follow the established file structure
4. Write tests for new functionality
5. Update documentation when changing APIs
6. Consider performance implications
7. Validate CSV data thoroughly
8. Implement proper error handling
9. Use TypeScript's type system effectively
10. Keep security as a top priority

## Quick Reference

### Key Files
- `/PRPs/completed/porta-futuri-ai-addon-requirements.md` - Full product requirements
- `/src/widget/index.tsx` - Widget entry point
- `/src/api/functions/` - API endpoints
- `/PRPs/` - Active development tasks

### Environment Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
```

### Important Limits
- CSV: 50MB max
- Products: 10,000 max
- API: 100 req/min
- Cache: 15 minutes
- Session: 30 minutes

---

*Last Updated: August 2025*
*Version: 1.0*