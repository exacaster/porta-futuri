# Developer Onboarding Guide - Porta Futuri AI Add-On

Welcome to the Porta Futuri AI Add-On project! This guide will help you understand our codebase and get productive quickly.

## 1. Project Overview

### What We're Building
Porta Futuri is an **AI-powered product recommendation widget** that e-commerce sites can embed with a single line of code. Think of it as "ChatGPT for shopping" - it analyzes customer data from CSV files and provides intelligent, personalized product suggestions.

### Core Value Propositions
- **Privacy-First**: No persistent storage of customer data
- **Lightweight**: <50KB compressed widget size
- **Fast**: <3 second response time (P95)
- **Smart**: AI-powered recommendations with reasoning
- **Easy**: Single-line integration for merchants

### Tech Stack Overview
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Widget** | React 18 + TypeScript | Embeddable recommendation UI |
| **Styling** | Tailwind CSS + Radix UI | Consistent, accessible components |
| **Backend** | Supabase Edge Functions | Serverless API endpoints |
| **Database** | PostgreSQL (Supabase) | Session & rate limiting data |
| **AI** | Claude (primary) + GPT-4 (fallback) | Recommendation generation |
| **Build** | Vite | Fast builds with optimized bundles |
| **Testing** | Vitest + Playwright | Unit and E2E testing |

### Architecture Pattern
We use a **widget-first architecture** with these principles:
- Isolation through iframe-like boundaries
- PostMessage API for communication
- Progressive enhancement with fallbacks
- Stateless edge functions
- Multi-level caching strategy

## 2. Repository Structure

```
porta-futuri/
├── src/                    # All source code
│   ├── widget/            # React widget components
│   │   ├── components/    # UI components (Chat, Trigger, Profile)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API communication layer
│   │   ├── utils/         # Helper functions
│   │   └── index.tsx      # Widget entry point
│   ├── api/               # Backend logic (types, utilities)
│   └── shared/            # Shared code between frontend/backend
│
├── supabase/              # Backend infrastructure
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── recommendations/ # Main AI endpoint
│   │   └── _shared/       # Shared backend utilities
│   └── migrations/        # Database schema changes
│
├── PRPs/                  # Product Requirement Prompts
│   ├── completed/         # Implemented features
│   ├── templates/         # Reusable templates
│   └── *.md              # Active development tasks
│
├── tests/                 # Test suites
│   ├── unit/             # Component tests
│   ├── integration/      # API tests
│   └── e2e/              # End-to-end tests
│
├── public/               # Static assets
├── dist/                 # Build output (gitignored)
└── [Config Files]        # Various configuration files
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Main app build config
- `vite.config.widget.ts` - Widget-specific build config
- `tailwind.config.ts` - Styling configuration
- `.env.example` - Environment variables template
- `CLAUDE.md` - AI assistant guidelines
- `setup.sh` - Automated setup script

## 3. Getting Started

### Prerequisites
Before you begin, ensure you have:
- **Node.js 18+** and **npm 9+** installed
- **Docker Desktop** (for local Supabase)
- **Git** configured with SSH keys
- A **Supabase account** (free tier works)
- **API Keys**:
  - Anthropic API key (required for Claude)
  - OpenAI API key (optional, for fallback)

### Step-by-Step Setup

#### 1. Clone and Install
```bash
# Clone the repository
git clone [repository-url]
cd porta-futuri

# Run automated setup
./setup.sh

# Or manually:
npm install
```

#### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your keys:
# - SUPABASE_URL (from Supabase dashboard)
# - SUPABASE_ANON_KEY (from Supabase dashboard)
# - ANTHROPIC_API_KEY (from Anthropic console)
# - OPENAI_API_KEY (optional, from OpenAI)
```

#### 3. Start Backend Services
```bash
# Start Docker Desktop first (required for Supabase)
open -a Docker  # macOS

# Start Supabase locally
npm run supabase:start

# Apply database migrations
npm run supabase:reset
```

#### 4. Run Development Server
```bash
# Start the development server
npm run dev

# Widget will be available at:
# http://localhost:5173
```

#### 5. Verify Setup
```bash
# Run backend tests
npm run test:backend

# Check TypeScript
npm run typecheck

# Run linting
npm run lint
```

## 4. Key Components

### Entry Points

#### Widget Entry (`src/widget/index.tsx`)
The main widget initialization:
- Sets up React root
- Configures PostMessage communication
- Initializes TanStack Query
- Applies theming

#### API Entry (`supabase/functions/recommendations/index.ts`)
The main recommendation endpoint:
- Validates API keys
- Enforces rate limiting
- Generates AI recommendations
- Manages caching

### Core Business Logic

#### Recommendation Engine
- **Location**: `supabase/functions/recommendations/index.ts`
- **Purpose**: Orchestrates AI recommendation generation
- **Key Features**:
  - Multi-model support (Claude + GPT-4)
  - Context-aware prompting
  - Fallback to static recommendations
  - Response caching

