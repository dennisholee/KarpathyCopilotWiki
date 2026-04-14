# FAQ & Troubleshooting

Common issues and solutions for the Personal Wiki Extension.

---

## Installation & Setup

### Q: Extension doesn't appear in Command Palette

**Check**:
1. VS Code recognized the installation
2. Extension activation events triggered

**Solutions**:

```bash
# 1. Verify installation
cd extension
npm list

# 2. Rebuild TypeScript
npm run compile

# 3. Reload VS Code
Cmd+Shift+P → Developer: Reload Window

# 4. Check extension output
View → Output → Select "@wiki" from dropdown

# 5. Verify activate event in package.json
# Should have: "activationEvents": ["onStartupFinished"]
```

### Q: "Could not find workspace folder"

**Solution**:
```bash
# Ensure you have a workspace open
# File → Open Folder → Select KarpathyCopilotWiki folder
```

### Q: npm install fails with peer dependency error

**Solution**:
```bash
cd extension

# Try with legacy peer deps
npm install --legacy-peer-deps

# Or use npm 7+
npm install --prefer-offline --no-audit
```

---

## Document Ingestion

### Q: No pages created after running ingest

**Verify**:
1. `/raw` folder exists and has files
2. Files are readable (not locked)
3. `/wiki` folder is writable

**Debug**:
```bash
# Check file permissions
ls -la raw/
ls -la wiki/

# Verify Python script works
python -m tools.ingest.ingest run --verbose

# Check for parsing errors
cat wiki/*.md | head -20
```

### Q: Ingest creates empty pages

**Cause**: Document parsing failed

**Solution**:
```bash
# 1. Check file format
# Supported: .txt, .md, .pdf (with pdfplumber)

# 2. Install PDF support (optional)
pip install pdfplumber

# 3. Verify file content
# UTF-8 encoded, not binary

# 4. Re-run ingest with debug output
python -m tools.ingest.ingest run --debug
```

### Q: Special characters break page creation

**Solution**:
```bash
# Ensure files are UTF-8 encoded
file -i raw/*.txt

# Convert if needed
iconv -f ISO-8859-1 -t UTF-8 old.txt > new.txt

# Re-run ingest
npm run wiki.ingest
```

---

## Search & Queries

### Q: Search returns no results or low relevance

**Check**:
1. Index is initialized
2. Query matches page content
3. BM25 parameters are reasonable

**Debug**:
```typescript
// Test in code:
const results = await searchEngine.search("query");
console.log("Results:", results);
console.log("Used fallback?", results.usedFallback);
```

**Solutions**:

```bash
# 1. Rebuild index
npm run wiki.indexRebuild

# 2. Check page content
cat wiki/*.md | grep -i "your_query"

# 3. Try simpler query (fewer words)
# Instead of: "neural network attention transformer"
# Try: "attention"

# 4. Check for typos
# Query is case-insensitive but accent-sensitive
```

### Q: Search is slow (>2 seconds)

**Cause**: Large wiki or missing index

**Solutions**:

```bash
# 1. Rebuild index
npm run wiki.indexRebuild

# 2. Limit search results
queryHandler.query("topic", { maxResults: 5 });

# 3. Check page count
wikiManager.listPages().length

# 4. Consider splitting into sub-wikis
# One wiki per topic domain
```

### Q: Autocomplete suggestions are irrelevant

**Solutions**:

```bash
# Review page titles in /wiki/*.md
# Improve titles for clarity:
# ❌ "Page 1" → ✅ "Neural Networks Fundamentals"

# Rebuild index
npm run wiki.indexRebuild

# Add aliases for common terms
# In page frontmatter:
# aliases: ["NN", "Deep Learning"]
```

---

## Wiki Quality

### Q: Lint shows high orphan count

**Meaning**: Pages have no incoming/outgoing links

**Solutions**:

```bash
# 1. Review orphan pages
npm run wiki.lint deep
# Check the "orphanPages" list

# 2. Add links manually
# Edit orphan pages, add WikiLinks:
# [[Related Topic]]
# [[Another Connection]]

# 3. Merge similar pages
# Combine related orphans to create connections

# 4. Re-run lint
npm run wiki.lint quick
# Check if quality score improved
```

### Q: Low quality score (< 50)

**Solutions**:

```bash
# 1. Check graph density
# < 0.3 = sparse, needs more connections

# 2. Add cross-links between pages
# Review similar pages, link them
# Use: wikiManager.getBacklinkGraph()

# 3. Identify central hubs
# Create well-connected index pages

# 4. Consolidate small topics
# Merge related micro-pages

# 5. Target: 0.4-0.6 graph density is healthy
```

### Q: Duplicate pages detected

**Solution**:
```bash
# 1. Find duplicates
grep -r "title:" wiki/*.md | sort | uniq -d

# 2. Merge content
# Keep most complete version
# Delete duplicate files
rm wiki/duplicate.md

# 3. Update links to point to merged page
# Search for old WikiLinks
grep -r "\\[\\[Duplicate" wiki/

# 4. Change to: [[Main Page]]
# Then rebuild index
npm run wiki.indexRebuild
```

---

## Decision Archiving

### Q: Archived conversation doesn't show in wiki

**Verify**:
1. Conversation has valid structure
2. `/wiki/decisions` folder exists
3. File was created with proper name

**Debug**:
```bash
# Check if file exists
ls -la wiki/decisions/

# Verify file format
cat wiki/decisions/2026-04-14_*.md | head -20

# Check if indexed
npm run wiki.indexRebuild
npm run wiki.search "decision title"
```

### Q: Backlinks not created automatically

**Solution**:
```bash
# Manual backlink creation
const archiver = new DecisionArchiver(wikiDir, logger);
await archiver.archiveConversation(
  title,
  turns,
  ["Page 1", "Page 2"] // ← Specify related pages
);

# Rebuild index
npm run wiki.indexRebuild
```

