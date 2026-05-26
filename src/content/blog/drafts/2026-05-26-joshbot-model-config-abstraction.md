---
title: "The Model Configuration Bug That Took Three Commits to Fix"
description: "How a simple oversight in provider configuration led to a deeper abstraction, a new CLI API, and a better understanding of configuration state management in Go."
pubDate: 2026-05-26
draft: true
tags: ["go", "joshbot", "configuration", "cli", "ai", "debugging"]
heroImage: "/assets/images/blog/joshbot-config-abstraction.png"
---

# The Model Configuration Bug That Took Three Commits to Fix

*Or: When You Fix One Bug and Discover Two More Hiding Behind It*

Last week I merged a fix into [joshbot](https://github.com/bigknoxy/joshbot) that should have been straightforward: when reconfiguring the default provider, make sure `agents.defaults.model` gets updated to match. One line of code, basically. Instead, it became a three-commit journey through configuration abstraction, CLI ergonomics, and the importance of testing edge cases.

Here's what happened.

---

## The Setup

joshbot is a Go CLI AI assistant (~16,000 LOC non-test) with a multi-provider LLM backend. You can configure providers like OpenRouter, NVIDIA NIM, Groq, Ollama, and GitHub Copilot. Each provider has:

- An API key (or OAuth token for Copilot)
- An API base URL
- A default model
- An `enabled` flag

The configuration lives in `~/.joshbot/config.json`:

```json
{
  "providers": {
    "nvidia": {
      "api_key": "nvapi-xxx",
      "api_base": "https://integrate.api.nvidia.com/v1",
      "model": "meta/llama-4-405b",
      "enabled": true
    },
    "openrouter": {
      "api_key": "sk-or-xxx",
      "enabled": true
    }
  },
  "provider_defaults": {
    "default": "nvidia"
  },
  "agents": {
    "defaults": {
      "model": "meta/llama-4-405b"
    }
  }
}
```

The `agents.defaults.model` field is what the agent loop actually uses. The `providers.nvidia.model` field is metadata — it tells joshbot what model to use *when that provider is selected*. The two should stay in sync when you reconfigure the default provider.

They weren't.

---

## PR #51: The Abstraction

The original bug report was simple: when you run `joshbot configure` and reconfigure the default provider, the `agents.defaults.model` doesn't update to match the new provider's model.

But fixing it exposed a deeper problem: the configuration logic was duplicated across multiple call sites. The CLI's interactive wizard, the CLI flags, and the internal provider registration code all had their own copies of "if this is the first provider, set it as default." Three copies, three different code paths, three places to introduce bugs.

So PR #51 started as a fix and became a refactor:

1. Extract configuration logic into a new `internal/configure` package
2. Create a `Configurator` type with methods like `ConfigureProvider`, `SetDefault`, `RemoveProvider`
3. Make both the CLI wizard and CLI flags use the same package
4. Add 12 tests covering first provider, second provider, model fallback, updates, and removal

The fix for the original bug was two lines in `internal/configure/configure.go`:

```go
} else if c.cfg.ProviderDefaults.Default == opts.Name && p.Model != "" {
    c.cfg.Agents.Defaults.Model = p.Model
}
```

If you're reconfiguring the current default provider and it has a model, update `agents.defaults.model`. Simple.

But wait — there was more.

---

## PR #52: The Reconfigure Fix

After merging the abstraction, I ran the same scenario again: configure NVIDIA as default, then reconfigure it with a different model. The model still didn't update.

Why? Because the abstraction fixed the `internal/configure` package, but the CLI's main command (`cmd/joshbot/main.go`) had its *own* copy of the configure logic for the non-interactive `--provider` flag path. Two code paths, one fix applied to only one.

This is the exact problem the abstraction was supposed to prevent. But because the CLI had parallel logic that hadn't been fully migrated, the bug persisted.

The fix in PR #52 was identical logic, applied to `cmd/joshbot/main.go`:

```go
} else if cfg.ProviderDefaults.Default == provider && p.Model != "" {
    cfg.Agents.Defaults.Model = p.Model
}
```

Now both the interactive wizard and the CLI flag path update the model correctly.

---

## The Test That Caught It

The fix came with two new tests in `internal/configure/configure_test.go`:

```go
func TestConfigureProvider_ReconfigureDefault_UpdatesModel(t *testing.T) {
    cfg := newTestConfig(t)
    cfg.Providers["nvidia"] = config.ProviderConfig{
        APIKey: "nvapi-old",
        Model:  "stepfun-ai/step-3.5-flash",
        Enabled: true,
    }
    cfg.ProviderDefaults.Default = "nvidia"
    cfg.Agents.Defaults.Model = "stepfun-ai/step-3.5-flash"
    c := New(cfg)

    err := c.ConfigureProvider(ProviderOptions{
        Name:  "nvidia",
        APIKey: "nvapi-new",
        Model: "meta/llama-4-405b",
    })
    if err != nil {
        t.Fatalf("ConfigureProvider on default provider failed: %v", err)
    }

    if c.cfg.Agents.Defaults.Model != "meta/llama-4-405b" {
        t.Errorf("expected agents.defaults.model updated to 'meta/llama-4-405b', got %q", c.cfg.Agents.Defaults.Model)
    }
}
```

The test sets up NVIDIA as the default, then reconfigures it with a different model, and verifies the update propagates. It failed before the fix, passes after.

---

## What I Learned

**Abstraction isn't a one-time fix.** Extracting logic into a package doesn't automatically update all call sites. The CLI's main command still had parallel logic that needed to be migrated. The abstraction made the fix *possible*, but it didn't make it automatic.

**Test the reconfigure path.** Most tests cover "add first provider," "add second provider," "remove provider." Fewer tests cover "reconfigure the default provider with different settings." That's where this bug hid.

**Configuration state is harder than it looks.** There are three layers of state here:
1. Per-provider config (`providers.nvidia.model`)
2. Default provider (`provider_defaults.default`)
3. Effective model (`agents.defaults.model`)

Keeping them in sync requires either careful bookkeeping or a single source of truth. We chose bookkeeping because the effective model needs to be quickly accessible without resolving the provider chain on every request.

**Go's zero values are a feature, not a bug.** The `enabled` field on providers defaults to `false`. If you don't explicitly set `"enabled": true` in config, the provider is disabled. This bit us earlier with the Copilot OAuth integration — the OAuth flow worked, the token was saved, but the provider never showed up because it wasn't enabled. That's a separate story.

---

## The Fix in Numbers

- **3 commits** across 2 PRs
- **71 lines** added (66 in tests)
- **2 call sites** updated with the same logic
- **12 tests** covering configuration scenarios
- **1 package** extracted (`internal/configure`)

---

## What's Next

The configuration system is now more robust, but there's still work to do:

- **Model-centric config format**: Instead of per-provider models, support a `models_config` array with named model presets (e.g., "smart", "fast") that can reference different providers.
- **Provider health checks**: Periodically test provider endpoints and surface degradation in `joshbot status`.
- **Config migration**: Add `joshbot config migrate` to upgrade config files between major versions.

The code is at [github.com/bigknoxy/joshbot](https://github.com/bigknoxy/joshbot). The configuration package is in `internal/configure/`. The tests are worth reading if you're testing Go configuration logic.

---

*Thanks to the reviewers who caught the parallel logic in `main.go` before this shipped. The abstraction made the fix visible, but the code review made it complete.*

---

## Fact-Check Checklist

- [x] Commit hashes verified against git log
- [x] Code snippets match actual diff in PRs #51 and #52
- [x] Test code matches `internal/configure/configure_test.go`
- [x] Configuration structure matches `internal/config/config.go`
- [x] No personal API keys or tokens exposed
- [ ] Reviewer: Verify technical accuracy of Go configuration patterns
- [ ] Reviewer: Check for any personal information leaks
- [ ] Reviewer: Validate hero image suggestion

---

## Hero Image Suggestion

A split-screen terminal screenshot showing:
- Left: `joshbot configure` interactive wizard updating the default provider
- Right: `cat ~/.joshbot/config.json` showing the updated `agents.defaults.model`
- Overlay: Git commit graph showing the three commits (abstraction → reconfigure fix → tests)

Alternatively: A simple diagram showing the three layers of configuration state (per-provider → default provider → effective model) with arrows indicating the sync direction.

---

*This is a draft. Do not publish without editor approval.*
