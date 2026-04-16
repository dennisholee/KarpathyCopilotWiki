# Quickstart: Wiki Ground Truth Toggle

## Goal

Verify that `@wiki` can switch between strict wiki-only answers and flexible wiki-first answers using a workspace setting.

## Setup

1. Open the extension workspace in VS Code.
2. Ensure the `wiki/` directory contains at least one page with grounded content.
3. Build or run the extension in the normal local development flow.

## Strict Mode Verification

1. Open Settings and set the ground-truth mode setting to `strict`.
2. Ask `@wiki` a question that is answerable from existing wiki content.
3. Confirm the response:
   - announces strict mode,
   - cites wiki evidence,
   - does not rely on outside information.
4. Ask `@wiki` a question that the wiki does not cover.
5. Confirm the response reports insufficient support or a coverage gap instead of inventing an answer.

## Flexible Mode Verification

1. Change the same setting to `flexible`.
2. Ask the same question again.
3. Confirm the response:
   - announces flexible mode,
   - still uses wiki references when available,
   - may provide a fuller answer when wiki coverage is partial.

## Toggle Behavior Verification

1. Switch from `strict` to `flexible` and immediately issue a new `@wiki` request.
2. Switch back from `flexible` to `strict` and immediately issue another request.
3. Confirm the next request after each change reflects the newly selected mode without reloading the workspace.

## Regression Checks

1. Run the extension test suite.
2. Confirm ingest, indexing, and non-answering workflows continue to behave exactly as before.