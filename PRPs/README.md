# PRPs (Product Requirement Prompts) for Porta Futuri AI Add-On

## What are PRPs?

PRPs are detailed, context-rich documents that provide AI coding assistants with all the information needed to implement features correctly in a single pass. They combine product requirements, technical specifications, and implementation guidance.

## Directory Structure

```
PRPs/
├── templates/          # PRP templates for different types of work
│   ├── feature-template.md
│   ├── bugfix-template.md
│   └── integration-template.md
├── ai_docs/           # Documentation for AI context
├── completed/         # Archived completed PRPs
├── scripts/           # Utility scripts
└── *.md              # Active PRPs
```

## How to Use PRPs

### 1. Creating a New PRP

Choose the appropriate template from `templates/`:
- **feature-template.md** - For new features or enhancements
- **bugfix-template.md** - For bug fixes
- **integration-template.md** - For third-party integrations

Copy the template and name it descriptively:
```bash
cp templates/feature-template.md 2025-08-08-csv-parser.md
```

### 2. Writing a PRP

Fill out all sections of the template:
1. **Goal** - Clear, concise objective
2. **Why** - Business value and impact
3. **Context** - All relevant information
4. **Implementation Blueprint** - Detailed steps
5. **Validation** - How to verify success

Include:
- Exact file paths
- Code examples
- Library versions
- Known constraints
- Test criteria

### 3. Using with Claude Code

When ready to implement:
```bash
# Review the PRP
cat PRPs/your-prp.md

# Execute with Claude Code
claude "Implement the PRP in PRPs/your-prp.md"
```

### 4. PRP Lifecycle

1. **Draft** - Initial creation
2. **Ready** - Complete and ready for implementation
3. **In Progress** - Being implemented
4. **Completed** - Implementation done, move to `completed/`

## Best Practices

### DO:
- ✅ Be specific about file paths and function names
- ✅ Include relevant code snippets
- ✅ Reference the requirements document
- ✅ Define clear success criteria
- ✅ Include test cases
- ✅ Specify library versions
- ✅ Document known limitations

### DON'T:
- ❌ Leave sections empty
- ❌ Use vague descriptions
- ❌ Skip validation criteria
- ❌ Forget about error handling
- ❌ Ignore performance requirements

## Example PRPs for Porta Futuri

### Core Features (Priority 1)
1. `csv-parser.md` - CSV file parsing and validation
2. `widget-embed.md` - Embeddable widget implementation
3. `recommendation-engine.md` - AI recommendation core
4. `chat-interface.md` - Conversational UI

### Infrastructure (Priority 2)
1. `supabase-setup.md` - Database and Edge Functions
2. `api-endpoints.md` - RESTful API implementation
3. `authentication.md` - API key management
4. `rate-limiting.md` - Request throttling

### Enhancements (Priority 3)
1. `customer-profile-view.md` - Profile visualization
2. `caching-layer.md` - Performance optimization
3. `analytics.md` - Usage tracking
4. `error-handling.md` - Comprehensive error management

## Tips for AI Implementation

When using PRPs with Claude Code or other AI assistants:

1. **Start Simple**: Begin with basic functionality, then iterate
2. **Test Frequently**: Run validation after each major change
3. **Check Context**: Ensure the AI has access to CLAUDE.md
4. **Verify Outputs**: Always review generated code
5. **Incremental Progress**: Break large PRPs into phases

## Quality Checklist

Before marking a PRP as complete:
- [ ] All tests pass
- [ ] Code follows project standards (see CLAUDE.md)
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] Security requirements satisfied
- [ ] Error handling implemented
- [ ] Edge cases covered

## Resources

- **Requirements**: `/porta-futuri-ai-addon-requirements.md`
- **Guidelines**: `/CLAUDE.md`
- **Templates**: `/PRPs/templates/`
- **Documentation**: `/PRPs/ai_docs/`

## Getting Help

If you need assistance:
1. Review the requirements document
2. Check CLAUDE.md for project guidelines
3. Look at completed PRPs for examples
4. Ask Claude Code for clarification

---

*Remember: The goal of PRPs is to provide enough context for AI assistants to deliver production-ready code in a single implementation pass.*