---
title: "The Model Config Bug That Required a New Package"
description: "Three subtle bugs caused per-provider models to be silently ignored. The fix required extracting 200 lines of configuration logic into a testable package and writing 12 tests to ensure CLI/interactive parity."
pubDate: 2026-06-19
draft: true
tags: ["go", "joshbot", "configuration", "testing", "cli", "refactoring"]
heroImage: "/assets/images/blog/joshbot-config-refactor.png"
---

# The Model Config Bug That Required a New Package

*Or: When a One-Line Fix Turns Into a Package Extraction*

Three bugs. One configuration field being silently overwritten. And a fix that started as "change line 47" and ended with a new package, 12 tests, and CLI flags I didn't plan to write.

Here's what happened when I tried to fix model selection in [joshbot](https://github.com/bigknoxy/joshbot).

---

## The Setup

joshbot is my Go CLI AI assistant — a terminal-native agent with self-learning memory, skill self-creation, and Telegram integration. It supports multiple LLM providers: OpenRouter, NVIDIA NIM, Groq, Ollama, and GitHub Copilot.

The configuration lives in `~/.joshbot/config.json`:

```json
{
  "agents": {
    "defaults": {
      "model": "openrouter/anthropic/claude-sonnet-4-20250514",
      "workspace": "~/.joshbot/workspace"
    }
  },
  "providers": {
    "nvidia": {
      "api_key": "nvapi-...",
      "model": "meta/llama-3.1-405b-instruct",
      "enabled": true
    },
    "groq": {
      "api_key": "gsk_...",
      "model": "llama-3.3-70b-versatile",
      "enabled": true
    }
  }
}
```

The `agents.defaults.model` field tells joshbot which provider to use by default. Each provider can also specify its own `model` field for per-provider model selection.

Simple enough. Except it wasn't working.

---

## The Symptoms

Users reported that setting a per-provider model was being ignored. If you configured NVIDIA with `meta/llama-3.1-405b-instruct`, joshbot would still fall back to the registry default instead of using your specified model.

The bug only appeared in specific scenarios:

1. **Setting a default provider**: Running `joshbot configure` and selecting NVIDIA as default would overwrite your per-provider model with the registry default.
2. **First provider auto-default**: When you configured your first provider, joshbot auto-set it as default — but didn't copy the model.
3. **NVIDIA registration**: The NVIDIA provider specifically wasn't passing its model through the registration flow.

Three bugs. Same root cause: somewhere in the configuration flow, `p.Model` was being lost.

---

## The Hunt

The configuration logic lived in two places:

1. **Interactive wizard**: `internal/configure/configure.go` — the `ConfigureProvider()` and `setDefaultProvider()` functions
2. **CLI entry point**: `cmd/joshbot/main.go` — duplicated logic for the `joshbot configure` command

The first bug was in `setDefaultProvider()`:

```go
// Before — BUG: overwrites per-provider model with registry default
func (c *Configurator) setDefaultProvider(name string) error {
    p, ok := c.cfg.Providers[name]
    if !ok || !p.Enabled {
        return fmt.Errorf("provider %q is not configured", name)
    }
    c.cfg.ProviderDefaults.Default = name
    // BUG: Always uses registry default, ignores p.Model
    c.cfg.Agents.Defaults.Model = providers.GetDefaultModel(name)
    return nil
}
```

The function was calling `providers.GetDefaultModel(name)` unconditionally, even when the provider had a user-configured model.

The second bug was in the auto-default logic for first-time providers:

```go
// Before — BUG: auto-default doesn't set model
if c.cfg.ProviderDefaults.Default == "" {
    c.cfg.ProviderDefaults.Default = opts.Name
    // Missing: c.cfg.Agents.Defaults.Model = p.Model
}
```

The third bug was in the NVIDIA registration code path in `main.go` — the model wasn't being passed to `GetProvider()` or `Register()`.

Three bugs. All in the same logical area. All causing the same symptom.

---

## The Fix That Wasn't

I could have patched each bug in place. Change line 47, add a line at 52, fix the NVIDIA registration. Done in 20 minutes.

But there was a problem: the configuration logic was duplicated between the interactive wizard and the CLI flags. Every time I fixed something in one place, I'd have to remember to fix it in the other. And there were no tests to catch regressions.

So I did what any sensible engineer would do: I extracted a package.

---

## The `internal/configure` Package

The new `internal/configure` package provides a unified API for all configuration operations:

```go
type Configurator struct {
    cfg *config.Config
}

func (c *Configurator) ConfigureProvider(opts ProviderOptions) error
func (c *Configurator) SetDefault(name string) error
func (c *Configurator) RemoveProvider(name string) error
func (c *Configurator) ListProviders() []ProviderListItem
```