### Q: Can't find archived conversations

**Solution**:
```bash
# List all decisions
npm run wiki.list-decisions

# Search in decisions folder
grep -r "your_topic" wiki/decisions/

# Use wiki search
npm run wiki.search "decision topic"
```

---

## Performance

### Q: Extension takes long to activate

**Cause**: Indexing on startup

**Solutions**:
```json
{
  "wiki.rebuildOnStartup": false,
  "wiki.lintOnChange": false
}
```

### Q: High memory usage

**Solutions**:
```bash
# 1. Close other extensions
# 2. Reduce search limit
queryHandler.query("q", { maxResults: 3 });

# 3. Archive old pages to separate wiki
# 4. Monitor: View → Output → Memory

# 5. Restart VS Code
# Cmd+Shift+P → Developer: Reload Window
```

### Q: Disk space growing rapidly

**Check**:
```bash
du -sh wiki/
du -sh raw/

# Find large files
find wiki -size +1M

# Clean up
rm wiki/*.bak
rm raw/*_old.*
```

---

## Development Issues

### Q: TypeScript errors in extension

**Solution**:
```bash
cd extension

# Check types
npm run check-types

# Fix errors
npm run compile

# If issues persist
rm -rf node_modules
npm install
npm run compile
```

### Q: Tests fail randomly

**Solution**:
```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- test/unit/search.test.ts

# Check for race conditions
# Add: jest.useFakeTimers() if needed

# Increase timeout
jest.setTimeout(10000);
```

### Q: "Cannot find module" errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
npm install
```

---

## Integration Issues

### Q: Copilot Chat doesn't recognize @wiki

**Verify**:
1. Chat participant is registered
2. Commands are exported
3. Extension is active

**Debug**:
```typescript
// In extension.ts, verify:
context.subscriptions.push(
  vscode.commands.registerCommand('wiki.search', async (...) => {})
);
```

### Q: Can't use @wiki in specific folders

**Solution**:
```json
// .vscode/settings.json
{
  "wiki.enabledWorkspaces": ["*"],
  "wiki.workspacePath": "${workspaceFolder}"
}
```

---

## File System Issues

### Q: Permission denied when creating pages

**Solution**:
```bash
# Check folder permissions
ls -la wiki/
chmod 755 wiki/

# Verify ownership
chown -R $(whoami) wiki/

# Try write test
touch wiki/test.md && rm wiki/test.md
```

### Q: Files disappear after creation

**Cause**: Disk full or permission issue

**Solutions**:
```bash
# Check disk space
df -h

# Verify folder writable
touch wiki/test && rm wiki/test

# Check for file locking
lsof | grep wiki

# Restart extension
Cmd+Shift+P → Developer: Reload Window
```

---

## Data Safety

### Q: How to backup my wiki?

**Solutions**:
```bash
# 1. Simple copy
cp -r wiki/ wiki_backup_$(date +%Y%m%d)

# 2. Git backup (recommended)
git init
git add wiki/
git commit -m "Wiki backup"

# 3. Cloud sync
cp -r wiki/ ~/iCloud\ Drive/Wiki/
```

### Q: Can I recover deleted pages?

**Solution**:
```bash
# If using Git:
git log --diff-filter=D --summary | grep "delete mode"
git checkout {commit}^ -- wiki/deleted_page.md

# Otherwise:
# Check Trash/Recycle Bin
# Restore from Time Machine (Mac)
```

### Q: Import/Export wiki data

**Export to Markdown**:
```bash
# All files already in markdown
# Copy wiki/ folder to share
cp -r wiki/ ~/Desktop/my_wiki_export

# Export to JSON
# Custom script to convert:
ls wiki/*.md | xargs -I {} sh -c 'echo "{}: $(cat {})"' > export.json
```

---

## User Feedback

### Common Requests

**"Can I sync across devices?"**
- Phase 3+: Cloud sync via iCloud/OneDrive
- Current: Manual copy or Git sync

**"Can I use with other AI tools?"**
- Yes, through API
- Extension is VS Code specific
- API available for integration

**"How large can my wiki grow?"**
- Tested: 500+ pages
- Search: 50-500ms per query
- Lint: <2s deep analysis

---

## Getting Help

### Where to Look

1. **README.md** - Project overview
2. **USER_GUIDE.md** - Feature documentation
3. **API_REFERENCE.md** - Developer docs
4. **SOLUTION.md** - Architecture details
5. **tests/** - Code examples

### Report Issues

1. Check this FAQ first
2. Search GitHub issues
3. Create new issue with:
   - VS Code version
   - OS
   - Extension version
   - Steps to reproduce
   - Error logs

### Get Logs

```bash
# VS Code extension logs
# View → Output → Select "@wiki" or "@karpathy"

# File logs
tail -f ~/.wiki-extension.log

# Python tool logs
python -m tools.ingest.ingest run --debug
```

---

## Advanced Troubleshooting

### Test Infrastructure

```bash
# Run specific test
npm test -- search.test.ts

# Run with coverage
npm test -- --coverage

# Debug test
node --inspect-brk node_modules/jest/bin/jest.js
```

### Performance Profiling

```typescript
// Add timing around slow operations
const start = Date.now();
const results = await search.search("query");
console.log(`Search took ${Date.now() - start}ms`);
```

### Log Analysis

```bash
# Find errors
grep -i "error" ~/.wiki-extension.log

# Follow real-time
tail -f ~/.wiki-extension.log | grep -i "search"

# Count occurrences
grep -c "initialized" ~/.wiki-extension.log
```

---

**Still stuck?** Check the repository issues or ask in Copilot Chat: `@wiki help [your question]`
