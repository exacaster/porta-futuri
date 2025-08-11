# Quick Start Guide - Porta Futuri AI Add-On

Get up and running in 5 minutes! 🚀

## Prerequisites
- Node.js 18+ and npm 9+
- Docker Desktop installed and running
- Anthropic API key (for Claude AI)

## Setup Steps

### 1. Clone and Install (1 minute)
```bash
git clone [repository-url]
cd porta-futuri
./setup.sh  # Automated setup
```

### 2. Configure API Keys (1 minute)
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```env
ANTHROPIC_API_KEY=your_claude_api_key_here
# Optional: OPENAI_API_KEY=your_openai_key_here
```

### 3. Start Backend (2 minutes)
```bash
# Make sure Docker Desktop is running first!
npm run supabase:start
npm run supabase:reset  # Sets up database
```

### 4. Start Development Server (1 minute)
```bash
npm run dev
```

✅ **You're ready!** Open http://localhost:5173

## Verify Everything Works

### Test the Backend
```bash
npm run test:backend
```

You should see all tests passing with green checkmarks.

### Check the Widget
1. Open http://localhost:5173
2. You should see the recommendation widget interface
3. Try uploading a sample CSV (check `tests/fixtures/` for examples)

## Essential Commands

```bash
# Development
npm run dev              # Start development server
npm run supabase:start   # Start backend services
npm run supabase:stop    # Stop backend services

# Testing
npm run test:backend     # Test API endpoints
npm run typecheck        # Check TypeScript
npm run lint             # Check code style

# Building
npm run build:widget     # Build production widget
```

## Project Structure at a Glance

```
porta-futuri/
├── src/widget/          # React widget code
├── supabase/functions/  # Backend API endpoints
├── tests/               # Test files
├── PRPs/                # Feature specifications
└── .env.local          # Your configuration (create this!)
```

## Common Issues

### "Cannot connect to Docker daemon"
→ Start Docker Desktop first

### "Invalid API key" errors
→ Check your `.env.local` has correct API keys

### "Port already in use"
→ Supabase uses ports 54321-54324, make sure they're free

### Tests failing
→ Make sure Supabase is running: `npm run supabase:start`

## What's Next?

1. **Read [ONBOARDING.md](./ONBOARDING.md)** for complete developer guide
2. **Explore the widget** at http://localhost:5173
3. **Run tests** to understand the codebase
4. **Check PRPs folder** for current development tasks
5. **Read CLAUDE.md** for AI-assisted development workflow

## Need Help?

- 📖 Full documentation: [ONBOARDING.md](./ONBOARDING.md)
- 🤖 AI guidelines: [CLAUDE.md](./CLAUDE.md)
- 📋 Requirements: [PRPs/completed/](./PRPs/completed/)
- 🧪 Test examples: [tests/integration/](./tests/integration/)

---

**Pro Tip**: Use the PRP framework for AI-assisted development:
```bash
# Create a task specification
cp PRPs/templates/feature-template.md PRPs/my-feature.md
# Then use with Claude Code
claude "Implement PRPs/my-feature.md"
```

Happy coding! 🎉