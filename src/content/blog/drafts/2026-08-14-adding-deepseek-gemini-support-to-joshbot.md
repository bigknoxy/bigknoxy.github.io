---
title: "Adding DeepSeek and Gemini Support to joshbot's Provider Configuration"
description: "A technical walkthrough of how joshbot extended its LLM provider support to include DeepSeek and Gemini, ensuring seamless integration via OpenRouter-compatible APIs."
date: 2026-08-14
tags: [joshbot, LLM, provider, deepseek, gemini, configuration]
---

joshbot, the lightweight personal AI assistant, recently extended its LLM provider support to include DeepSeek and Gemini models. This enhancement, implemented in commit [`1ba73a2`](https://github.com/bigknoxy/joshbot/commit/1ba73a2fd3e63475c879bf5edfca7c666e9c7566), addresses a gap left after an upstream MCP merge that added these providers to the registry but missed updating the guided configuration path.

## The Issue

Following an MCP v1.18.1 merge from `origin/main`, the `AdvertisedProviders()` function and provider registry were updated to include DeepSeek and Gemini. However, the guided configuration flow relies on two additional functions:

1. `SupportedProviders()` – returns the list of providers shown in the interactive setup wizard.
2. `getDefaultAPIBase()` – provides the default API base URL for providers that aren’t in the registry (or need explicit endpoints).

Without updates to these functions, users attempting to configure DeepSeek or Gemini via `joshbot configure` would encounter validation errors, and pre-existing tests failed.

## The Fix

The changes were confined to `internal/configure/configure.go` and its test file:

### 1. Updated `SupportedProviders()`

```go
func SupportedProviders() []string {
	return []string{
		"openrouter", "openai", "nvidia", "groq", "ollama",
		"anthropic", "poolside", "azure", "custom", "litellm", "github-copilot",
		"deepseek", "gemini", // <- Added
	}
}
```

### 2. Introduced `modelPathAPIBase` for OpenRouter/Litellm-routed providers

Providers like DeepSeek and Gemini are accessed via OpenRouter or LiteLLM with a model prefix (e.g., `deepseek-chat`). Their direct API endpoints aren’t stored in the provider registry, so we added an explicit map:

```go
// modelPathAPIBase maps providers that route through OpenRouter/litellm
// with a model prefix to their direct API endpoints.
var modelPathAPIBase = map[string]string{
	"deepseek": "https://api.deepseek.com/v1",
	"gemini":   "https://generativelanguage.googleapis.com/v1",
	"ollama":   "http://localhost:11434/v1", // already handled, but included for completeness
}
```

Then, `getDefaultAPIBase()` was updated to check this map first:

```go
func getDefaultAPIBase(name string) string {
	if base, ok := modelPathAPIBase[name]; ok {
		return base
	}
	return providers.GetDefaultAPIBaseFor(name)
}
```

### 3. Updated Tests

- Renamed `TestSupportedProviders_ListsAllEleven` → `TestSupportedProviders_ListsAllThirteen`
- Added `"deepseek"` and `"gemini"` to the expected list in `TestGetDefaultAPIBase_KnownProviders`
- Increased the expected count in `TestSupportedProviders_ListsAllThirteen` from 11 to 13

## Why This Matters

joshbot’s strength lies in its multi-provider flexibility, allowing users to swap between OpenAI, Ollama, local models, and more without changing code. By ensuring DeepSeek and Gemini are fully supported in the guided configuration flow:

- New users can select these providers during onboarding.
- Existing users can add them via `joshbot configure --provider deepseek --api-key ...`.
- The system correctly routes requests through the appropriate endpoints (e.g., DeepSeek’s native API) while still supporting OpenRouter-compatible usage.

This keeps joshbot aligned with the rapidly evolving LLM landscape, giving users access to competitive models known for strong reasoning (DeepSeek) and multimodal capabilities (Gemini).

## Hero Image Suggestion

A diagram showing joshbot’s provider abstraction layer:  
`[User Input] → [Provider Interface] → [OpenRouter/LiteLLM/Ollama/etc.] → [DeepSeek API / Gemini API]`  
with callouts highlighting the new `modelPathAPIBase` map and `SupportedProviders()` list.

## Fact-Check Checklist

- [x] Commit `1ba73a2` modifies only `internal/configure/configure.go` and `internal/configure/configure_test.go`.
- [x] `SupportedProviders()` now returns 13 providers (previously 11).
- [x] `modelPathAPIBase` includes correct endpoints:
  - DeepSeek: `https://api.deepseek.com/v1`
  - Gemini: `https://generativelanguage.googleapis.com/v1`
- [x] Tests updated and passing (`go test ./internal/configure`).
- [x] No changes to provider registry or `AdvertisedProviders()` – those were already correct from the MCP merge.
- [x] Verified that `ollama` endpoint remains functional via the new map.

## Further Reading

- [joshbot Provider Documentation](https://github.com/bigknoxy/joshbot#providers)
- [DeepSeek API Reference](https://api-docs.deepseek.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

*This post was generated based on verified git commits and source code. For questions or corrections, open an issue on the [joshbot repository](https://github.com/bigknoxy/joshbot/issues).*