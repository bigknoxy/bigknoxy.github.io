---
title: "Scoping Telegram Bot Command Menus to Allowlisted Users in joshbot"
description: "How joshbot now scopes BotCommandScopeChat to each allowed user, removes the global menu, and improves security and UX for strangers finding the bot."
pubDate: 2026-08-25
tags: ["joshbot", "telegram", "bot-api", "security", "go", "ux"]
draft: true
---

## The Problem: Global Command Menus Expose Unavailable Commands

Previously, joshbot published a single global BotCommandScopeAllPrivateChats menu listing all available commands (e.g., `/agent`, `/configure`, `/status`). While convenient for allowed users, this presented two issues:

1. **Security through obscurity**: Strangers who discover the bot (e.g., via username mention in a public group) see a menu of commands they cannot execute, potentially confusing them or revealing the bot's capabilities.
2. **Poor user experience**: Allowed users see the same menu, but if the bot is used in a group, the menu appears in private chats with the bot regardless of whether the user is allowlisted.

## The Solution: Per-User Command Scopes

joshbot now iterates over the `channels.telegram.allow_from` configuration (a list of numeric Telegram user IDs) and, for each ID that can be resolved to a chat, publishes a `BotCommandScopeChat` menu. The global menu is deleted.

### Key Implementation Details

#### 1. Scoping to Allowlisted Users

In `internal/channels/telegram.go`, the `syncCommandMenus` function now:

```go
for _, userID := range cfg.Telegram.AllowFrom {
    chatID, err := resolveChatID(userID)
    if err != nil {
        // Username-shaped entries cannot be resolved until the user speaks.
        // We keep the global menu in this case (see below).
        if errors.Is(err, telegram.ErrChatNotFound) {
            logger.Warnw("cannot resolve allowlisted user to chat ID", "userID", userID, "err", err)
            continue
        }
        logger.Errorw("failed to resolve allowlisted user", "userID": userID, "err": err)
        continue
    }
    if err := tn.SetMyCommands(telebot.Menu{
        Scope: &telebot.MenuScope{ChatID: chatID},
        Commands: []telebot.Command{
            {Text: "agent", Description: "Chat with the agent"},
            {Text: "configure", Description: "Run the configuration wizard"},
            {Text: "status", Description: "Show bot status"},
            // ... other commands
        },
    }); err != nil {
        logger.Errorw("failed to set command menu for chat", "chatID": chatID, "err": err)
    }
}
```

#### 2. Deleting the Global Menu Properly

A critical nuance: clearing a scope requires `deleteMyCommands`, not an empty `setMyCommands`. The `telebot` library's `CommandParams.Commands` field is omitted when empty (`json:"commands,omitempty"`), causing the Bot API to reject the call. Therefore, joshbot added a `DeleteCommands` method to the `telegramNotifier` interface:

```go
// DeleteCommands removes the command menu for the given scope.
DeleteCommands(scope *telebot.MenuScope) error
```

#### 3. Handling Unresolved Usernames and Chat Not Found

If an allowlist entry is a username (not resolvable to a chat ID until the user sends a message), resolution fails with `telebot.ErrChatNotFound`. This is expected and logged at warn level—**one such user must not cost every other user their menu**. The first error is still returned at startup, but registration failure remains non-fatal.

#### 4. TUI Tab-Completion Fix

While updating command menus, the developers also fixed the TUI's Tab-completion list in `internal/agent/agent.go`. The list previously offered `/clear` and `/history` for a buffered prompt that never implemented them, causing Tab to complete a command the agent then answered as prose (with no error). The fix:

- Removed `/clear` and `/history`
- Added `/resume`
- Made `/exit` match alongside the bare `"exit"`
- Added a `go/ast` test that parses `handleCommand`'s switch to prevent drift

## Impact

- **Strangers** who find the bot now see no command menu (or only the global menu if any allowlist entry is a username), reducing confusion and information leakage.
- **Allowed users** see a personalized menu in their private chat with the bot, matching their permissions.
- **Bot administrators** gain finer control over who sees what commands, aligning with the allowlist philosophy.

## Fact-Check Checklist

- [ ] Verify commit [3f79379](https://github.com/bigknoxy/joshbot/commit/3f793792e8e0ba68736cdf90f0995d45b50e97e2) scopes command menus to allowlisted users.
- [ ] Confirm deletion of global menu uses `deleteMyCommands`.
- [ ] Check that unresolved usernames keep the global menu (per comment in code).
- [ ] Ensure TUI Tab-completion changes are in `internal/agent/agent.go` and tested.
- [ ] Validate that the change aligns with the project's AGENTS.md rule: "Never push work directly to `main`" (this change went via PR #324).

## Hero Image Suggestion

A split-screen illustration: left side shows a Telegram chat with a stranger seeing "No commands available"; right side shows an allowed user seeing a full command menu. Overlay with a lock icon to emphasize security.

## Conclusion

By scoping command menus to the allowlist, joshbot improves both security and user experience. This change exemplifies the project's commitment to thoughtful, user-centric design—even in seemingly small details like bot menus.