# KarpathyCopilotWiki Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-16

## Active Technologies
- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `SearchEngine`, `WikiManager`, `QueryHandler`-style evidence assembly patterns, `markdown-it`, `markdown-it-wikilinks`, `@tensorflow-models/universal-sentence-encoder`, `@tensorflow/tfjs`, `pdfjs-dist` (003-add-model-participant)
- Local workspace files under `/wiki`, `/raw`, and `.vscode/wiki-cache` (003-add-model-participant)
- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode`, existing `WikiManager`, `IngestOrchestrator`, `ExtractionService`, `markdown-it`, `markdown-it-wikilinks`, `pdfjs-dist`, existing markdown/frontmatter utilities (004-add-raw-subdirs)
- Local workspace files under `/raw`, `/wiki`, and `.vscode/wiki-cache` (004-add-raw-subdirs)
- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, current modeling helpers in `extension/src/modeling/`, local markdown/wiki corpus, OpenMetadata guideline content already ingested into `/wiki` (005-model-query-support)
- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `SearchEngine`, `QueryHandler`, `markdown-it`, current modeling helpers in `extension/src/modeling/`, local wiki corpus including OpenMetadata guideline conten (007-openmetadata-contract-alignment)
- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, `answerPrompt` helpers, existing extension configuration in `extension/package.json` (009-wiki-ground-truth)
- Workspace files in `wiki/`, extension configuration settings, existing in-memory query/evidence objects (009-wiki-ground-truth)

- TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode`, `pdfjs-dist`, `markdown-it`, `markdown-it-wikilinks`, `@tensorflow-models/universal-sentence-encoder`, `@tensorflow/tfjs`, Jest, esbuild (002-complete-query-answer)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`): Follow standard conventions

## Recent Changes
- 009-wiki-ground-truth: Added TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, `answerPrompt` helpers, existing extension configuration in `extension/package.json`
- 007-openmetadata-contract-alignment: Added TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `SearchEngine`, `QueryHandler`, `markdown-it`, current modeling helpers in `extension/src/modeling/`, local wiki corpus including OpenMetadata guideline conten
- 005-model-query-support: Added TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`) + `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, current modeling helpers in `extension/src/modeling/`, local markdown/wiki corpus, OpenMetadata guideline content already ingested into `/wiki`


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
