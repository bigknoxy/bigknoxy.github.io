---
title: "Telegram, Drafts, Reactions, and Self-Hosted Bots: Making JoshBot Feel Instant on Mobile"
description: "How we reworked JoshBot's Telegram streaming to use Bot API message drafts, reaction-based acknowledgements, and self-hosted Bot API servers to eliminate the lag of phone-based agent turns."
pubDate: 2026-08-21
heroImage: "/assets/images/blog/joshbot-telegram-streaming.png"
tags: ["go", "telegram", "joshbot", "streaming", "bot-api", "ux"]
---

# Telegram, Drafts, Reactions, and Self-Hosted Bots: Making JoshBot Feel Instant on Mobile

*Or: Why the bot's phone experience used to feel like it was answering in a different timezone — and how we fixed it.*

For the last year, JoshBot has lived primarily in my terminal. I'd fire `joshbot agent -m "..."` and get a reply, or talk to it through a Telegram group chat that I left open on my phone. The Telegram path worked, but it had a latency problem that only got worse under load: by the time the bot admitted it was *working*, it had often already finished its turn. The phone showed the answer *after* the work was done — no "it heard me" signal, no typing progress, and definitely nothing for the user to stare at while the agent was still thinking.

This wasn't a bug in the agent loop itself. It was a presentation problem: the streaming path had to *send a message, then edit it*, and that first `sendMessage` only fires once the model emits its first token. On a device that rounds-trip-trips every packet, that feels slow.