#### CSV Processing
- **Location**: `src/widget/services/csv-parser.ts`
- **Purpose**: Handles file uploads and parsing
- **Limits**:
  - 50MB max file size
  - 10,000 products max
  - Streaming for large files

#### Session Management
- **Location**: Database + Edge Functions
- **Purpose**: Tracks user interactions
- **Features**:
  - 30-minute expiry
  - Conversation history
  - Context preservation

### Database Schema

Key tables in `supabase/migrations/`:
- `api_keys` - Authentication and rate limiting
- `sessions` - User session tracking
- `rate_limits` - Request throttling
- `recommendation_logs` - Analytics
- `widget_configs` - Customization

### API Endpoints

Main endpoint:
- `POST /functions/v1/recommendations`
  - Accepts: Product catalog, customer profile, context
  - Returns: AI recommendations with reasoning
  - Rate limited: 100 req/min default

### Authentication Flow
1. Widget includes API key in requests
2. Edge function validates key exists and is active
3. Checks rate limits for the current minute
4. Processes request or returns 429 if limit exceeded

## 5. Development Workflow

### Branch Strategy
```
main          # Production-ready code
├── develop   # Integration branch
└── feature/* # Feature branches
```

### Creating a New Feature

#### 1. Use PRP Framework
```bash
# Create a Product Requirement Prompt
cp PRPs/templates/feature-template.md PRPs/your-feature.md
# Edit with complete requirements
```

#### 2. Implement with AI Assistance
```bash
# Use Claude Code with the PRP
claude "Implement PRPs/your-feature.md"
```

#### 3. Test Your Changes
```bash
# Run relevant tests
npm test
npm run test:backend
npm run typecheck
```

### Code Style Guidelines
- **TypeScript**: Strict mode enabled
- **File Size**: Max 300 lines
- **Function Size**: Max 50 lines
- **Naming**: 
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case
- **Imports**: Absolute paths for src/

### Testing Requirements
- **Coverage Target**: 80% minimum
- **Test Types**:
  - Unit tests for utilities
  - Integration tests for API
  - E2E tests for user flows
- **Test Location**: Alongside source files (`*.test.ts`)

### PR Process
1. Create feature branch from `develop`
2. Implement feature following PRP
3. Ensure all tests pass
4. Run `npm run lint:fix` and `npm run format`
5. Create PR with:
   - Clear description
   - Link to PRP
   - Test results
   - Screenshots if UI changes

### CI/CD Pipeline
Currently manual deployment, automated pipeline planned:
1. Tests run on PR
2. Type checking
3. Linting
4. Build verification
5. Deploy to staging (planned)

## 6. Architecture Decisions

### Why These Choices?

#### React for Widget
- **Pros**: Component isolation, rich ecosystem
- **Cons**: Bundle size concern
- **Mitigation**: Aggressive tree-shaking, <50KB target

#### Supabase for Backend
- **Pros**: Integrated auth, real-time, edge functions
- **Cons**: Vendor lock-in
- **Mitigation**: Abstraction layer for portability

#### Claude as Primary AI
- **Pros**: Superior context understanding
- **Cons**: Cost, rate limits
- **Mitigation**: GPT-4 fallback, aggressive caching

### State Management
- **Widget State**: React hooks + Context
- **Server State**: TanStack Query
- **Why**: Simplicity, built-in caching, optimistic updates

### Error Handling Strategy
```typescript
// Three-layer approach:
1. Try primary AI (Claude)
2. Fallback to secondary AI (GPT-4)
3. Return static recommendations
```

### Security Measures
- API key validation
- Rate limiting per key
- Input sanitization
- CORS configuration
- No PII storage
- TLS 1.3 only

### Performance Optimizations
- 15-minute response caching
- Bundle splitting
- Lazy loading
- CDN for static assets
- Database indexing
- Connection pooling

## 7. Common Tasks

### Adding a New API Endpoint

1. Create edge function:
```bash
npx supabase functions new your-endpoint
```

2. Implement handler:
```typescript
// supabase/functions/your-endpoint/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Your logic here
});
```

3. Deploy:
```bash
npm run build:api
```

### Creating a New Widget Component

1. Create component file:
```typescript
// src/widget/components/YourComponent.tsx
export function YourComponent() {
  return <div className="pf-your-component">...</div>;
}
```

2. Use prefixed Tailwind classes (`pf-` prefix)

3. Add to widget exports if needed

### Adding Database Migration

1. Create migration:
```bash
npx supabase migration new your_migration_name
```

2. Write SQL:
```sql
-- supabase/migrations/[timestamp]_your_migration.sql
CREATE TABLE your_table (...);
```

3. Apply:
```bash
npm run supabase:migrate
```

