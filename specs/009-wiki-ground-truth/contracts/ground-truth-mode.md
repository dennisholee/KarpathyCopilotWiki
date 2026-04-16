# Contract: Ground Truth Mode Setting

## Setting Surface

- **Setting Key**: `wiki.groundTruthMode`
- **Scope**: Workspace configuration
- **Default Value**: `strict`
- **Allowed Values**:
  - `strict`
  - `flexible`
- **Recommended Default**: `strict`

## Behavioral Contract

### `strict`

- `@wiki` answers must use wiki-directory evidence only.
- If wiki evidence is insufficient, the response must return an insufficient-support or coverage-gap result.
- Optional remote synthesis may be used only as a formatter/summarizer over the wiki evidence bundle and must not add unsupported claims.

### `flexible`

- `@wiki` answers must still consider the wiki directory as primary context.
- If wiki evidence is partial, the response may be supplemented beyond the wiki as appropriate.
- Wiki references must still be preserved and shown when wiki evidence contributes to the answer.

## User-Visible Contract

- Each response must make the active mode understandable to the user.
- Switching the setting must affect the next `@wiki` request without restart.
- This setting must not change ingest, indexing, or wiki file generation behavior.