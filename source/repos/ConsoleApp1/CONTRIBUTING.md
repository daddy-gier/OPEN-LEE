# 🤝 Contributing to OPEN-LEE v3.1

Thank you for your interest in contributing to OPEN-LEE! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Style Guide](#style-guide)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Report unacceptable behavior to the maintainers

### Our Standards

- **Respectful**: Treat all contributors with respect
- **Inclusive**: Welcome people of all backgrounds
- **Collaborative**: Work together for the best solutions
- **Professional**: Keep communications professional and constructive

---

## Getting Started

### Prerequisites

Before you begin, make sure you have:

- Node.js v18 or higher
- npm v9 or higher
- Git installed
- A GitHub account
- Understanding of JavaScript/React (for code contributions)

### Setup Your Development Environment

1. **Fork the repository**
   - Go to https://github.com/daddy-gier/open-lee
   - Click "Fork" in the top right
   - Clone your fork: `git clone https://github.com/YOUR-USERNAME/open-lee.git`

2. **Add upstream remote**
   ```bash
   cd open-lee
   git remote add upstream https://github.com/daddy-gier/open-lee.git
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Install Dependencies

```bash
# Install main dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install web dependencies
cd web
npm install
cd ..
```

### Run Development Environment

```bash
# Terminal 1: Start the dev server
npm run dev

# Terminal 2: Start Electron in dev mode (if making Electron changes)
npm run start
```

### Build for Production

```bash
# Build React frontend
npm run build

# Build installer
npm run make
```

---

## Making Changes

### Code Style

Please follow these guidelines:

- **JavaScript/React**: Use ES6+ features, meaningful variable names, and comments for complex logic
- **Formatting**: Use Prettier for code formatting (configuration in `package.json`)
- **Linting**: Run `npm run lint` before committing

### Branch Naming

Use descriptive branch names:

```
feature/add-new-ai-model
fix/memory-leak-in-synthesis
docs/improve-installation-guide
test/add-unit-tests
```

### Commit Messages

Write clear, descriptive commit messages:

```
Good:
- feat: Add support for Claude 3.5 model
- fix: Resolve memory leak in query processing
- docs: Improve API key setup documentation
- test: Add unit tests for synthesis engine

Bad:
- update
- fix bug
- changes
- asdf
```

### Types of Contributions

#### Bug Fixes
- Fix bugs and issues
- Should include tests when possible
- Reference the issue number: `Fixes #123`

#### Features
- New AI model integrations
- UI/UX improvements
- Performance optimizations
- New documentation

#### Documentation
- Improve existing docs
- Add new tutorials
- Update installation guide
- Add troubleshooting sections

#### Tests
- Unit tests
- Integration tests
- E2E tests

---

## Submitting Changes

### Step 1: Create a Pull Request

```bash
# Push your changes
git push origin feature/your-feature-name

# Go to GitHub and click "New Pull Request"
# Fill in the PR template (see below)
```

### Step 2: PR Checklist

Before submitting, ensure:

- [ ] Code follows the style guide
- [ ] Tests pass: `npm run test`
- [ ] Linting passes: `npm run lint`
- [ ] Documentation is updated
- [ ] No unnecessary files committed
- [ ] Commit messages are clear

### Step 3: PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Step 4: Review and Merge

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged!

---

## Reporting Bugs

### Before Reporting

1. Check existing issues (it might already be reported)
2. Update to the latest version
3. Verify the issue is reproducible

### Creating a Bug Report

Click "New Issue" and use the bug report template:

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 11
- OPEN-LEE version: 3.1.0
- Node version: 18.0.0

## Screenshots
Add screenshots if helpful

## Additional Context
Any other information
```

---

## Suggesting Enhancements

### Enhancement Request Template

Click "New Issue" and use the feature request template:

```markdown
## Description
Brief description of the enhancement

## Motivation
Why should this feature be added?

## Proposed Solution
How should this work?

## Alternative Solutions
Other approaches considered

## Additional Context
Any other information
```

---

## Style Guide

### JavaScript/React

```javascript
// Good: Clear variable names, comments for complex logic
const synthesizeResponses = (responses) => {
  // Filter out empty responses
  const validResponses = responses.filter(r => r && r.length > 0);
  
  // Merge and deduplicate insights
  return mergeInsights(validResponses);
};

// Bad: Unclear naming
const sr = (r) => {
  const vr = r.filter(x => x);
  return m(vr);
};
```

### File Organization

```
src/
├── components/     # React components
├── pages/          # Page components
├── utils/          # Utility functions
├── services/       # API/services
├── styles/         # CSS/styling
└── index.js        # Entry point
```

### Comments

```javascript
// Use comments to explain WHY, not WHAT
// Good:
// Debounce user input to reduce API calls
const debouncedSearch = debounce(search, 300);

// Bad:
// Set timeout for search
setTimeout(() => search(), 300);
```

---

## Git Workflow

### Basic Workflow

```bash
# 1. Create and checkout branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Stage changes
git add .

# 4. Commit with clear message
git commit -m "feat: Add new feature"

# 5. Keep updated with upstream
git fetch upstream
git rebase upstream/main

# 6. Push to your fork
git push origin feature/new-feature

# 7. Create PR on GitHub
```

### Before Merging

```bash
# Ensure you're up to date
git fetch upstream
git rebase upstream/main

# Run tests and linting
npm run test
npm run lint

# Build to verify
npm run build
```

---

## Common Issues

### "Permission denied" when pushing

```bash
# Check remote URL
git remote -v

# Update to SSH (if needed)
git remote set-url origin git@github.com:YOUR-USERNAME/open-lee.git
```

### Merge conflicts

```bash
# Keep your changes
git checkout --ours <file>

# Keep their changes
git checkout --theirs <file>

# Manual resolution: Edit file and commit
git add <file>
git commit -m "fix: Resolve merge conflict"
```

### Revert changes

```bash
# Undo last commit (keep changes)
git reset HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## Need Help?

- **Documentation**: See [README.md](../README.md)
- **Issues**: Check [GitHub Issues](https://github.com/daddy-gier/open-lee/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/daddy-gier/open-lee/discussions)

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Thanked in release notes
- Recognized in documentation

---

Thank you for contributing to OPEN-LEE! 🚀

**Built with ❤️ by the community | OPEN-LEE v3.1**
