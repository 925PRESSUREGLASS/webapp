# CLAUDE.md - AI Assistant Guide

**Last Updated**: 2025-11-16
**Repository**: webapp
**Status**: Initial Setup Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Testing Strategy](#testing-strategy)
7. [Deployment & CI/CD](#deployment--cicd)
8. [Common Tasks](#common-tasks)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This repository is a web application project currently in its initial setup phase. This document serves as a comprehensive guide for AI assistants (like Claude) to understand the codebase structure, development workflows, and conventions.

### Purpose
- Provide context for AI assistants working on this codebase
- Document architectural decisions and patterns
- Establish coding conventions and best practices
- Guide development workflow and tooling

### Quick Facts
- **Project Type**: Web Application
- **Current Phase**: Initial Setup
- **Git Repository**: Yes
- **Platform**: Linux

---

## Repository Structure

```
webapp/
├── .git/                 # Git repository data
├── .gitattributes       # Git line ending configuration
└── CLAUDE.md           # This file
```

### Planned Structure

As the project develops, expect the following structure:

```
webapp/
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components/routes
│   ├── services/       # Business logic & API calls
│   ├── utils/          # Helper functions
│   ├── hooks/          # Custom React hooks (if applicable)
│   ├── store/          # State management
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── tests/              # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
├── config/             # Configuration files
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
├── .env.example       # Environment variable template
├── package.json       # Dependencies and scripts
└── README.md         # Project documentation
```

### Key Directories

- **src/**: All application source code
- **public/**: Static files served directly (images, fonts, etc.)
- **tests/**: All test files organized by type
- **config/**: Configuration for build tools, linters, etc.
- **docs/**: Additional documentation beyond README

---

## Technology Stack

### To Be Determined

As the project develops, document the stack here:

**Potential Stack Components:**
- **Frontend Framework**: React, Vue, Angular, Svelte, or other
- **Language**: JavaScript, TypeScript
- **Build Tool**: Vite, Webpack, Parcel, or other
- **Styling**: CSS, Sass, Tailwind, CSS-in-JS
- **State Management**: Redux, Zustand, MobX, Context API
- **Testing**: Jest, Vitest, Testing Library, Cypress, Playwright
- **Backend/API**: Node.js, Express, FastAPI, or other
- **Database**: PostgreSQL, MongoDB, MySQL, or other
- **Package Manager**: npm, yarn, pnpm

### Current Configuration

- **Git**: Line endings normalized to LF (via .gitattributes)

---

## Development Workflows

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Install dependencies (once package.json exists)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Branch Strategy

- **Main Branch**: `main` or `master` - production-ready code
- **Development Branches**: `claude/*` prefix for AI assistant work
- **Feature Branches**: `feature/*` - new features
- **Bug Fixes**: `fix/*` - bug fixes
- **Hotfixes**: `hotfix/*` - urgent production fixes

### Commit Convention

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```
feat(auth): add user login functionality
fix(api): resolve CORS issue with external API
docs(readme): update installation instructions
```

---

## Code Conventions

### General Principles

1. **DRY (Don't Repeat Yourself)**: Extract reusable logic into functions/components
2. **KISS (Keep It Simple, Stupid)**: Prefer simple, readable solutions
3. **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until needed
4. **Separation of Concerns**: Keep business logic separate from UI
5. **Single Responsibility**: Each module/component should have one clear purpose

### Naming Conventions

- **Files**: kebab-case for files: `user-profile.js`, `api-service.ts`
- **Components**: PascalCase: `UserProfile`, `NavigationBar`
- **Functions**: camelCase: `getUserData`, `calculateTotal`
- **Constants**: UPPER_SNAKE_CASE: `API_BASE_URL`, `MAX_RETRIES`
- **Private variables**: Prefix with underscore: `_privateMethod`

### Code Style

**JavaScript/TypeScript:**
```javascript
// Use const for immutable variables, let for mutable
const API_URL = 'https://api.example.com';
let userCount = 0;

// Use arrow functions for callbacks
const numbers = [1, 2, 3].map(n => n * 2);

// Use async/await over promise chains
async function fetchUserData(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Use template literals for strings
const greeting = `Hello, ${userName}!`;

// Destructure objects and arrays
const { name, email } = user;
const [first, second] = items;
```

**Comments:**
```javascript
// Single-line comments for brief explanations

/**
 * Multi-line comments for functions and complex logic
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<User>} The user object
 */
async function getUser(userId) {
  // Implementation
}
```

### Component Structure (React Example)

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api-service';
import './user-profile.css';

// 2. Types/Interfaces (TypeScript)
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

// 3. Component
export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // 3a. Hooks
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3b. Effects
  useEffect(() => {
    loadUser();
  }, [userId]);

  // 3c. Event handlers
  const handleUpdate = async () => {
    // Implementation
  };

  // 3d. Helper functions
  const loadUser = async () => {
    // Implementation
  };

  // 3e. Render
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};
```

### Error Handling

```javascript
// Always handle errors appropriately
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Log to error tracking service
  // Show user-friendly message
  throw new Error('User-friendly error message');
}

// Validate inputs
function processUser(user) {
  if (!user || !user.id) {
    throw new Error('Invalid user object');
  }
  // Process user
}
```

### Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Sanitize user input**: Prevent XSS attacks
3. **Validate on backend**: Don't trust client-side validation
4. **Use HTTPS**: Always use secure connections
5. **Implement CSP**: Content Security Policy headers
6. **Rate limiting**: Prevent abuse of APIs
7. **SQL injection prevention**: Use parameterized queries
8. **Authentication**: Use secure token-based auth (JWT, OAuth)

---

## Testing Strategy

### Test Organization

```
tests/
├── unit/              # Test individual functions/components
├── integration/       # Test component interactions
└── e2e/              # Test complete user flows
```

### Testing Principles

1. **Test behavior, not implementation**
2. **Write tests before fixing bugs** (TDD when appropriate)
3. **Keep tests simple and focused**
4. **Mock external dependencies**
5. **Aim for high coverage on critical paths**

### Example Test Structure

```javascript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user data for valid ID', async () => {
      const user = await getUserById('123');
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });

    it('should throw error for invalid ID', async () => {
      await expect(getUserById(null)).rejects.toThrow();
    });
  });
});
```

---

## Deployment & CI/CD

### Environment Variables

Create `.env.example` with required variables:

```env
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your_api_key_here

# Application Settings
NODE_ENV=development
PORT=3000

# Database (if applicable)
DATABASE_URL=postgresql://localhost:5432/webapp
```

### Build Process

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Preview production build
npm run preview
```

### CI/CD Pipeline

**Typical stages:**
1. **Lint**: Check code style
2. **Test**: Run all tests
3. **Build**: Create production bundle
4. **Deploy**: Deploy to hosting platform

---

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature with tests
3. Update documentation if needed
4. Commit with conventional commit message
5. Push and create pull request

### Fixing a Bug

1. Create fix branch: `git checkout -b fix/bug-description`
2. Write test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Commit and push

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (carefully!)
npm update

# Audit for security issues
npm audit
npm audit fix
```

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] No security vulnerabilities introduced
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Documentation updated if needed
- [ ] No unnecessary dependencies added

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always read relevant files first** before making changes
2. **Use TodoWrite tool** for multi-step tasks to track progress
3. **Follow existing patterns** in the codebase
4. **Write tests** for new functionality
5. **Commit incrementally** with clear messages
6. **Never commit secrets** or sensitive data
7. **Update this file** when architectural decisions change

### Before Making Changes

```bash
# Check current branch
git branch

# Check file status
git status

# Review recent changes
git log --oneline -10
```

### Code Quality Checks

Before committing, ensure:
- [ ] Code is linted and formatted
- [ ] Tests pass
- [ ] No console.log statements left in production code
- [ ] No commented-out code (remove it)
- [ ] Imports are organized
- [ ] No unused variables or imports

### Working with Git

```bash
# Create new feature branch
git checkout -b claude/feature-description

# Stage changes
git add <files>

# Commit with message
git commit -m "feat: add feature description"

# Push to remote
git push -u origin claude/feature-description
```

### Communication

- **Be explicit** about changes being made
- **Explain reasoning** for architectural decisions
- **Ask for clarification** when requirements are unclear
- **Suggest improvements** when you see opportunities
- **Document** non-obvious decisions in code comments

---

## Troubleshooting

### Common Issues

**Build Failures:**
1. Clear cache: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Check Node version compatibility

**Test Failures:**
1. Run single test: `npm test -- specific-test.js`
2. Update snapshots if needed: `npm test -- -u`
3. Check for async issues (missing await)

**Git Issues:**
1. Conflicts: Resolve manually or use `git mergetool`
2. Detached HEAD: `git checkout main`
3. Uncommitted changes: `git stash` then `git stash pop`

**Performance Issues:**
1. Profile with browser DevTools
2. Check bundle size: Use webpack-bundle-analyzer
3. Optimize images and assets
4. Implement code splitting

---

## Maintenance

### Keeping This File Updated

This file should be updated when:
- Technology stack changes
- New conventions are established
- Directory structure evolves
- New tools are added to the workflow
- Common issues and solutions are discovered

### Version History

- **2025-11-16**: Initial creation for new repository

---

## Resources

### Documentation Links

(Add as project develops)
- Project README
- API Documentation
- Architecture Decision Records (ADRs)
- Component Storybook
- Deployment Guide

### External Resources

- [Git Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## Notes for Future Development

### Initial Setup Checklist

When starting development, consider setting up:

- [ ] Package manager and package.json
- [ ] Framework of choice (React, Vue, etc.)
- [ ] Build tool configuration (Vite, Webpack, etc.)
- [ ] Linting (ESLint) and formatting (Prettier)
- [ ] Testing framework
- [ ] Git hooks (Husky) for pre-commit checks
- [ ] CI/CD pipeline
- [ ] Environment variable management
- [ ] TypeScript configuration (if using TypeScript)
- [ ] Component library or design system
- [ ] State management solution
- [ ] Routing solution
- [ ] API client setup
- [ ] Error tracking (Sentry, etc.)
- [ ] Analytics
- [ ] Documentation generation tools

### Architecture Decisions

Document major decisions here as the project evolves:

**Example:**
```
Decision: Use TypeScript instead of JavaScript
Reasoning: Better type safety, improved IDE support, fewer runtime errors
Date: YYYY-MM-DD
```

---

*This document is a living guide. Keep it updated as the project evolves.*