Over the last week, I landed four Telegram-focused changes to JoshBot ([v1.59.0](https://github.com/bigknoxy/joshbot/releases/tag/v1.59.0) plus a couple of follow-ups) that together rework how a turn reaches a phone. This post walks through what changed, why each change matters, and the surprising Bot API details that make — or break — the experience.

## The Old Flow: Send-Then-Edit

Before these changes, a streaming turn to Telegram looked like this:

1. The ReAct loop starts a tool call (e.g. `web_fetch`).
2. The `TelegramStreamer` calls `Status("⚙️ web_fetch: fetching...")` → `telebot.Send` posts a *status message*.
3. The model begins thinking, but the phone shows nothing yet.
4. The first text delta arrives → `Edit` rewrites the status message in place.
5. Subsequent deltas keep editing until the turn ends.

There are three problems here:

- **No early acknowledgement.** Until step 4, the chat shows nothing — not even a typing indicator on every client. A phone user has no idea the bot has received their message.
- **Throttling collisions.** Telegram allows ~1 message operation per second per chat. Status edits and content edits share that budget, so a chatty tool chain starves the actual reply.
- **Status/message slot coupling.** The status line and the reply live in one message, so a failed final edit after a partial stream makes `Finish` think the turn was undelivered and triggers the bus fallback — which republishes the *whole* answer on top of what's already shown (a known trap that [issue #283](https://github.com/bigknoxy/joshbot/issues/283) already taught us to watch for).

## 1. Message Drafts: "Thinking…" Before the First Token

The headline feature in this batch — `channels.telegram.stream_drafts` — replaces the send/edit loop with Bot API's `sendMessageDraft` method ([#308](https://github.com/bigknoxy/joshbot/pull/308)).

Instead of posting a message and editing it, the streamer now writes incremental text into the **draft slot** that Telegram renders as an ephemeral, animated preview *without* a message object appearing in the chat at all. Before the first token arrives, it writes an empty-text draft that Telegram renders as its own **"Thinking…"** placeholder.

```go
// internal/channels/telegram_draft.go
const sendMessageDraftMethod = "sendMessageDraft"

func (s *TelegramStreamer) sendDraftLocked(text string) {
    // telebot v3.3.8 has no typed wrapper for sendMessageDraft,
    // so this goes out as a raw Bot API request. Bot.Raw already
    // converts {"ok":false} into an error, which is what makes the
    // self-disable here reliable rather than a silent no-op.
    payload := map[string]interface{}{
        "chat_id":   s.draftChatID,
        "draft_id":  s.draftID,
        "text":      draftTail(text), // trimmed to 4096 chars at a rune boundary
    }
    if _, err := caller.Raw(sendMessageDraftMethod, payload); err != nil {
        // Older Bot API servers answer "method not found", and an
        // empty text is only accepted from Bot API 10.0 onward.
        // Either way, fall back to the send/edit loop — streaming
        // is presentation, and losing the answer to it is a bad trade.
        s.draftsOK = false
        log.Debug("telegram message drafts disabled for this turn", "error", err)
        return
    }
    s.draftSent = true
    s.draftShown = text
}
```

A few things make this safe to ship as a default-off, `omitempty` field:

- **It's off by default and carries `omitempty`** on the config struct, so every existing config joshbot has saved stays exactly as it was — no schema migration. This is the trap the `streaming` bool hit at v4→v5: a config bool without `omitempty` is written into every saved config and its default can then never be flipped again.
- **A draft refusal disables drafts for *that turn only*, not globally.** The first API error flips `s.draftsOK = false`, and the edit loop takes over from that delta. The turn still completes — the reply is never at the mercy of a presentation path.
- **It's private-chat only.** The Bot API reference documents `sendMessageDraft`'s `chat_id` as "the target private chat," so a group call would just earn an error per delta. `privateChatID` enforces that at construction.
- **Drafts are ephemeral** (per the reference: "a temporary 30-second preview"), so a draft write never sets `delivered`. `Finish`'s `delivered && !broken && shown == buf` contract — which decides whether to suppress the bus fallback — is untouched. The persisting `sendMessage` still runs at the end of every turn.

**One hard-won correction worth recording:** the issue text in #308 claimed the empty-text ("Thinking…") allowance dated to Bot API 9.3/9.5. Verification against the published reference shows it is actually **Bot API 10.0 (8 May 2026)**. A `Thinking()` call that runs before the API has that method answers `method not found` — which the self-disable handles, but the version comment now records the right date.

## 2. Reactions-as-Acknowledgement: "👀" Then "👍" on the User's Own Message

Drafts solve the *streaming* half of the latency story. The *acknowledgement* half — "did the bot hear me?" — is now handled by `channels.telegram.reactions` ([#314](https://github.com/bigknoxy/joshbot/pull/314)), which puts the emoji on the **user's own message** rather than replying to it.

Why the user's own message? In a group, every bot reply takes a message slot. In a one-on-one that's fine; in a group a bot that auto-replies "OK" to each incoming message consumes the very resource the conversation depends on. `setMessageReaction` (Bot API 7.0) avoids that entirely: it annotates the sender's message with a reaction, costing no slot.

```go
// internal/channels/telegram_reactions.go
const (
    // 👀 goes on the moment the turn is admitted to the bus —
    // "the bot heard you."
    ackAdmittedEmoji = "👀"
    // 👍 replaces it once the reply is on its way.
    ackDoneEmoji = "👍"
)

// react is best-effort: a reaction is an ornament, never part of the turn,
// so a failure is logged at debug and the turn continues.
func (t *TelegramChannel) react(recipient telebot.Recipient, messageID int, emoji string) {
    if !t.reactionsEnabled() || messageID == 0 {
        return
    }
    ...
    go func() {
        err := notifier.React(recipient, target, telebot.ReactionOptions{
            Reactions: []telebot.Reaction{{Type: "emoji", Emoji: emoji}},
        })
        if err != nil {
            log.Debug("reaction ack failed", "chat", key, "emoji", emoji, "error", err)
        }
    }()
}
```

Two API details are easy to get wrong here and both are pinned by tests:

1. **✅ is not in Telegram's free reaction set.** A premium-only emoji is rejected with `REACTION_INVALID` and the ack silently never appears — so completion is 👍, not a checkmark. The tests in `telegram_reactions_test.go` pin both emoji against the documented free list.
2. **`setMessageReaction` *sets* rather than *appends*** — writing 👍 clears 👀 with no separate clearing call. That is exactly the semantics we want (one state transition per turn), but it means a stray `react` for a different namespace would clobber the ack. For now that's only a risk in tests, which is why `react` refuses non-`channels.telegram.reactions` configs outright.

Like drafts, reactions are **opt-in and off by default** — a bot in a group without the reaction permission would otherwise log a failure on every single turn. It's also explicitly **outbound only**: joshbot does not subscribe to `message_reaction` updates.

## 3. Self-Hosted Bot API Server via `channels.telegram.api_url`

The streaming drafts and reactions are gated on a Bot API server that *supports* those methods. That requirement — and a more practical one, outbound attachment size — is what landed `channels.telegram.api_url` ([#280](https://github.com/bigknoxy/joshbot/pull/280)), which points the channel at a local `telegram-bot-api` instead of `api.telegram.org`.

```go
// internal/config/config.go
type TelegramConfig struct {
    ...
    // APIURL points at a self-hosted telegram-bot-api server instead of
    // api.telegram.org. Empty means the public Bot API.
    APIURL string `mapstructure:"api_url" json:"api_url,omitempty" yaml:"api_url"`
}

// validateTelegramAPIURL screens the value before it reaches telebot,
// which takes it as an opaque base and would otherwise fail at the
// first poll with a URL error naming neither the key nor the value.
// The failure is FATAL, not ordinary: Load answers an ordinary
// validation error by substituting Defaults(), which would silently
// take every provider, API key and allowlist with it.
func validateTelegramAPIURL(raw string) error {
    if raw == "" {
        return nil
    }
    u, err := url.Parse(raw)
    if err != nil {
        return fatalConfigError{fmt.Errorf("channels.telegram.api_url is not a valid URL: %w", err)}
    }
    if u.Scheme != "http" && u.Scheme != "https" {
        return fatalConfigError{...}
    }
    if u.Host == "" {
        return fatalConfigError{...}
    }
    return nil
}
```

Why is an invalid URL a *fatal* config error rather than a retryable validation failure? Because `config.Load`'s normal response to an ordinary validation error is to log `"Config unusable, using defaults"` and substitute `Defaults()` — which would discard every provider, API key, and allowlist in the config. That's the same precedent `validateTimeout` set in #240; an `api_url` misconfiguration that silently falls back to the public API and then fails auth is worse than a hard stop at startup.

A side effect of pointing at a self-hosted server is the outbound attachment cap: `send_file` now raises its limit from 10 MiB to 50 MiB for configs that have a local server. Critically, this cap is enforced by **one shared rule** — `channels.TelegramAttachmentLimitsFor` — that both the transport (`TelegramChannel.AttachmentLimits`) and the producer (`SendFileTool`, via `tools.WithAttachmentLimits`) read:

```go
// internal/channel/telegram_attachment.go
func TelegramAttachmentLimitsFor(cfg *config.TelegramConfig) AttachmentLimits {
    limits := AttachmentLimits{MaxBytes: 10 << 20} // 10 MiB
    if cfg != nil && cfg.APIURL != "" && cfg.Enabled {
        limits.MaxBytes = 50 << 20 // 50 MiB
    }
    return limits
}
```

A second copy of this constant would drift, and the symptom is a tool refusing to send something the transport would happily accept (or vice-versa). The ceiling is 50 MiB and **not** the local server's 2 GB because the entire payload is held in memory from the tool call until the upload finishes — the cap is a memory bound, not an API bound. Raising it further needs the file-descriptor-carrying rework tracked in #305.

Note this only raises the *outbound* cap. Inbound limits — what a model is billed to read — are unchanged: `providers.MaxImageBytes` (5 MiB) and `providers.MaxDocumentBytes` (8 MiB) bound image and PDF ingestion regardless of whether the Bot API front is local or cloud.

## 4. Structured Callback Routing: Buttons That Don't Burn an LLM Turn

While the streaming changes are about *receiving* a turn faster, [issue #312](https://github.com/bigknoxy/joshbot/pull/312) is about *not needing a turn at all* for the cheapest possible interaction: an inline-button press.

Previously, `handleCallback` turned every button press into the synthetic user message `[Callback: <data>]` and pushed it through the bus. That meant a button press spent a full ReAct turn — an LLM round trip, tool budget, and a session append — just to interpret a payload the code had already produced.

The new path gives callbacks a structured envelope in `internal/channels/callback.go`:

```go
// Encode renders the action as callback_data. It returns an error
// (not a best-effort string) for every way the envelope can be
// invalid, because each produces a button that silently misbehaves
// at press time rather than at build time.
func (a CallbackAction) Encode() (string, error) {
    ...
    encoded := a.Namespace + callbackSep + a.Action + callbackSep + a.Payload
    if len(encoded) > CallbackDataMaxBytes {
        return "", fmt.Errorf("callback data is %d bytes, over Telegram's limit of %d", ...)
    }
    return encoded, nil
}

// DecodeCallback trims telebot's form-feed prefix, then splits on
// the separator with SplitN(..., 3) so only the first two fields
// are structural and the payload may itself contain ":".
func DecodeCallback(data string) (CallbackAction, error) {
    data = strings.TrimPrefix(data, "\f")
    parts := strings.SplitN(data, callbackSep, 3)
    if len(parts) < 3 {
        return CallbackAction{}, ErrNotCallbackAction // fall back to the bus
    }
    ...
}
```

Handlers register for a namespace:

```go
// RegisterCallback claims a namespace for inline-button routing.
// An empty namespace, one containing the separator, a nil handler,
// or a duplicate registration all return an error at registration
// time — not at press time.
func (t *TelegramChannel) RegisterCallback(namespace string, handler CallbackHandler) error

// CallbackHandler is a typed handler; the press carries the action,
// callback id, chat id, message id, and sender — everything needed
// to answer and edit the message in place without the agent loop.
type CallbackHandler func(ctx context.Context, press CallbackPress) error
```

Two load-bearing invariants:

- **`Encode` errors at build time when the envelope exceeds 64 bytes** — Telegram's `callback_data` limit. A truncated payload decodes as a *different, valid* action, so truncation is strictly worse than failing the button; an `Encode` that returns `""` on error means a caller that ignores the error sends a button that posts nothing.
- **Unknown buttons still work.** Data that doesn't decode is reported as `ErrNotCallbackAction` and forwarded to the agent as before, so a button from an older joshbot, or from any other producer, still does something rather than being dropped. Only the structured, registered namespaces get the no-LLM path.

## The `/new` Escape Hatch — And Why It Had to Jump the Queue

While not Telegram-specific, [the `/new` routing fix (#319/#326)](https://github.com/bigknoxy/joshbot/pull/326) is worth flagging here because it directly affects the group UX the changes above are trying to improve.

Every turn is serialized per session key (#236), and `/new` was serialized with them — so a reset issued during a long tool-running turn waited for *that turn* to finish, and under the per-key cap (`MaxConcurrentTurnsPerKey`) it was refused outright with a backpressure reply. That's the opposite of what a reset is for.

`/new` is now routed **ahead of** `session.Manager.LockSession` in `agent.Process`, so it answers immediately. Skipping the lock is only safe with a fence: sessions now carry a `generation` counter. `Manager.ResetConversation` bumps it, and `Manager.Save` refuses any write whose generation is older than the one on disk — so the turn that loaded its prefix before the reset can't republish the transcript the user just cleared. The field carries `omitempty` and is zero for sessions that have never been reset, so again, no schema migration.

## A Shared Theme: Defaults Must Be Safe

All of these changes share a design constraint that's become a hard rule in this codebase: **any new config knob that, if defaulted-on, would change behaviour for existing users must be opt-in, default-off, and carry `omitempty`.** I've hit the v4→v5 `streaming` trap twice now — a bool written into every config, its default then impossible to flip — and the CHANGELOG now records it as explicitly as it records the feature.

That's why `stream_drafts`, `reactions`, and `api_url` are all `omitempty`, all default-off (or empty), and all degrade to the previous behaviour on any API refusal rather than failing the turn. Streaming is presentation; losing the answer to it is a poor trade.

## What This Means for Users

For JoshBot users on Telegram:

- **You'll see "Thinking…" on your phone the instant you send a message** (in private chats, with `stream_drafts` on), instead of watching the typing indicator spin until the model produces its first token.
- **You'll get an 👀 reaction immediately** and a 👍 when the reply is on the way — no message-slot noise, works in groups (with `reactions` on).
- **A self-hosted Bot API server** (via `channels.telegram.api_url`) unlocks the draft/reaction methods on machines that need them, and raises the outbound attachment cap to 50 MiB for local uploads.
- **Inline buttons that previously burned a full agent turn** — confirmations, model selectors, pagination — now dispatch directly to a handler, with no LLM round trip.
- **A `/new` issued during a long turn actually resets immediately**, not after the in-flight turn finishes.

## Verification

These changes were validated through the test harnesses wired into the project:

- `telegram_stream_test.go` and `telegram_reactions_test.go` pin the emoji and draft self-disable behaviour against the Bot API's documented free reaction set and the `sendMessageDraft` method.
- `attachment_limits_test.go` and `attachment_limits_option_test.go` assert the 10 MiB / 50 MiB cap is governed by one shared rule read by both transport and tool.
- `callback.go`'s `TestWebTool_RemoveTag`-style tests (in `telegram_callback_test.go`) confirm an over-length envelope errors at build time and that unknown callback data falls through to the legacy bus path.
- `go/ast`-driven tests in `cli_commands_test.go` keep the TUI's Tab-completion list in sync with `handleCommand`'s switch so the completion can't drift from the dispatch again — a sibling fix that landed in the same release window (#316).

---

*All four features ship in joshbot v1.59.0. The drafts and reactions are opt-in (`channels.telegram.stream_drafts` and `channels.telegram.reactions`, both default `false`); set `channels.telegram.api_url` to a local [telegram-bot-api](https://github.com/tdlib/telegram-bot-api) server to enable drafts on machines that need it. Full diff: [PR #307](https://github.com/bigknoxy/joshbot/pull/307) (self-hosted API), [#308/#309](https://github.com/bigknoxy/joshbot/pull/308) (drafts), [#312/#322](https://github.com/bigknoxy/joshbot/pull/312) (callbacks), [#314/#325](https://github.com/bigknoxy/joshbot/pull/314) (reactions).*