# Create API PRP

## Feature: $ARGUMENTS

Generate a specialized PRP for Porta Futuri API endpoints with Supabase Edge Functions.

## Research Process

1. **API Structure Analysis**
   - Check existing Edge Functions in src/api/functions/
   - Review Supabase patterns and best practices
   - Analyze authentication/authorization
   - Note rate limiting implementation

2. **Data Flow**
   - CSV processing with PapaParse
   - LLM integration (Claude/GPT-4)
   - Caching strategies (15-minute TTL)
   - Response format standards

3. **Security & Performance**
   - Input validation patterns
   - Rate limiting (100 req/min)
   - Error handling
   - Response time targets (<3 seconds)

## PRP Generation

### Critical Context
- **Platform**: Supabase Edge Functions
- **Database**: PostgreSQL via Supabase
- **LLM**: Anthropic SDK primary, OpenAI fallback
- **CSV**: PapaParse with streaming
- **Security**: API key validation, CORS
- **Limits**: 50MB CSV, 10K products

### Implementation Tasks
1. Define API endpoint structure
2. Implement request validation
3. Add rate limiting middleware
4. Process CSV data
5. Integrate LLM service
6. Implement caching layer
7. Add error handling
8. Create response formatting
9. Add monitoring/logging

### Validation Gates
```bash
# TypeScript check
npm run typecheck

# API tests
npm test src/api/**/*.test.ts

# Integration test
npm run test:integration

# Performance test (should respond <3s)
time curl -X POST http://localhost:3000/api/v1/recommend \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"test": "data"}'
```

## API-Specific Checks
- [ ] Input validation complete
- [ ] Rate limiting tested
- [ ] Error responses standardized
- [ ] CORS configured properly
- [ ] Authentication working
- [ ] Response time <3 seconds (P95)
- [ ] Graceful degradation
- [ ] Logging implemented

Output: `PRPs/api-{endpoint-name}.md`