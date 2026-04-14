# Deployment Guide

Deploy the Personal Wiki Extension to VS Code Marketplace or use locally.

---

## Option 1: Local Installation (Development)

For local testing and development.

### Steps

```bash
# 1. Open VS Code
code /Users/dennislee/Devs/KarpathyCopilotWiki

# 2. In VS Code, open Command Palette (Cmd+Shift+P)
# 3. Run: "Developer: Install Extension from Location"
# 4. Select: extension/ folder
# 5. Click "Install" when prompted
```

### Verify Installation

1. Open Command Palette
2. Type: `@wiki` - should show available commands
3. Should see: `ingest`, `search`, `lint`, `indexRebuild`

---

## Option 2: Sideload Extension (Testing)

Package as VSIX and share with others.

### Steps

```bash
cd extension

# 1. Install packaging tool
npm install -g vsce

# 2. Create VSIX package
npm run package
# Creates: extension.vsix

# 3. For sharing: Upload extension.vsix to cloud storage
# 4. On recipient machine: Run in VS Code
# 5. Command Palette → "Extensions: Install from VSIX"
# 6. Select downloaded extension.vsix
```

### Distribution

```bash
# Upload to share
# - Slack/Teams: Direct upload
# - GitHub: Release assets
# - OneDrive/iCloud: Shareable link
# - Email: Attachment (up to 20MB)
```

---

## Option 3: VS Code Marketplace (Production)

Publish to official marketplace for public use.

### Prerequisites

1. **Microsoft Account**
   - Go to https://marketplace.visualstudio.com/
   - Click "Sign in" (top right)
   - Use Microsoft or GitHub account

2. **Create Publisher**
   - On marketplace, click your profile
   - Click "Create Publisher"
   - Fill in:
     - Publisher name: `karpathy` (or your username)
     - Display name: "Karpathy Copilot Wiki"
     - Description: "Personal wiki extension for Copilot Chat"

3. **Install vsce CLI**
   ```bash
   npm install -g vsce
   ```

### Publishing Steps

```bash
cd extension

# 1. Ensure package.json has publisher
# Edit package.json:
{
  "publisher": "karpathy",
  "name": "copilot-wiki",
  "version": "1.0.0",
  "displayName": "Karpathy Copilot Wiki",
  "description": "Personal wiki integrated with GitHub Copilot",
  ...
}

# 2. Create Personal Access Token (PAT)
# Go to: https://dev.azure.com/
# → User Settings (top right) → Personal access tokens
# → New Token
# - Name: "vscode-publish"
# - Organization: "All organizations"
# - Scopes: "Marketplace (publish)" ✓
# - Expiration: 1 year
# → Create

# 3. Login to vsce
vsce login karpathy
# Paste PAT when prompted

# 4. Publish
npm run publish
# Or manually:
vsce publish patch  # For patch version (1.0.0 → 1.0.1)
vsce publish minor  # For minor version (1.0.0 → 1.1.0)
vsce publish major  # For major version (1.0.0 → 2.0.0)
```

### Verify Publication

1. Go to https://marketplace.visualstudio.com/
2. Search: "Karpathy Copilot Wiki"
3. Should appear in results with your settings

### Update Publication

```bash
# After code changes:

# 1. Update version in package.json
# "version": "1.0.1"

# 2. Commit to git
git add package.json
git commit -m "Bump version to 1.0.1"

# 3. Publish update
vsce publish patch

# 4. Tag release
git tag v1.0.1
git push --tags
```

---

## Continuous Deployment (Optional)

Automate publishing with GitHub Actions.

### Setup

```bash
# 1. Create .github/workflows/publish.yml
cat > .github/workflows/publish.yml << 'EOF'
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: cd extension && npm install
      - run: cd extension && npm run compile
      - run: cd extension && npm test
      
      - run: npm install -g vsce
      - run: cd extension && vsce publish --pat ${{ secrets.VSCODE_MARKETPLACE_TOKEN }}
EOF

# 2. Add secret to GitHub
# Go to: GitHub → Settings → Secrets → Actions
# → New repository secret
# - Name: VSCODE_MARKETPLACE_TOKEN
# - Value: [Your PAT from step above]

# 3. Push tag to trigger
git tag v1.0.0
git push --tags
```

---

## Marketplace Listing

Make your extension discoverable.

### Extension Metadata

Edit `extension/package.json`:

```json
{
  "name": "copilot-wiki",
  "displayName": "Karpathy Copilot Wiki",
  "version": "1.0.0",
  "publisher": "karpathy",
  "description": "Build and search your personal knowledge base with Copilot Chat integration",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/karpathy-copilot-wiki"
  },
  "bugs": {
    "url": "https://github.com/yourusername/karpathy-copilot-wiki/issues"
  },
  "homepage": "https://github.com/yourusername/karpathy-copilot-wiki#readme",
  "keywords": [
    "wiki",
    "knowledge-base",
    "copilot",
    "search",
    "semantic",
    "productivity"
  ],
  "categories": [
    "Other",
    "Knowledge Management"
  ],
  "qna": "marketplace",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },
  "icon": "extension/assets/icon.png",
  "activationEvents": [
    "onStartupFinished"
  ],
  "engines": {
    "vscode": "^1.90.0"
  }
}
```

### README Display

The `README.md` appears on marketplace. Make it attractive:

```markdown
# Karpathy Copilot Wiki

Your personal knowledge base, integrated with GitHub Copilot Chat.

## Features

- 📝 Create and organize wiki pages with automatic metadata
- 🔍 Fast BM25 search across all pages
- 🏷️ Auto-generated glossaries and tagging
- 💾 Archive conversations as permanent decisions
- 🔗 Automatic backlink detection and graph construction
- ✅ Quality analysis with orphan detection

## Quick Start

[Include screenshot or GIF]

1. Install extension
2. Run `@wiki ingest` to import documents
3. Use `@wiki search [topic]` to find pages
4. Archive conversations with `📌 Archive this decision`

## Requirements

- VS Code 1.90+
- Node.js 18+ (for development)
- 50MB disk space for base setup

## License

MIT
```

### Icon and Screenshots

Add visual assets:

```bash
mkdir -p extension/assets

# 1. Create icon (128x128px)
# extension/assets/icon.png

# 2. Create screenshots (1280x720px)
# extension/assets/screenshot-1.png - Main feature
# extension/assets/screenshot-2.png - Search UI
# extension/assets/screenshot-3.png - Archive decision

# Reference in package.json:
# "icon": "assets/icon.png"
```

---

## Version Management

Semantic versioning for extensions.

```
MAJOR.MINOR.PATCH
1.0.0

1 = MAJOR: Breaking changes
0 = MINOR: New features (backward compatible)
0 = PATCH: Bug fixes
```

### Changelog

Create `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.0] - 2026-04-14

### Added
- Initial MVP release
- Wiki page creation and management
- BM25 search with multiple fallbacks
- Decision archiving from Copilot Chat
- Quality analysis (orphan detection)
- Backlink graph construction

### Fixed
- Relative path handling in Windows

### Known Limitations
- Local embeddings Phase 3+
- Max 500 pages for optimal performance
```

---

## Support & Feedback

### GitHub Issues

```bash
# Create GitHub repository
# Add issue templates

.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── support_question.md
```

### Update Frequency

- **Bug fixes**: Within 1-2 days
- **Minor features**: Weekly/bi-weekly
- **Major releases**: Monthly

### Feedback Loop

1. Monitor marketplace reviews
2. Track GitHub issues
3. Implement top-requested features
4. Release updates every 2-4 weeks

---

## Troubleshooting Publishing

### Error: "Cannot publish - not authenticated"

```bash
# Solution:
vsce logout
vsce login karpathy
# Enter PAT when prompted
```

### Error: "Extension already published with same version"

```bash
# Solution: Bump version
# Edit package.json: "version": "1.0.1"
vsce publish patch
```

### Error: "Icon must be at least 128x128"

```bash
# Solution: Create proper icon
# Use tool like: https://www.canva.com/
# File: extension/assets/icon.png (128x128px PNG)
```

---

## Security Considerations

### Before Publishing

- [ ] Remove all API keys/secrets from codebase
- [ ] Use environment variables for sensitive data
- [ ] Run security audit: `npm audit`
- [ ] Test on multiple OS (Mac, Windows, Linux)
- [ ] Code review by 2+ people
- [ ] Verify no telemetry without consent

### After Publishing

- [ ] Monitor for security vulnerabilities
- [ ] Update dependencies monthly
- [ ] Have incident response process
- [ ] Include security policy in README

---

## Analytics (Optional)

Track extension usage (with consent):

```typescript
// extension/src/utils/telemetry.ts
export class TelemetryReporter {
  async reportEvent(name: string, properties?: any) {
    // Only send non-sensitive data
    // Always get user consent first
    console.log(`[Telemetry] ${name}`, properties);
  }
}
```

Add to settings:
```json
"wiki.telemetry": true/false
```

---

## Next Steps

1. ✅ Complete local testing
2. ✅ Create marketplace account
3. ✅ Build extension package
4. ✅ Publish first version (1.0.0)
5. ✅ Monitor feedback
6. ✅ Plan Phase 2 features
7. ✅ Collect user testimonials

---

**Ready to launch?** Run:
```bash
cd extension && vsce publish patch
```
