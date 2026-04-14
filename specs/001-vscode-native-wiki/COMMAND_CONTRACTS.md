---
description: "Extension command specifications and examples"
---

# Extension Command Contracts

**Status**: Phase 1 Design  
**Date**: April 14, 2026  

---

## Command Registry

All extension commands are namespaced under `wiki.*` to prevent conflicts.

### Core Commands

#### 1. `wiki.search` — Full-Text Search

**Registration**:
```typescript
vscode.commands.registerCommand('wiki.search', async (query?: string) => {
  // If no query provided, show input dialog
  const q = query || await vscode.window.showInputBox({
    placeHolder: 'Search wiki...',
    prompt: 'Enter search term'
  });
  
  if (!q) return;
  
  // Query index and display results
  const results = await indexService.search(q);
  // Show results panel
});
```

**Invocation Points**:
- Command palette: `Ctrl+Shift+P` → `Wiki: Search`
- Copilot Chat: `@wiki /search machine learning` or `@wiki search for...`

**Parameters**:
- `query` (optional): Search term

**Output**:
- Displays search results in sidebar/webview
- Allows user to click result to open in editor

---

#### 2. `wiki.openRaw` — Open Raw Document Editor

**Registration**:
```typescript
vscode.commands.registerCommand('wiki.openRaw', async () => {
  // Open file picker for /raw folder
  const files = await vscode.window.showOpenDialog({
    defaultUri: vscode.Uri.file(rawDir),
    canSelectMany: false,
    filters: {
      'PDF and Markdown': ['pdf', 'md'],
      'All': ['*']
    }
  });
  
  if (files && files.length > 0) {
    // Open file in editor
    await vscode.window.showTextDocument(files[0]);
  }
});
```

**Invocation Points**:
- Command palette: `Ctrl+Shift+P` → `Wiki: Open Raw`
- Extension icon in activity bar

**Output**:
- Opens file in editor for viewing/editing

---

#### 3. `wiki.rebuildIndex` — Rebuild Index

**Registration**:
```typescript
vscode.commands.registerCommand('wiki.rebuildIndex', async () => {
  vscode.window.showInformationMessage('Rebuilding wiki index...');
  
  try {
    await indexService.rebuildIndex();
    vscode.window.showInformationMessage('✓ Wiki index rebuilt successfully');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to rebuild index: ${error}`);
  }
});
```

**Invocation Points**:
- Command palette: `Ctrl+Shift+P` → `Wiki: Rebuild Index`
- Copilot Chat: `@wiki /rebuild`

**Output**:
- Displays status messages and progress
- Updates index in background

---

#### 4. `wiki.copilotChat` — Copilot Chat Participant Hook

**Registration** (declarative in package.json):
```json
{
  "contributes": {
    "chatParticipants": [
      {
        "id": "karpathy-wiki.wiki",
        "name": "wiki",
        "fullName": "Wiki",
        "description": "Search and navigate your personal wiki",
        "isSticky": false,
        "commands": [
          {
            "name": "search",
            "description": "Full-text search across wiki pages"
          },
          {
            "name": "rebuild",
            "description": "Rebuild wiki index from /raw documents"
          }
        ]
      }
    ]
  }
}
```

**Handler** (imperative):
```typescript
export async function handleCopilotQuery(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  // Route based on command
  if (request.command === 'search') {
    return await handleSearch(request.prompt, stream, token);
  } else if (request.command === 'rebuild') {
    return await handleRebuild(stream, token);
  } else {
    // Free-form query: perform semantic search
    return await handleFreeForm(request.prompt, stream, token);
  }
}
```

**Invocation Pattern**:
- `@wiki search for decision trees`
- `@wiki /search machine learning`
- `@wiki /rebuild`
- `@wiki How do I implement embeddings?` (free-form)

**Output**:
- Markdown response in Copilot Chat
- Links to wiki pages as references
- Formatted code blocks if relevant

---

### Optional Commands (Phase 3)

#### 5. `wiki.openSettings` — Open Extension Settings

```typescript
vscode.commands.registerCommand('wiki.openSettings', async () => {
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    '@ext:karpathy-wiki.wiki'
  );
});
```

#### 6. `wiki.exportMarkdown` — Export Wiki as Markdown

```typescript
vscode.commands.registerCommand('wiki.exportMarkdown', async (pageId?: string) => {
  // Export single page or entire wiki
  // Prompt for output location
  // Generate markdown files with backlink references
});
```

---

## Package.json Configuration

```json
{
  "activationEvents": [
    "workspaceContains:**/wiki/**",
    "onCommand:wiki.search",
    "onCommand:wiki.rebuildIndex",
    "onCommand:wiki.openRaw",
    "onChatParticipant:karpathy-wiki.wiki",
    "onStartupFinished"
  ],
  "contributes": {
    "commands": [
      {
        "command": "wiki.search",
        "title": "Search Wiki",
        "category": "Wiki"
      },
      {
        "command": "wiki.rebuildIndex",
        "title": "Rebuild Index",
        "category": "Wiki"
      },
      {
        "command": "wiki.openRaw",
        "title": "Open Raw Document",
        "category": "Wiki"
      },
      {
        "command": "wiki.openSettings",
        "title": "Extension Settings",
        "category": "Wiki"
      }
    ],
    "chatParticipants": [
      {
        "id": "karpathy-wiki.wiki",
        "name": "wiki",
        "fullName": "Wiki",
        "description": "Search and navigate your personal wiki",
        "isSticky": false,
        "commands": [
          {
            "name": "search",
            "description": "Full-text search across wiki pages"
          },
          {
            "name": "rebuild",
            "description": "Rebuild wiki index"
          }
        ]
      }
    ]
  }
}
```

---

## Error Handling Contract

All commands must follow this error pattern:

```typescript
try {
  // Command logic
} catch (error) {
  if (error instanceof CancellationError) {
    // User cancelled - silent exit
    return;
  }
  
  // Log for debugging
  console.error(`Command 'wiki.xxx' failed:`, error);
  
  // Show user-friendly error
  vscode.window.showErrorMessage(
    `Wiki: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}
```

---

## Success Criteria (Phase 1)

- [x] All 4 core commands defined with TypeScript types
- [x] package.json configuration complete
- [x] Error handling patterns documented
- [x] Copilot Chat participant registration configured
- [ ] Implementation begins in Phase 2A (Scaffold)

