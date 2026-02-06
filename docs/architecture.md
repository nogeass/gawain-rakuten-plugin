# Architecture

## Overview

gawain-rakuten-plugin is a reference implementation for integrating Rakuten (Japanese e-commerce) with the Gawain video generation API.

```
+-------------------------------------------------------------+
|                     Demo CLI / App                          |
+-------------------------------------------------------------+
|                                                             |
|  +--------------+    +--------------+    +--------------+   |
|  |   Platform   |    |    Gawain    |    |   Install    |   |
|  |   Adapter    |    |    Client    |    |   ID Mgmt    |   |
|  |  (Rakuten)   |    |              |    |              |   |
|  +--------------+    +--------------+    +--------------+   |
|         |                   |                   |           |
|         +-------------------+-------------------+           |
|                             |                               |
|  +------------------------------------------------------+   |
|  |                    Utilities                          |   |
|  |            (env, retry, logging)                      |   |
|  +------------------------------------------------------+   |
|                                                             |
+-------------------------------------------------------------+
                              |
                              v
                    +-----------------+
                    |   Gawain API    |
                    |   (External)    |
                    +-----------------+
```

## Module Structure

### `/src/gawain/`
Gawain API client layer. This is intentionally thin to allow future changes.

- `client.ts` - HTTP client with retry logic
- `types.ts` - TypeScript type definitions for API

### `/src/platform/`
Platform-specific adapters. Currently only Rakuten.

- `rakuten_adapter.ts` - Converts Rakuten product format to Gawain format

Future: Add adapters for other platforms without changing core logic.

### `/src/install/`
Anonymous installation ID management.

- `install_id.ts` - Generate, persist, and retrieve install_id

### `/src/util/`
Shared utilities.

- `env.ts` - Environment variable loading and validation
- `retry.ts` - Exponential backoff retry logic

## Design Decisions

### 1. Platform Adapter Pattern

Rakuten-specific logic is isolated in `platform/rakuten_adapter.ts`. This allows:
- Adding new platforms (Amazon, Shopify, etc.) without changing core logic
- Testing platform conversion separately
- Keeping the Gawain client platform-agnostic

### 2. Rakuten Product Format

Rakuten uses a different product format than Shopify:
- `itemCode` instead of `id`
- `itemName` instead of `title`
- `itemCaption` instead of `body_html`
- `mediumImageUrls` array instead of `images` with `src`
- `itemPrice` with `taxFlag` for tax handling

### 3. Thin Gawain Client

The Gawain client is a minimal wrapper around HTTP calls. It:
- Handles authentication
- Implements retry with exponential backoff
- Provides TypeScript types

Future: If Gawain provides an official SDK, this layer can be replaced.

### 4. Anonymous Install ID

Users can generate video previews without login using a locally-stored UUID.
- Stored in `.local/install_id`
- Passed to Gawain API with every request
- Can be linked to a Kinosuke account later for commercial usage

### 5. No Rakuten OAuth (Phase 1)

Current implementation is a CLI demo. Rakuten API integration is Phase 2.
- Easier to test and validate the core flow
- Focus on API integration first
- OAuth adds complexity (app registration, token management, etc.)

## Data Flow

```
1. Load product JSON
       |
       v
2. Validate & convert (Rakuten -> Gawain format)
       |
       v
3. Get/create install_id
       |
       v
4. Create job (POST /v1/jobs)
       |
       v
5. Poll for completion (GET /v1/jobs/:id)
       |
       v
6. Return preview URL + upgrade URL
```

## Error Handling

- **Retryable errors** (429, 5xx): Exponential backoff with jitter, max 5 attempts
- **Non-retryable errors** (4xx): Fail immediately
- **Timeout**: Configurable per-request timeout (default 30s)
- **Polling timeout**: Configurable max attempts (default 60 x 2s = 2 min)

## Security Considerations

- API keys loaded from environment variables only
- Secrets never logged (masked in logs)
- `.env` excluded from git
- HTTPS required for API communication