### Debugging Common Issues

#### Widget Not Loading
- Check console for CORS errors
- Verify API key is set
- Check network tab for failed requests

#### AI Not Responding
- Verify API keys in .env.local
- Check rate limits
- Look for fallback activation

#### Tests Failing
- Ensure Supabase is running
- Check Docker is active
- Verify test API key exists

## 8. Potential Gotchas

### Configuration Pitfalls
- ⚠️ **API Keys**: Must be in .env.local, not .env
- ⚠️ **CORS**: Widget domain must be whitelisted
- ⚠️ **Docker**: Required for local Supabase
- ⚠️ **Port Conflicts**: 54321-54324 used by Supabase

### Development Quirks
- **Cache Behavior**: In-memory cache resets on function restart
- **Rate Limiting**: Applies even in development
- **Session Expiry**: 30 minutes, not configurable locally
- **Widget Isolation**: Can't access parent page directly

### Performance Considerations
- **CSV Size**: 50MB hard limit
- **Product Count**: 10,000 max for good performance
- **Bundle Size**: Monitor with `npm run build:widget`
- **API Latency**: Cold starts can be slow

### Known Issues
1. Cache doesn't persist between Edge Function restarts
2. Widget CSS might conflict without proper prefixing
3. Large CSV files can timeout on slow connections
4. Rate limit counter may lag by a few seconds

### Technical Debt Areas
- [ ] Cache implementation needs Redis for production
- [ ] Session management could use better abstraction
- [ ] Error messages need i18n support
- [ ] Widget needs better mobile responsiveness
- [ ] Test coverage for widget components lacking

## 9. Documentation and Resources

### Project Documentation
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guidelines and project conventions
- **[README.md](./README.md)** - High-level project overview
- **[PRPs/completed/](./PRPs/completed/)** - Full product requirements
- **[.env.example](./.env.example)** - All configuration options

### External Resources
- [Supabase Docs](https://supabase.com/docs) - Backend platform
- [React Docs](https://react.dev) - UI framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://radix-ui.com) - Component library
- [TanStack Query](https://tanstack.com/query) - Data fetching

### API Documentation
- Endpoint: `POST /functions/v1/recommendations`
- [Full API Spec](./docs/api.md) (TODO)
- Rate limits: See `.env.example`

### Team Resources
- Project Board: (TODO: Add link)
- Design System: Using Radix UI + Tailwind
- Deployment Guide: (TODO: Add link)

## 10. Next Steps - Your Onboarding Checklist

### Week 1: Environment Setup
- [ ] Install prerequisites (Node, Docker)
- [ ] Clone repository and run setup.sh
- [ ] Configure .env.local with API keys
- [ ] Start Supabase locally
- [ ] Run development server successfully
- [ ] Execute test suite (`npm run test:backend`)

### Week 1-2: Understand the Codebase
- [ ] Read through CLAUDE.md for conventions
- [ ] Explore widget components in `src/widget/`
- [ ] Understand recommendation endpoint flow
- [ ] Review database schema
- [ ] Try the PRP framework with a small task

### Week 2: Make Your First Contribution
- [ ] Pick a "good first issue" or small bug
- [ ] Create a PRP for your task
- [ ] Implement using the established patterns
- [ ] Write tests for your changes
- [ ] Submit PR with proper documentation

### Week 2-3: Deep Dive
- [ ] Understand the AI prompting strategy
- [ ] Learn the caching mechanism
- [ ] Explore rate limiting implementation
- [ ] Review security measures
- [ ] Identify an area for improvement

### Week 3-4: Become Productive
- [ ] Take on a medium-sized feature
- [ ] Participate in code reviews
- [ ] Suggest documentation improvements
- [ ] Help onboard the next developer

## Quick Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build:widget       # Build widget for production
npm run build:api          # Deploy edge functions

# Testing
npm run test               # Run all tests
npm run test:backend       # Test API endpoints
npm run test:unit          # Unit tests only
npm run typecheck          # TypeScript checking

# Database
npm run supabase:start     # Start local Supabase
npm run supabase:stop      # Stop Supabase
npm run supabase:reset     # Reset database

# Code Quality
npm run lint               # Check code style
npm run lint:fix           # Fix style issues
npm run format             # Format code
```

## Getting Help

### Common Issues?
1. Check the [Troubleshooting](#debugging-common-issues) section
2. Search existing PRPs for similar implementations
3. Review test files for usage examples

### Still Stuck?
- Check existing GitHub issues
- Ask in team chat (Slack/Discord)
- Consult CLAUDE.md for AI assistance patterns
- Create a PRP for complex problems

---

Welcome to the team! We're building something special here - an AI-powered shopping assistant that respects privacy while delivering amazing experiences. Your contributions will help make online shopping more personal and intelligent for millions of users.

Happy coding! 🚀