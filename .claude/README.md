# Claude Commands & PRP Framework Setup

## Overview
This directory contains Claude Code commands and configuration for the PRP (Product Requirement Prompt) framework, enabling AI-assisted development for the Porta Futuri AI Add-On project.

## Quick Start

### Using Claude Commands
Commands are available with the `/` prefix in Claude Code:

```bash
# Create a new PRP for a feature
/create-base-prp CSV parser implementation

# Execute an existing PRP
/execute-base-prp PRPs/2025-08-08-csv-parser.md

# List all PRPs and status
/list-prps

# Create widget-specific PRP
/create-widget-prp Recommendation card component

# Create API endpoint PRP
/create-api-prp Recommendation endpoint
```

### Manual PRP Creation
1. Copy appropriate template:
```bash
cp PRPs/templates/feature-template.md PRPs/2025-08-08-my-feature.md
```

2. Fill out all sections thoroughly
3. Execute with Claude Code:
```bash
claude "Implement PRPs/2025-08-08-my-feature.md"
```

## Available Commands

### PRP Management
- `/create-base-prp` - Create general feature PRP
- `/execute-base-prp` - Execute existing PRP
- `/create-widget-prp` - Widget component PRP (React/TypeScript)
- `/create-api-prp` - API endpoint PRP (Supabase)
- `/list-prps` - List all PRPs with status

### Development Workflow
- `/planning-create` - Create implementation plan
- `/spec-create-adv` - Advanced specification
- `/spec-execute` - Execute specification
- `/review-general` - Review code changes
- `/refactor-simple` - Simple refactoring

### Utilities
- `/prime-core` - Load core project context
- `/onboarding` - Developer onboarding
- `/debug` - Debug assistance

## PRP Runner Script

### Interactive Mode
```bash
python PRPs/scripts/prp_runner.py --prp-path PRPs/csv-parser.md --interactive
```

### Headless Mode
```bash
# Text output
python PRPs/scripts/prp_runner.py --prp csv-parser

# JSON output
python PRPs/scripts/prp_runner.py --prp csv-parser --output-format json

# Streaming JSON
python PRPs/scripts/prp_runner.py --prp csv-parser --output-format stream-json
```

## Directory Structure
```
.claude/
├── commands/           # Claude command definitions
│   ├── create-base-prp.md
│   ├── execute-base-prp.md
│   ├── create-widget-prp.md
│   ├── create-api-prp.md
│   └── ...
├── settings.json      # Project configuration
└── README.md         # This file
```

## Configuration (settings.json)

### Key Settings
- **tools.enabled**: Enabled Claude tools
- **tools.auto_approve**: Auto-approved operations
- **context.primaryFiles**: Files auto-included for context
- **commands**: NPM scripts and shortcuts
- **prp_config**: PRP directory configuration

### Auto-Approved Operations
- Reading files in PRPs/, src/, tests/
- Writing to PRPs/, src/, tests/
- Running npm scripts and PRP runner

## Best Practices

### Creating PRPs
1. **Be Specific**: Include exact file paths and function names
2. **Include Context**: Reference requirements and existing patterns
3. **Define Success**: Clear validation criteria
4. **Consider Limits**: Bundle size, response time, rate limits
5. **Test Thoroughly**: Include unit, integration, and E2E tests

### Executing PRPs
1. **Review First**: Always review generated PRP before execution
2. **Phase Approach**: Break complex PRPs into phases
3. **Validate Often**: Run validation gates after each change
4. **Monitor Progress**: Check implementation status regularly
5. **Archive Complete**: Move finished PRPs to completed/

## Project-Specific Guidelines

### Widget Development
- React 18.3 with TypeScript strict mode
- shadcn/ui components only
- Bundle size <50KB compressed
- Load time <500ms
- Use React.memo for optimization

### API Development
- Supabase Edge Functions
- Response time <3 seconds (P95)
- Rate limiting: 100 req/min
- CSV: 50MB max, 10K products max
- Cache TTL: 15 minutes

### Testing Requirements
- Minimum 80% coverage
- TypeScript strict mode passing
- Linting with no errors
- Performance benchmarks met
- Security audit passed

## Troubleshooting

### Command Not Found
Ensure you're using Claude Code and the command starts with `/`

### PRP Execution Fails
1. Check all file paths are absolute
2. Verify library versions match project
3. Ensure validation gates are executable
4. Review error messages for missing context

### Performance Issues
1. Check bundle size with build
2. Profile response times
3. Verify caching is working
4. Monitor LLM token usage

## Support

For issues or questions:
1. Check CLAUDE.md for project guidelines
2. Review completed PRPs for examples
3. Use `/debug` command for assistance
4. Consult PRPs/README.md for framework details

---

*PRP Framework v1.0 - Configured for Porta Futuri AI Add-On*