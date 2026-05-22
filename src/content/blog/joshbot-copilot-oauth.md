---
title: "I Merged Five PRs in One Afternoon to Fix One Feature"
description: "Adding GitHub Copilot OAuth to joshbot took twenty minutes to implement and one very long day to actually make work. A story about hidden state, path bugs, and the debug log that finally explained everything."
pubDate: 2026-05-22
tags: ["go", "oauth", "debugging", "joshbot", "github-copilot", "ai"]
---

# I Merged Five PRs in One Afternoon to Fix One Feature

*Or: OAuth Said It Worked, and OAuth Was Lying*

On February 27th I merged five pull requests to joshbot in a single afternoon. All of them were fixes for the same feature. The feature was adding GitHub Copilot as a free AI provider — no credit card, just OAuth. It should have taken twenty minutes.

Here's what actually happened.

## The Setup

[joshbot](https://github.com/bigknoxy/joshbot) is my Go CLI AI assistant — think a terminal-native agent that can use tools, run a local gateway, and swap between LLM providers. I'd already wired up OpenRouter, NVIDIA NIM, Groq, and Ollama. GitHub Copilot was the obvious next one to add: if you have a GitHub account, you have free Copilot access, which means free API calls.

The implementation went smoothly. OAuth device flow: user opens a URL, authorizes, gets a token, token saved to `~/.joshbot/auth.json`. Models fetched from `https://models.github.ai/catalog/models`. Requests sent to `https://api.githubcopilot.com/v1/chat/completions`. Standard stuff. I ran through the flow manually, the device code showed up, I authorized it, the terminal printed "authenticated successfully."

Then I ran `joshbot agent` and got:

```
no providers configured
```

---

## PR #37 — The Obvious Fix (04:10 UTC)

The onboarding flow that enables a provider had a branch condition:

```go
// Before
if apiKey != "" || provider == "ollama" {
    // write provider to config as enabled
}
```

Copilot doesn't have an API key — it uses OAuth. So the branch never fired. The OAuth dance completed successfully, the token was written to disk, and then the onboarding flow just... didn't enable the provider. Config never got written. `joshbot agent` saw nothing configured.

The fix was a one-liner:

```go
// After
if apiKey != "" || provider == "ollama" || provider == "github-copilot" {
```

Merged at 04:10 UTC. Felt good. Done, right?

---

## PR #40 — The Token Was in the Wrong Place (16:03 UTC)

Same day, twelve hours later.

The token was loading fine in the sense that `LoadToken` didn't return an error. But the token that was being loaded was stale, or wrong, or — it took some digging — in the wrong directory entirely.

The root issue: `LoadToken` expected a plain home directory (`~`) but was being passed `config.DefaultHome`, which is already `~/.joshbot`. So it was building a path like:

```
filepath.Join(config.DefaultHome, ".joshbot", "auth.json")
// → ~/.joshbot/.joshbot/auth.json
```

The auth file was being written to `~/.joshbot/.joshbot/auth.json`. Everything else — the CLI, the agent, anything that checked for the token — was looking in `~/.joshbot/auth.json`. Two different paths. Both silently succeeding.

The fix was a small helper that makes the distinction explicit:

```go
// GetHomeDir returns the plain home directory (~), not the joshbot config dir.
// Call this instead of config.DefaultHome when building auth file paths.
func GetHomeDir() (string, error) {
    home, err := os.UserHomeDir()
    if err != nil {
        home = os.Getenv("HOME")
        if home == "" {
            return "", fmt.Errorf("could not determine home directory: %w", err)
        }
    }
    return home, nil
}
```

Six call sites in `main.go` updated. PR #40 touched 9 files, 264 additions, 84 deletions — not bad for a "the path is wrong" bug.

---

## PR #41 — The Bigger Problem Hiding Underneath (21:13 UTC)

With the path fixed, Copilot could actually load its token. But `joshbot agent` was still skipping it.

The `MultiProvider` — the thing that manages provider fallback chains — registered providers by name, model, and priority. That was it. There was no `Enabled` field. Providers were either registered or not; there was no concept of a provider being in config but turned off.

```go
// ProviderEntry before PR #41
type ProviderEntry struct {
    Name     string
    Provider Provider
    Model    string
    Priority int
    // no Enabled field
}
```

If `config.json` had `"enabled": false` on a provider — or no `enabled` field at all, which Go zero-values to `false` — the provider got registered into the map and then silently disappeared from the fallback chain, because `getFallbackChain` didn't check for it.

PR #41 added the field and wired it through:

```go
type ProviderEntry struct {
    Name     string
    Provider Provider
    Model    string
    Priority int
    Enabled  bool  // now it's here
}
```

`getFallbackChain` started filtering on `entry.Enabled`. `HasProvider` started checking it. A new `SetEnabled` method let you toggle at runtime. All five provider registration calls in `main.go` got updated to pass `p.Enabled` from config.

The consequence: any provider that was in config without an explicit `"enabled": true` was now visible as disabled, rather than silently missing. Copilot, once OAuth'd and with its token in the right place, could be explicitly enabled and actually show up.

---

## The Epilogue: "I've Processed Your Request."

A week after the five-PR afternoon, I ran `joshbot agent` with a task that involved a tool call. The tool ran fine. Then joshbot responded with:

```
I've processed your request.
```

That's a static fallback string in the agent loop — it fires when the second LLM call (the one that generates a response after the tool runs) returns empty content. I'd never seen it before, and I had no idea what was causing it.

I added a `--debug` flag (PR #47) specifically to figure this out. The debug log told the whole story:

```
WARN Empty content from LLM - triggering fallback message model=moonshotai/kimi-k2-thinking iteration=2
```

The model was `moonshotai/kimi-k2-thinking` on NVIDIA NIM. The second pass of the agent loop was hitting a rate limit (HTTP 429). The `FallbackError` system — which I'd added in PR #38 — was correctly catching 429s and falling back to the next provider. But the fallback was happening *silently*, and the next provider in the chain was also rate-limited, so the loop eventually fell through to the static string.

The fix was making the fallback behavior visible: log when it happens, log which provider it fell back to, log the response content so you can see what you're getting. The `--debug` flag now surfaces all of it.

---

## What I Actually Learned

A few things, in rough order of "I should have known this":

**OAuth success is not integration success.** The device flow worked. The token was written. The "authenticated successfully" message printed. None of that meant the provider was actually wired up and usable. OAuth is one layer of a stack; the other layers can all be wrong independently.

**Go zero values are not defaults.** A struct field that isn't set doesn't have a default value — it has Go's zero value for its type. For `bool`, that's `false`. If your struct has an `Enabled bool` field and you don't explicitly set it to `true`, the thing is disabled. Not "enabled by default" — disabled. That's the correct behavior, but it's not always the intuitive one when you're adding a field to an existing struct.

**Silent fallbacks lie.** The rate limit fallback working correctly felt like success — the request didn't crash, something came back. But "something came back" included falling all the way through the chain to a static string, and there was no indication that had happened. Good fallback systems fail loudly when all fallbacks are exhausted; they don't return the answer "I've processed your request."

**Five PRs for one feature doesn't mean the feature was hard.** The OAuth integration itself was maybe 200 lines of Go. The other 200-odd lines of changes across five PRs were about configuration state management, path handling, and observability. The integration was easy. Making it actually work in the presence of real config and real error conditions — that's the part that takes all day.

---

*joshbot is at [github.com/bigknoxy/joshbot](https://github.com/bigknoxy/joshbot). The Copilot provider is in `internal/copilot/`. The `--debug` flag is in the current release and worth using if a tool call ever responds with something suspiciously tidy.*