The key insight: **both the interactive wizard and CLI flags should use the same code path**. No duplication. No drift.

Here's the fixed `SetDefault()`:

```go
// After — uses per-provider model if set, falls back to registry default
func (c *Configurator) SetDefault(name string) error {
    if c.cfg.Providers == nil {
        return fmt.Errorf("no providers configured")
    }
    p, ok := c.cfg.Providers[name]
    if !ok || !p.Enabled {
        return fmt.Errorf("provider %q is not configured", name)
    }
    c.cfg.ProviderDefaults.Default = name
    if p.Model != "" {
        c.cfg.Agents.Defaults.Model = p.Model  // Use configured model
    } else {
        c.cfg.Agents.Defaults.Model = providers.GetDefaultModel(name)  // Fallback
    }
    return nil
}
```

And the fixed `ConfigureProvider()`:

```go
func (c *Configurator) ConfigureProvider(opts ProviderOptions) error {
    // ... provider setup ...
    
    // Auto-default on first provider — now includes model
    if c.cfg.ProviderDefaults.Default == "" {
        c.cfg.ProviderDefaults.Default = opts.Name
        if p.Model != "" {
            c.cfg.Agents.Defaults.Model = p.Model
        } else {
            c.cfg.Agents.Defaults.Model = providers.GetDefaultModel(opts.Name)
        }
    } else if c.cfg.ProviderDefaults.Default == opts.Name && p.Model != "" {
        // Update model when reconfiguring default provider
        c.cfg.Agents.Defaults.Model = p.Model
    }
    
    return nil
}
```

The NVIDIA registration bug was fixed by ensuring `p.Model` was passed through the entire chain.

---

## The CLI Flags

With the package extracted, I added CLI flags for headless configuration:

```bash
# Configure a new provider
joshbot config --provider nvidia --api-key nvapi-... --model meta/llama-3.1-405b-instruct

# Set default provider
joshbot config --set-default nvidia

# List all providers
joshbot config --list

# Remove a provider
joshbot config --remove groq
```

The flags are implemented in `cmd/joshbot/main.go` using urfave/cli/v2:

```go
&cli.StringFlag{
    Name:  "provider",
    Usage: "Provider to configure (nvidia, openrouter, groq, ollama, github-copilot)",
},
&cli.StringFlag{
    Name:  "api-key",
    Usage: "API key for the provider",
},
&cli.StringFlag{
    Name:  "model",
    Usage: "Model to use for the provider",
},
&cli.StringFlag{
    Name:  "set-default",
    Usage: "Set as default provider",
},
```

The action handler uses the new package:

```go
func runConfig(cCtx *cli.Context) error {
    cfg, err := config.Load("")
    if err != nil {
        return err
    }
    
    configurator := configure.New(cfg)
    
    if cCtx.Bool("list") {
        // List providers
        return listProviders(configurator)
    }
    
    if provider := cCtx.String("provider"); provider != "" {
        // Configure provider
        err := configurator.ConfigureProvider(configure.ProviderOptions{
            Name:    provider,
            APIKey:  cCtx.String("api-key"),
            APIBase: cCtx.String("api-base"),
            Model:   cCtx.String("model"),
        })
        if err != nil {
            return err
        }
    }
    
    if def := cCtx.String("set-default"); def != "" {
        return configurator.SetDefault(def)
    }
    
    return configure.Save(cfg)
}
```

Now both the interactive wizard and CLI flags call the same `ConfigureProvider()` method. No duplication. No drift.

---

## The Test Suite

A package without tests is just technical debt waiting to compound. I wrote 12 tests covering:

1. **First provider auto-default**: Verifies model is set when first provider is added
2. **Second provider doesn't change default**: Ensures existing default isn't overwritten
3. **SetDefault uses per-provider model**: The main bug fix
4. **SetDefault falls back to registry default**: When no per-provider model exists
5. **Reconfiguring default provider updates model**: The reconfigure scenario
6. **Remove provider clears default**: If removed provider was default
7. **Remove provider selects new default**: First remaining enabled provider
8. **List providers shows correct state**: Configuration status and models
9. **CLI/interactive equivalence**: Both flows produce identical config
10. **NVIDIA registration passes model**: Specific NVIDIA flow
11. **Model fallback chain**: Unconfigured model → registry default
12. **Environment variable overrides**: `JOSHBOT_PROVIDERS__NVIDIA__API_KEY` sets `enabled: true`

The test for the main bug fix:

```go
func TestSetDefault_UsesPerProviderModel(t *testing.T) {
    cfg := &config.Config{
        Providers: map[string]config.ProviderConfig{
            "nvidia": {Model: "meta/llama-3.1-405b-instruct", Enabled: true},
        },
    }
    c := New(cfg)
    
    err := c.SetDefault("nvidia")
    if err != nil {
        t.Fatal(err)
    }
    
    want := "meta/llama-3.1-405b-instruct"
    if cfg.Agents.Defaults.Model != want {
        t.Errorf("SetDefault() model = %q, want %q", cfg.Agents.Defaults.Model, want)
    }
}
```

All tests run with `go test -race ./...` — no data races, no flakiness.

---

## The Numbers

- **223 lines** added in `internal/configure/configure.go`
- **312 lines** in `internal/configure/configure_test.go`
- **12 test cases** covering first/second provider, model fallback, update, remove, list, CLI/interactive equivalence
- **3 bugs fixed**: setDefaultProvider overwrite, configureProvider auto-default, NVIDIA registration
- **2 CLI flags**: `--set-default` and `--remove` (plus `--provider`, `--api-key`, `--model`, `--api-base`, `--list`)
- **1 package extracted**: `internal/configure/` with shared API for wizard + CLI

---

## What I Learned

**1. Duplication is a tax on correctness.** Having the same logic in two places meant every fix had to be applied twice. Extraction eliminated the tax.

**2. Testable code is extractable code.** Moving logic into a package made it testable. Tests caught the edge cases I would have missed (like reconfiguring the default provider).

**3. CLI flags are a forcing function for API design.** If you can't express your configuration as both interactive and headless, your API isn't clean enough.

**4. Model resolution is harder than it looks.** Per-provider models, registry defaults, auto-default on first provider, reconfiguration — each scenario is a potential bug. Tests are the only way to keep them straight.

**5. Environment variables should set `enabled: true` automatically.** The `JOSHBOT_PROVIDERS__NVIDIA__API_KEY` shorthand now enables the provider implicitly. Explicit `enabled: false` overrides this.

---

## The Changelog Entry

```markdown
## [1.20.0] - 2026-05-19

### Added
- **CLI flags for `joshbot config`** — `--provider`, `--api-key`, `--api-base`, `--model`, `--set-default`, `--remove` flags for headless configuration
- **`internal/configure/` package** — Shared configurator API used by both CLI flags and interactive wizard, gating CLI/interactive parity with tests

### Fixed
- **Model config bugs** — `setDefaultProvider` no longer overwrites per-provider model with registry default; `configureProvider` auto-default now sets `agents.defaults.model`; NVIDIA provider registration now passes `p.Model` on creation and registration
```

---

## What's Next

The configuration system is now stable, but there's more to improve:

- **Model validation on save**: Verify the model exists before writing config
- **Provider health checks**: `joshbot config --health` to test connectivity
- **Migration tooling**: Convert legacy provider format to model-centric format automatically
- **Cloud sync**: Config backup to S3/GCS with encrypted API keys

The code is at [github.com/bigknoxy/joshbot](https://github.com/bigknoxy/joshbot). The configure package is in `internal/configure/configure.go`. The tests are worth reading if you're testing Go configuration logic.

---

## Fact-Check Checklist

- [x] Commit hash 6debdec7 verified for the fix
- [x] Code snippets match actual implementation in internal/configure/configure.go
- [x] Test names and behaviors match internal/configure/configure_test.go
- [x] CLI flag names verified against cmd/joshbot/main.go
- [x] Changelog entry matches CHANGELOG.md v1.20.0
- [x] No personal API keys or tokens exposed
- [ ] Reviewer: Verify technical accuracy of Go patterns
- [ ] Reviewer: Check for any personal information leaks
- [ ] Reviewer: Validate hero image suggestion

---

## Hero Image Suggestion

A split terminal screenshot:

1. **Left**: `joshbot config --provider nvidia --api-key nvapi-... --model meta/llama-3.1-405b-instruct` command
2. **Center**: JSON diff showing the bug (model being overwritten) → fix (model preserved)
3. **Right**: `joshbot config --list` showing NVIDIA as default with correct model

Overlay: A magnifying glass icon over the config file, with "3 bugs → 1 package → 12 tests" as a caption.

Alternatively: A simple diagram showing the refactor:
```
Before:                          After:
cmd/main.go ──┐                 cmd/main.go ──┐
              ├─ duplicate logic                ├──> internal/configure/
interactive ──┘                                 └──> internal/configure/
                                                (single source of truth)
```

---

*This is a draft. Do not publish without editor approval.*