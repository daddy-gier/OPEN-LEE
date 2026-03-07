# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] - 2024-03-07

### ✨ Added

- **Multi-AI Consensus Engine** - Fire 6 models simultaneously (Claude, ChatGPT, Mistral, Grok, OpenClaw, LudusAI)
- **Real-time Synthesis** - Intelligent merging of AI responses
- **Buddy System** - GPU cluster monitoring with real-time stats
- **Query Logging** - Track all conversations with timestamps
- **Windows Installer** - Professional one-click installation
- **Desktop Integration** - Start Menu shortcuts and desktop icons
- **Error Recovery** - Graceful handling of API failures
- **Request Cancellation** - AbortController support for cancelling requests
- **Offline Support** - Local models work without internet
- **Comprehensive Documentation** - 20+ beginner-friendly guides

### 🎨 UI/UX

- Beautiful React-based interface
- Real-time progress indicators
- Easy-to-use query interface
- GPU monitoring dashboard
- Query history browser

### 🔧 Technical

- Built with Electron + React + Node.js
- Vite for fast development
- Express.js proxy server
- Squirrel installer for Windows
- Electron Forge build system

### 📚 Documentation

- 20+ documentation files
- Beginner installation guide
- GitHub setup guide
- API key configuration guide
- Architecture documentation
- Contributing guidelines

### 🔒 Security

- Server-side API key handling
- No credentials in code
- Input validation
- Error handling (no sensitive data exposure)
- Environment variable support

---

## [3.0.0] - 2024-03-01

### ✨ Added

- Initial release
- Multi-AI integration skeleton
- Basic UI framework
- Configuration system

### 🐛 Fixed

- Core stability issues
- Initial setup process

---

## [Unreleased]

### 🚀 Planned Features

- Mac/Linux installers
- Web interface
- Advanced filtering options
- Additional AI model support
- Plugin system
- Custom synthesis rules
- Batch query processing
- API for third-party integration

### 🎯 Roadmap

- **v3.2.0** - Additional AI models + UI enhancements
- **v3.3.0** - Performance optimizations
- **v4.0.0** - Mac/Linux support + Web interface

---

## Version History

### Release Naming

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Support Policy

| Version | Released | Status | Support Until |
|---------|----------|--------|---------------|
| 3.1.x   | 2024-03-07 | Current | 2025-03-07 |
| 3.0.x   | 2024-03-01 | Maintenance | 2024-09-01 |

---

## How to Update

### From v3.0 to v3.1

```bash
# Option 1: Download new installer
# Download OPEN-LEE-3.1.0 Setup.exe from releases

# Option 2: Using npm (for development)
git pull origin main
npm install
npm run build
npm run make
```

---

## Breaking Changes

### From v3.0 to v3.1

None - Fully backward compatible!

---

## Migration Guides

### From v3.0 Settings to v3.1

Your existing settings will be automatically migrated.

If you have custom `.env` settings:

```bash
# Copy your old .env
cp .env .env.backup

# Update to new format if needed
# Usually no changes required
```

---

## Security Updates

### Critical Vulnerabilities

Any critical security vulnerabilities receive immediate patches, regardless of version.

### Patch Release Schedule

- Security patches: As needed
- Bug fixes: Monthly or as needed
- Feature updates: Quarterly

---

## Deprecation Notices

None currently - all features are actively supported.

---

## Known Issues

### v3.1.0

#### Resolved
- ✅ Memory usage optimization completed
- ✅ Query timeout handling improved
- ✅ API key configuration simplified

#### Known
- ⚠️ First query may take 5-10 seconds (API initialization)
- ⚠️ Windows Defender may flag installer as unknown (false positive)

---

## Contributors

Thanks to all contributors who helped with:

- Code contributions
- Documentation
- Bug reports
- Feature suggestions
- Testing

---

## Release Notes

For detailed release notes, see the [GitHub Releases](https://github.com/daddy-gier/open-lee/releases) page.

---

## Feedback

- Found a bug? [Report it](https://github.com/daddy-gier/open-lee/issues/new)
- Have a feature idea? [Suggest it](https://github.com/daddy-gier/open-lee/issues/new)
- Want to contribute? [See CONTRIBUTING.md](CONTRIBUTING.md)

---

**Last Updated:** 2024-03-07
**Maintained by:** daddy-gier
**License:** MIT
