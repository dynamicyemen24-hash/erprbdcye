# UAMEX ERP™ AI Model Switching - Implementation Summary

## Overview
Extended the UAMEX ERP™ system to support multi-provider AI model selection, including OpenAI-compatible keys (sk- prefix format).

## Changes by File

### 1. `src/server/config/env.ts`
Added AI model selection configuration:
- `AI_MODEL` - Selected model (default: gemini-2.5-flash)
- `AI_API_KEY` - Generic API key (Gemini, Anthropic, or OpenAI-compatible)
- `AI_PROVIDER` - Provider: google | anthropic | openai | local (default: google)
- `AI_FALLBACK_MODEL` / `AI_FALLBACK_PROVIDER` - Fallback configuration
- `AI_MODEL_TIER` - Tier override: uamex-fast | uamex-deep | uamex-audit

### 2. `src/server/ai/router.ts`
- Added `detectProviderFromKey()` method to identify provider from key prefix
- Updated `callModel()` to support provider switching
- Added `callOpenAI()` - routes sk- keys through Anthropic endpoint
- Updated `callGemini()` and `generateEmbedding()` to use `AI_API_KEY` fallback

### 3. `src/server/routes/v2/system.routes.ts`
New admin-protected routes:
- `GET /api/v2/ai/model` - View current AI model configuration
- `POST /api/v2/ai/model` - Update AI model settings
- `GET /api/v2/ai/models` - List all supported models with metadata

### 4. `src/server/routes/v2/gemini.routes.ts`
Updated `/copilot` endpoint to:
- Accept `model` parameter from request body
- Use `AI_PROVIDER` env var to determine routing
- Support Gemini, Anthropic (for sk- keys), and local models
- Return model and provider in response

### 5. `src/server/routes/v2/index.ts`
Mounted system routes at `/api/v2/ai`:
```typescript
router.use('/ai', authenticateToken, systemRoutes);
```

## Using the Provided OpenAI Key

Set in your environment:
```env
# Required
AI_API_KEY=[REDACTED — key removed 2026-09-10 after accidental commit; rotate immediately, see release notes]
AI_PROVIDER=openai  # or anthropic (both map to Anthropic endpoint)

# Optional - overrides
AI_ENABLED=true
AI_MODEL=gemini-2.5-flash  # or any supported model

# Optional - fallback
AI_FALLBACK_MODEL=gemini-2.5-flash
AI_FALLBACK_PROVIDER=google
```

## Supported Models (8 total)

### Google Gemini
- `gemini-3-pro` - Expert, 2M token context
- `gemini-2.5-flash` - Medium, 1M token context (default)

### Anthropic Claude
- `claude-4.5-sonnet` - Expert
- `claude-4.5-haiku` - Medium, fast

### Local LLMs
- `llama-4-70b-local` - High complexity
- `llama-4-8b-local` - Low complexity

### Embeddings
- `embedding-gemini` - Google embeddings
- `embedding-bge-large` - Local embeddings

## API Usage Examples

### View Current Configuration
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v2/ai/model
```

### Update Model at Runtime
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"selectedModel": "gemini-3-pro", "modelProvider": "google"}' \
  http://localhost:3000/api/v2/ai/model
```

### Test Copilot with Specific Model
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze our financial performance", "model": "gemini-2.5-pro", "language": "en"}' \
  http://localhost:3000/api/v2/gemini/copilot
```

## Key Features

| Feature | Status |
|---------|--------|
| OpenAI key (`sk-` prefix) support | ✅ Auto-detected, routed via Anthropic |
| Per-request model selection | ✅ Via `/copilot` model parameter |
| Runtime model/tier switching | ✅ Via `/api/v2/ai/model` API |
| 3-tier SROI system | ✅ uamex-fast/deep/audit still supported |
| All 15 NEB domains | ✅ All AI routes respect new model selection |
| Backward compatibility | ✅ Existing Gemini setup works unchanged |

## Migration Path

Existing deployments continue working unchanged:
- Set `GEMINI_API_KEY` and `AI_ENABLED=true` for Gemini-only mode
- Or add `AI_API_KEY` + `AI_PROVIDER` for multi-provider mode
- The `AI_MODEL_TIER` field maps to existing uamex-fast/deep/audit tiers

## Security Notes

- All admin routes require `ADMIN` or `SUPER_ADMIN` role
- API keys are not returned in responses (security)
- Key prefix detection prevents misconfiguration
- Fallback chain: config > env var > key detection > default