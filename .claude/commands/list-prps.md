# List PRPs

## Command: List all PRPs and their status

List and analyze all PRP files in the project, showing their current status and implementation progress.

## Process

1. **Scan PRP Directories**
   - Active PRPs in `PRPs/*.md`
   - Completed PRPs in `PRPs/completed/*.md`
   - Templates in `PRPs/templates/*.md`

2. **Analyze Each PRP**
   - Extract title and goal
   - Check implementation status
   - Identify validation gates
   - Note priority level

3. **Check Implementation**
   - Look for related code files
   - Check if tests exist
   - Verify if validation passes

## Output Format

```markdown
## Active PRPs

### 1. [PRP Name] - Status: [Draft/Ready/In Progress]
- **File**: PRPs/filename.md
- **Goal**: Brief description
- **Priority**: P1/P2/P3
- **Implementation**: Not started/Partial/Complete
- **Tests**: Missing/Failing/Passing
- **Notes**: Any relevant observations

### 2. [Next PRP...]

## Completed PRPs

### 1. [PRP Name] - Completed: [Date]
- **File**: PRPs/completed/filename.md
- **Implementation**: Files created/modified
- **Validation**: All checks passing

## Suggested Next Steps

Based on priority and dependencies:
1. Implement [PRP Name] - [Reason]
2. Complete [PRP Name] - [Reason]
3. Create PRP for [Feature] - [Reason]
```

## Priority Guidelines

**P1 - Foundation (Week 1)**
- Project setup
- CSV parser
- Basic widget
- Supabase connection

**P2 - Core Features (Week 2)**
- Recommendation engine
- Chat interface
- API endpoints
- Customer profile

**P3 - Enhancement (Week 3-4)**
- LLM integration
- Real-time updates
- Caching
- Performance optimization

## Status Definitions
- **Draft**: PRP created but incomplete
- **Ready**: PRP complete, ready for implementation
- **In Progress**: Currently being implemented
- **Completed**: Implementation done, tests passing
- **Blocked**: Waiting on dependencies

Remember to move completed PRPs to `PRPs/completed/` directory.