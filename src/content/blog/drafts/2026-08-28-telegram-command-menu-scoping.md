---
title: "Telegram Command Menu Scoping: Enhancing joshbot Security and UX"
description: "How scoping Telegram command menus to the allowlist improves security by hiding commands from strangers while providing appropriate menus for allowlisted users"
tags: [telegram, bot-development, security, go, ux, joshbot]
---

## The Problem: Global Command Menus Leak Information

Before this update, joshbot published a single global Telegram command menu visible to anyone who found the bot. This meant strangers could see a list of commands like `/status`, `/model`, `/personality`, etc., even though they weren't authorized to use them. While the bot would reject unauthorized usage, merely showing these commands revealed information about the bot's capabilities and could be confusing or concerning to unknown users.

## The Solution: Scoped Command Menus

The update introduces per-chat command menus scoped to the `allowlist` configuration:

1. **Numeric `allow_from` entries** (chat IDs) get their own `BotCommandScopeChat` menu
2. **Username-shaped entries** keep the global menu (since they can't be resolved to chat IDs until the user speaks)
3. **Empty allowlist** deletes the global menu entirely
4. **Global all-private-chats menu is deleted** when there are no username entries

This ensures:
- Strangers who find the bot see **no command menu at all**
- Allowlisted users by chat ID get a menu tailored to their scope
- Allowlisted users by username still see the global menu (as intended)
- No information leakage to unauthorized users

## Technical Implementation

### Interface Changes

Added `DeleteCommands` to the `telegramNotifier` interface since `SetCommands` cannot clear scopes:

```go
type telegramNotifier interface {
    Notify(to telebot.Recipient, action telebot.ChatAction, threadID ...int) error
    SetCommands(opts ...interface{}) error
    React(to telebot.Recipient, msg telebot.Editable, opts ...telebot.ReactionOptions) error
    DeleteCommands(opts ...interface{}) error // New method for clearing scopes
}
```

### Core Logic in `registerCommands`

```go
func (t *TelegramChannel) registerCommands(notifier telegramNotifier) error {
    // ... validation ...
    
    ids := make([]string, 0, len(t.allowIDs))
    for id := range t.allowIDs {
        ids = append(ids, id)
    }
    namedCount := len(t.allowNames)
    sort.Strings(ids) // Deterministic order for tests/logs

    var firstErr error
    for _, raw := range ids {
        id, err := strconv.ParseInt(raw, 10, 64)
        if err != nil {
            continue
        }
        
        err = notifier.SetCommands(
            botCommands,
            telebot.CommandScope{Type: telebot.CommandScopeChat, ChatID: id},
        )
        if err != nil {
            // Log "chat not found" for users who haven't started bot, but continue
            log.Debug("failed to register per-chat Telegram command menu", "chat_id", raw, "error", err)
            if firstErr == nil {
                firstErr = err
            }
            continue
        }
    }

    // Handle global menu: keep if username entries exist, delete otherwise
    globalScope := telebot.CommandScope{Type: telebot.CommandScopeAllPrivateChats}
    var err error
    if namedCount > 0 {
        err = notifier.SetCommands(botCommands, globalScope)
    } else {
        err = notifier.DeleteCommands(globalScope)
    }
    if err != nil && firstErr == nil {
        firstErr = err
    }
    return firstErr
}
```

### Key Details

1. **Why `DeleteCommands` is necessary**: 
   - Telebot's `CommandParams.Commands` uses `json:"commands,omitempty"`
   - An empty slice omits the field entirely, causing the Bot API to reject the call
   - Proper scope clearing requires `deleteMyCommands` API call

2. **Handling unstarted chats**:
   - When registering for a chat ID where the user hasn't started the bot, Telegram returns "chat not found"
   - This is expected and logged, but doesn't prevent other users from getting their menus
   - One user's lack of interaction shouldn't affect others' experience

3. **Test coverage**:
   - Tests verify proper scoping behavior for numeric vs username allowlist entries
   - Tests confirm global menu deletion when appropriate
   - Tests ensure registration continues past "chat not found" errors
   - Tests validate command descriptions and handler matching

## UX and Security Benefits

### Enhanced Security
- **Zero information leakage**: Strangers see no indication of bot capabilities
- **Principle of least privilege**: Users only see commands relevant to their context
- **Reduced attack surface**: No command menu enumeration for unauthorized users

### Improved User Experience
- **Cleaner interface**: Allowlisted users aren't distracted by irrelevant commands
- **Context-aware menus**: Numeric allowlist entries get truly scoped menus
- **Predictable behavior**: Username entries behave as before (global menu until user speaks)

## Verification Checklist

- [x] Command menu properly scoped to numeric allowlist entries
- [x] Global menu preserved when username-shaped allowlist entries exist
- [x] Global menu deleted when allowlist is empty or contains only numeric entries
- [x] "Chat not found" errors logged but don't break registration for other users
- [x] `DeleteCommands` used correctly for scope clearing
- [x] Test suite passes, including new scoping tests
- [x] TUI Tab-completion fixes verified (/clear, /history removed, /resume added)
- [x] Documentation updated in README.md and CLAUDE.md
- [x] Changelog entry added for both feature and fix

## Related Changes

This update also fixed the TUI's Tab completion which was offering `/clear` and `/history` for a buffered prompt that never implemented them. The fix:
- Removed `/clear` and `/history` from completion list
- Added `/resume` (which the agent already handled)
- Made `/exit` match alongside bare `exit`
- Added a `go/ast` test to prevent drift between completion list and actual command handlers

## Conclusion

Scoped command menus represent a simple but effective security enhancement that aligns with joshbot's allowlist-based access control model. By ensuring that command menus only reveal relevant information to each user context, we improve both security posture and user experience without complicating the configuration model.

The implementation demonstrates careful attention to edge cases (unstarted bots, username vs numeric entries) and maintains backward compatibility for existing setups while providing stronger security guarantees by default.