---
title: "Three Bugs Hiding in Plain Sight: A Model Config Refactor Story"
description: "Users reported their custom models were being ignored. The fix required extracting a 200-line package, writing 12 tests, and realizing that auto-default logic was silently overwriting user intent."
pubDate: 2026-05-26
tags: ["go", "refactoring", "joshbot", "configuration", "debugging"]
draft: true
---

# Three Bugs Hiding in Plain Sight

## Or: Why Your Custom Model Was Being Ignored

On May 19th, I merged a fix that touched 13 files and changed 871 lines. The commit message said "fix: model config bugs." The reality was more embarrassing: three bugs, each hiding in plain sight, each causing user-configured models to be silently overwritten with defaults.

Here's what happened, and how extracting a 200-line package made the bugs impossible to hide.

## The Symptom

Users reported that setting a custom model for a provider didn't stick. They'd configure NVIDIA with `nvapi-...` and specify `nvidia/llama-3.1-nemotron-51b`, but when they ran `joshbot agent`, they'd get a different model entirely.

The configuration file looked correct:

```json
{
  "providers": {
    "nvidia": {
      "api_key": "nvapi-...",
      "model": "nvidia/llama-3.1-nemotron-51b",
      "enabled": true
    }
  },
  "provider_defaults": {
    "default": "nvidia"
  },
  "agents": {
    "defaults": {
      "model": "nvidia/llama-3.1-nemotron-51b"
    }
  }
}
```

But after running `joshbot configure` or even just starting the agent, the model would revert to something else. Not a crash, not an error — just silent substitution.

## The Three Bugs

### Bug 1: Auto-Default Overwrite

When the first provider was configured interactively, `setDefaultProvider` was called to set it as the default. The logic looked reasonable:

```go
// Before (main.go:2991)
cfg.ProviderDefaults.Default = configured[choice-1]
cfg.Agents.Defaults.Model = providers.GetDefaultModel(cfg.ProviderDefaults.Default)
```

The problem: `GetDefaultModel` always returned the *registry* default for that provider, not what the user had just typed in. If you configured NVIDIA with a custom model, this line overwrote it with `arcee-ai/trinity-large-preview:free`.

The fix was a two-line guard:

```go
// After
cfg.ProviderDefaults.Default = configured[choice-1]

// Use user-configured per-provider model if available, else registry default
if p, ok := cfg.Providers[cfg.ProviderDefaults.Default]; ok && p.Model != "" {
    cfg.Agents.Defaults.Model = p.Model
} else {
    cfg.Agents.Defaults.Model = providers.GetDefaultModel(cfg.ProviderDefaults.Default)
}
```

### Bug 2: Missing Model on First Provider

The interactive `configureProvider` function had a convenience feature: if you configured your first provider, it automatically set it as the default. But the model assignment was missing:

```go
// Before (main.go:2683-2684)
if c.cfg.ProviderDefaults.Default == "" {
    c.cfg.ProviderDefaults.Default = opts.Name
}
```

No model was set here at all. So even if you passed `--model nvidia/llama-3.1-nemotron-51b`, the first-provider auto-default would set `ProviderDefaults.Default = "nvidia"` but leave `Agents.Defaults.Model` untouched — or worse, let a later call overwrite it.

The fix:

```go
// After
if c.cfg.ProviderDefaults.Default == "" {
    c.cfg.ProviderDefaults.Default = opts.Name
    if p.Model != "" {
        c.cfg.Agents.Defaults.Model = p.Model
    } else {
        c.cfg.Agents.Defaults.Model = providers.GetDefaultModel(opts.Name)
    }
}
```

### Bug 3: NVIDIA Registration Ignored the Model

The NVIDIA provider registration code fetched the provider instance and registered it, but didn't pass the configured model:

```go
// Before (main.go:369-381)
p := cfg.Providers["nvidia"]
if p.Enabled {
    provider := providers.GetProvider("nvidia", p.APIKey, "", nil)
    registry.Register(provider, 1)  // Model not passed
}
```

The `GetProvider` signature accepted a `model` parameter, but it was hardcoded to `""`. The model field existed in the config but was never wired through to the actual provider instance.

The fix:

```go
// After
p := cfg.Providers["nvidia"]
if p.Enabled {
    provider := providers.GetProvider("nvidia", p.APIKey, p.Model, nil)
    registry.Register(provider, 1)
}
```

## The Refactor

Fixing the bugs revealed a deeper problem: the model resolution logic was scattered across three call sites (interactive wizard, CLI flags, and provider registration), each with its own copy of the "use config model else default" check. Any future change would require remembering to update all three.

So I extracted the logic into a new package: `internal/configure`.

### The Configurator API

The new package provides a non-interactive API that both the CLI flags and interactive wizard use:

```go
// internal/configure/configure.go
type Configurator struct {
    cfg *config.Config
}

func New(cfg *config.Config) *Configurator

func (c *Configurator) ConfigureProvider(opts ProviderOptions) error
func (c *Configurator) SetDefault(name string) error
func (c *Configurator) RemoveProvider(name string) error
func (c *Configurator) ListProviders() []ProviderListItem
```

Key invariant: **model resolution happens in exactly one place** — inside `ConfigureProvider` and `SetDefault`. Both methods check for a user-configured model first, falling back to the registry default only if none is set.

```go
// SetDefault now handles model resolution correctly
func (c *Configurator) SetDefault(name string) error {
    p, ok := c.cfg.Providers[name]
    if !ok || !p.Enabled {
        return fmt.Errorf("provider %q is not configured", name)
    }
    c.cfg.ProviderDefaults.Default = name
    
    // Single source of truth for model resolution
    if p.Model != "" {
        c.cfg.Agents.Defaults.Model = p.Model
    } else {
        c.cfg.Agents.Defaults.Model = providers.GetDefaultModel(name)
    }
    return nil
}
```

### New CLI Flags

With the configurator in place, adding non-interactive CLI flags was straightforward:

```bash
# Configure NVIDIA with API key and custom model
joshbot config --provider nvidia --api-key nvapi-... --model nvidia/llama-3.1-nemotron-51b

# Set default provider
joshbot config --set-default nvidia

# List all providers
joshbot config --list

# Remove a provider
joshbot config --remove nvidia
```

The interactive `joshbot configure` wizard now delegates to the same `Configurator` under the hood — no duplicated logic.

## The Tests

The hardest part of writing this post is admitting that none of these bugs would have shipped if I'd written tests first. So I wrote them after, as penance:

```go
// internal/configure/configure_test.go

func TestConfigureProvider_FirstProvider_SetsModel(t *testing.T) {
    // First provider should auto-default, and use the configured model
}

func TestConfigureProvider_SecondProvider_DoesntOverwriteDefault(t *testing.T) {
    // Second provider shouldn't change the default
}

func TestSetDefault_UsesProviderModel_NotRegistryDefault(t *testing.T) {
    // User-configured model takes precedence
}

func TestRemoveProvider_FallsBackToNextEnabled(t *testing.T) {
    // Removing default should pick next enabled provider
}

// ... 12 tests total, all passing
```

The tests cover:
- First vs. second provider auto-default behavior
- Model resolution precedence (config > registry default)
- Provider removal and fallback
- CLI flag parsing and equivalence with the interactive wizard

All 22+ packages now pass `go test -race ./...` with zero failures.

## The Aftermath

Commits merged:
- PR #51: `fix/model-config-abstraction` — bugs fixed, package extracted
- PR #52: `fix/configure-provider-updates-default-model` — follow-up fix for reconfigure flow

Lines changed: 871 additions, 205 deletions. Most of that is the new test suite and documentation updates.

The user-facing impact: if you configure a custom model now, it stays configured. If you set a default provider, it uses *your* model choice, not the registry default. And if you run `joshbot config --list`, you see exactly which model each provider is using.

## Lessons

Three bugs, one afternoon. None of them were clever. All of them were "I forgot to check the model field" mistakes. The refactor wasn't about making the code prettier — it was about making the invariant (user config > defaults) impossible to violate.

If you're writing configuration code, remember:
1. **Auto-defaults are dangerous**. Automatically setting a default on first use is convenient, but make sure you're not losing user intent in the process.
2. **Model resolution belongs in one place**. Don't let it scatter across wizard code, CLI flags, and provider registration.
3. **Write the test first**. I didn't. Twelve tests later, the bugs were obvious in retrospect.

## Verification Checklist

If you're running joshbot v1.20.0 or later:

- [ ] `joshbot config --provider nvidia --api-key ... --model nvidia/something` — verify model sticks
- [ ] `joshbot config --set-default nvidia` — verify `joshbot status` shows correct model
- [ ] `joshbot config --list` — verify configured providers show their actual models
- [ ] `joshbot agent -m "hello"` — verify response uses the configured model (check logs)

## Hero Image Suggestion

A screenshot of `joshbot config --list` output showing three providers with their models, contrasted with a terminal session where the user configures NVIDIA with a custom model and sees it persist across restarts.

```
$ joshbot config --list

PROVIDER       CONFIGURED   DEFAULT   MODEL
nvidia         ✓            ✓         nvidia/llama-3.1-nemotron-51b
openrouter     ✓            -         openrouter/anthropic/claude-sonnet-4
groq           -            -         -
ollama         -            -         -
github-copilot ✓            -         copilot/gpt-4

Use --set-default <provider> to change the active model
```

---

*Filed under: debugging, refactoring, configuration*