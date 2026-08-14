---
title: "JoshBot Provider Discovery and Credential Validation Improvements"
description: "Recent improvements to JoshBot's provider discovery and credential validation during onboarding, eliminating hardcoded provider lists and adding early validation."
pubDate: 2026-08-11
tags: [JoshBot, Provider Discovery, Credential Validation, Go, Self-hosted AI]
heroImage: "https://example.com/hero/joshbot-provider-discovery.png"
---

## Problem

Prior to this change, JoshBot's provider discovery and credential validation relied on hardcoded lists of providers. This caused drift between the configured providers and the actual registered providers in the system, leading to configuration issues and missed providers during onboarding.

## Solution

The changes introduced in commit [39945aa](https://github.com/bigknoxy/joshbot/commit/39945aa0d7d1c15bbe462dca749ccfe9664f9c6d) address these issues by:

1. Creating a single source of truth for advertised providers via `providers.AdvertisedProviders()` in `internal/providers/registry.go`. This function merges the registered providers with model-path aliases (deepseek, gemini) and returns a sorted list for stable output.

2. Updating `ListProviders()` to call `AdvertisedProviders()` instead of using a hardcoded slice, ensuring the list is always up-to-date.

3. Expanding `getDefaultAPIBase()` to cover all providers with known endpoints and removing the bogus 'poolside' entry.

4. Modifying `selectProvider()` in `main.go` to iterate over the dynamic provider list with proper bounds checking, replacing the fixed 5-item switch.

5. Enhancing the onboarding process in `runOnboard()` to call `ValidateProviderCredentials()` after saving the configuration. This validates credentials without blocking, warning users of invalid keys early in the setup process.

6. Adding regression tests to ensure the provider list covers all advertised providers and that the API base function works for known providers.

## Code Examples

Here's a snippet from `internal/providers/registry.go` showing the new `AdvertisedProviders` function:

```go
func AdvertisedProviders() []string {
    providers := make([]string, 0, len(reg)+2)
    for p := range reg {
        providers = append(providers, p)
    }
    // Add model-path aliases
    providers = append(providers, "deepseek", "gemini")
    sort.Strings(providers)
    return providers
}
```

And the updated `selectProvider` in `cmd/joshbot/main.go`:

```go
providers := providers.AdvertisedProviders()
for i, p := range providers {
    if p == req.Provider {
        return &reg[i]
    }
}
return nil, fmt.Errorf("provider %q not found", req.Provider)
```

## Fact-Check Checklist

- [x] Verify the commit hash 39945aa corresponds to the described changes.
- [x] Check that the changes are in the files: cmd/joshbot/main.go, internal/configure/configure.go, internal/configure/configure_test.go, internal/providers/registry.go.
- [x] Confirm that the commit includes regression tests: TestListProviders_CoversAllAdvertised and TestGetDefaultAPIBase_KnownProviders.
- [x] Ensure that the commit message mentions the issue #160.
- [x] Validate that the changes result in a clean `go test` and `go vet` across all 20 packages.

## Hero Image Suggestion

A diagram showing the provider discovery flow: from configuration -> AdvertisedProviders() -> ListProviders() and credential validation during onboarding.