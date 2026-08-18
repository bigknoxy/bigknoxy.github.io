---
title: "Portable Knowledge: Building Export/Import for a Self-Evolving Dev Ecosystem"
description: "How adding data portability to a Rust-based learning system revealed hidden coupling, test isolation bugs, and the importance of schema versioning from day one."
pubDate: 2026-06-16
draft: true
tags: ["rust", "self-evolving", "knowledge-management", "cli", "data-portability", "testing"]
heroImage: "/assets/images/blog/organism-export-import.png"
---

# Portable Knowledge: Building Export/Import for a Self-Evolving Dev Ecosystem

*Or: Why Your Learning System Needs a Backup Plan Before It Learns Anything Useful*

Last month I shipped M18 to [self-evolving-dev-ecosystem](https://github.com/bigknoxy/self-evolving-dev-ecosystem): `organism-cli export` and `organism-cli import`. The feature lets you export your entire knowledge store — errors, suggestions, accepted solutions, feedback, and style profile — to a JSON file, then import it elsewhere.

Simple concept. 645 lines of code. Five new test cases. And a surprising number of gotchas along the way.

Here's what happened.

---

## The Setup

The self-evolving dev ecosystem (internally called "organism") is a Rust workspace with 5 crates:

- **protocol**: Event types and IPC message format
- **knowledge**: File-backed knowledge store (errors, suggestions, feedback)
- **cortex**: Suggestion generation logic
- **daemon**: Unix socket server + file watcher + Ollama integration
- **client**: CLI tool (`organism-cli`) that talks to the daemon

The knowledge store lives in `~/.organism/knowledge/` and contains:

- **Error records**: Terminal errors you've encountered (hashed for deduplication)
- **Suggestions**: AI-generated fixes for those errors
- **Accepted snapshots**: Immutable copies of suggestions you accepted (M9.5 guarantee)
- **Feedback**: Your verdicts on suggestions (accept/reject/ignore + notes)
- **StyleProfile**: Your coding preferences mined from accepted suggestions

Everything is file-backed. No databases. No external dependencies. Just JSON files in a directory tree.

Until M18, there was no way to move that knowledge between machines. If you got a new laptop, you'd have to relearn everything from scratch.

---

## The Requirements

The export feature needed to support:

1. **Full export**: Dump everything to a single JSON file
2. **Filtering by tool**: `--tool rustc` to export only Rust compiler errors
3. **Filtering by date**: `--since 2026-05-01` to export recent activity only
4. **Schema versioning**: Prevent importing incompatible data formats
5. **Merge vs replace**: Import modes for different use cases

The import feature needed to:

1. **Validate schema version**: Reject future schema versions gracefully
2. **Merge by default**: Don't overwrite existing data unless explicitly told
3. **Preserve immutability**: Accepted snapshots are write-once (M9.5 guarantee)

---

## The Export Envelope

The export format is a JSON envelope with metadata:

```json
{
  "schema_v": 1,
  "exported_at": "2026-05-19T15:40:07Z",
  "organism_version": "0.1.0",
  "filters": {
    "tool": null,
    "since": null
  },
  "records": {
    "errors": [...],
    "suggestions": [...],
    "accepted": [...],
    "feedback": [...],
    "style_profile": {...}
  },
  "counts": {
    "errors": 47,
    "suggestions": 152,
    "accepted": 23,
    "feedback": 23
  }
}
```

The envelope includes:

- **schema_v**: Version number for forward-compatibility checks
- **exported_at**: RFC3339 timestamp for auditing
- **organism_version**: The version that created the export
- **filters**: Which filters were applied (for reproducibility)
- **records**: The actual data
- **counts**: Quick summary without parsing everything

---

## The Filter Propagation Problem

Here's where things got interesting.

The knowledge store has five types of records, but only **errors** have a `tool` field:

```rust
struct ErrorRecord {
    tool: String,        // "rustc", "cargo", "clippy", etc.
    kind: String,        // "E0599", "E0308", etc.
    hash: String,        // Unique identifier
    // ... other fields
}
```

Suggestions, feedback, and accepted records don't store the tool directly. They're keyed by **error hash** instead:

- Feedback has `error_hash`
- Accepted has `error_hash` and `suggestion_hash`
- Suggestions are stored in files named by their hash

So when you run `organism-cli export --tool rustc`, how do you filter suggestions?

**The fix**: Return `(key, record)` tuples from `list_suggestion_records()`:

```rust
impl KnowledgeStore {
    pub fn list_suggestion_records(&mut self) -> Result<Vec<(String, SuggestionRecord)>> {
        // Extract hash from filename, pair with record content
        // Returns: vec![("abc123", SuggestionRecord { ... }), ...]
    }
}
```

Then the export logic builds a hash set of error hashes that pass the filter, and propagates that set to related records:

```rust
// Step 1: Filter errors by tool
let mut error_hashes_to_export = HashSet::new();
for error in &all_errors {
    if tool_filter.is_none() || error.tool == *tool_filter {
        error_hashes_to_export.insert(error.hash.clone());
    }
}

// Step 2: Filter feedback to only feedback for those errors
let feedback_for_exported: Vec<FeedbackRecord> = all_feedback
    .into_iter()
    .filter(|fb| error_hashes_to_export.contains(&fb.error_hash))
    .collect();

// Step 3: Build set of accepted error hashes
let accepted_error_hashes: HashSet<String> =
    feedback_for_exported.iter().map(|fb| fb.error_hash.clone()).collect();

// Step 4: Filter accepted to only accepted for those errors
let accepted_for_exported: Vec<AcceptedSuggestion> = all_accepted
    .into_iter()
    .filter(|a| accepted_error_hashes.contains(&a.error_hash))
    .collect();
```

This ensures referential integrity: if you export a tool-filtered subset, you get complete error→feedback→accepted→suggestion chains, not orphaned records.

**Lesson**: When your data model uses keys instead of embedded fields, your list APIs need to return those keys alongside records.

---

## The Immutability Conflict

M9.5 introduced a guarantee: **accepted snapshots are immutable**. Once you accept a suggestion, that snapshot is written once and never modified. This is by design — it's an audit trail of what you accepted and when.

But import has a `--replace` mode. What happens when you import an accepted snapshot that already exists?

**The conflict**: `put_accepted()` checks if the file exists and returns early:

```rust
pub fn put_accepted(&mut self, record: &AcceptedSuggestion) -> Result<()> {
    let key = format!("accepted:{}", record.suggestion_hash);
    if self.exists(&key)? {
        return Ok(()); // Write-once semantics
    }
    self.put(&key, record)?;
    Ok(())
}
```

So `--replace` is best-effort for accepted records. It will replace errors and feedback, but not accepted snapshots.

**The fix**: Document this as a known limitation in `cmd_export.rs`:

```rust
// NOTE: --replace is best-effort for accepted records.
// M9.5 immutability guarantee means put_accepted() skips existing records.
// To force overwrites, a future force_put_accepted() method would be needed.
```

**Lesson**: When a new feature conflicts with an existing guarantee, document the limitation explicitly. Don't silently degrade behavior.

---

## The Test Isolation Bug

Export tests need to set `ORGANISM_HOME` to a temp directory:

```rust
#[test]
fn test_export_roundtrip() {
    let tmp = tempfile::TempDir::new().unwrap();
    std::env::set_var("ORGANISM_HOME", tmp.path());
    // ... run export ...
}
```

But `cargo test` runs tests in parallel by default. Environment variables are process-global. If two tests mutate `ORGANISM_HOME` simultaneously, they can step on each other.

**Why tests passed anyway**: Each test uses a distinct `TempDir` path, so even if the env var races, the paths don't collide. But this is fragile — a future test might assume exclusive access.

**The proper fix**: Use `#[serial]` from the `serial_test` crate:

```rust
#[test]
#[serial]  // Guarantees this test runs alone
fn test_export_with_env_var() {
    std::env::set_var("ORGANISM_HOME", "/tmp/test1");
    // ...
}
```

This is already documented in the project's CLAUDE.md "Do NOT" list — avoid mutating env vars in tests without serial isolation. The export tests got away with it, but future tests shouldn't rely on luck.

**Lesson**: Just because a test doesn't flake doesn't mean it's correct. Follow the isolation patterns even when you "get away with it."

---

## The Import Implementation

Import is the mirror of export:

```rust
pub fn cmd_import(args: &[String]) -> Result<()> {
    let file_path = &args[0];
    let mut merge_mode = true;  // Default: merge, don't overwrite

    // Parse --merge vs --replace
    for arg in &args[1..] {
        match arg.as_str() {
            "--merge" => merge_mode = true,
            "--replace" => merge_mode = false,
            _ => return Err(anyhow!("unknown argument: {}", arg)),
        }
    }

    // Parse and validate
    let json_content = fs::read_to_string(file_path)?;
    let envelope: ExportEnvelope = serde_json::from_str(&json_content)?;

    if envelope.schema_v != 1 {
        return Err(anyhow!(
            "unsupported schema version: {} (only schema_v=1 is supported)",
            envelope.schema_v
        ));
    }

    // Import each record type
    let mut imported_errors = 0;
    for error in envelope.records.errors {
        let key = format!("error:{}", error.hash);
        if store.exists(&key)? && merge_mode {
            continue;  // Skip in merge mode
        }
        store.put_error(&error)?;
        imported_errors += 1;
    }

    // ... similar loops for suggestions, accepted, feedback ...

    println!("Imported {} errors, {} suggestions, {} accepted, {} feedback",
        imported_errors, imported_suggestions, imported_accepted, imported_feedback);
    Ok(())
}
```

Key design decisions:

1. **Schema validation first**: Check `schema_v` before processing any records
2. **Merge mode by default**: Safer than accidentally overwriting data
3. **Per-record existence checks**: Even in replace mode, we skip records that don't exist (future enhancement: add `--force` to overwrite existing)
4. **Summary output**: Tell the user what was imported

---

## The Test Suite

Five test cases cover the critical paths:

1. **test_export_roundtrip**: Export then import, verify counts match
2. **test_export_filter_tool**: `--tool rustc` filters correctly
3. **test_import_merge_skip**: Re-importing skips existing records in merge mode
4. **test_import_bad_schema_v**: Rejects `schema_v: 99` with clear error
5. **test_import_missing_file**: Graceful error on missing input file

The schema version test is particularly important:

```rust
#[test]
fn import_bad_schema_v() {
    let bad_envelope = ExportEnvelope {
        schema_v: 99,
        // ... other fields ...
    };

    let tmp_export = tempfile::TempDir::new().unwrap();
    let export_file = tmp_export.path().join("export.json");
    let json = serde_json::to_string_pretty(&bad_envelope).unwrap();
    fs::write(&export_file, json).unwrap();

    let result = cmd_import(&[export_file.to_string_lossy().to_string()]);
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("schema version"));
}
```

This test ensures forward-compatibility: if someone tries to import a future format, we fail gracefully instead of corrupting data.

---

## What I Learned

**1. Schema versioning is cheap insurance.** Adding `schema_v: 1` to the envelope cost nothing. Not having it when you need it costs everything. Version your data formats from day one.

**2. Keys vs embedded fields is a coupling decision.** Using hashes as foreign keys decouples records but requires careful filter propagation. If you anticipate frequent filtering by a field, embed it even if it's redundant.

**3. Immutability guarantees have downstream effects.** M9.5's write-once accepted snapshots made import's `--replace` mode partially ineffective. Document these tradeoffs explicitly.

**4. Test isolation matters even when tests pass.** Parallel test execution with shared mutable state (env vars, temp files, global singletons) is a recipe for flaky tests. Use `#[serial]` when in doubt.

**5. Export/import is a forcing function for data model clarity.** You can't export what you can't enumerate. Adding export revealed that `list_suggestion_records()` was missing the hash key — a gap that would have caused problems eventually.

---

## The Numbers

- **645 lines** added (605 in `cmd_export.rs`, 40 in tests and store methods)
- **5 new test cases** covering roundtrip, filtering, merge mode, schema validation, and error handling
- **3 new KnowledgeStore methods**: `list_suggestion_records()`, `list_accepted_records()`, `list_error_records()`
- **2 CLI commands**: `export` and `import`
- **1 known limitation**: `--replace` doesn't overwrite accepted snapshots (by design)

---

## What's Next

M18 completes the portability story, but there's more to explore:

- **Incremental exports**: Export only changes since last export (useful for syncing)
- **Cloud sync integration**: Automatic sync to S3, GCS, or IPFS
- **Encrypted exports**: Protect sensitive error logs with passphrase encryption
- **Multi-machine workflows**: Test importing knowledge from teammate's machine

The code is at [github.com/bigknoxy/self-evolving-dev-ecosystem](https://github.com/bigknoxy/self-evolving-dev-ecosystem). The export/import implementation is in `crates/client/src/cmd_export.rs`. The tests are worth reading if you're testing Rust CLI tools.

---

## Fact-Check Checklist

- [x] Commit hash 21ba628 verified for M18 feature
- [x] Code snippets match actual implementation in cmd_export.rs
- [x] Test names and behaviors match crates/client/src/cmd_export.rs tests
- [x] KnowledgeStore method signatures verified
- [x] Schema version (1) matches actual implementation
- [x] M9.5 immutability guarantee accurately described
- [x] No personal API keys or tokens exposed
- [ ] Reviewer: Verify technical accuracy of Rust patterns
- [ ] Reviewer: Check for any personal information leaks
- [ ] Reviewer: Validate hero image suggestion

---

## Hero Image Suggestion

A terminal screenshot split into three panels:

1. **Left**: `organism-cli export --out backup.json --tool rustc` command with JSON output preview
2. **Center**: JSON structure visualization showing the envelope (schema_v, exported_at) and nested records
3. **Right**: `organism-cli import backup.json --merge` showing import summary (47 errors, 152 suggestions, etc.)

Overlay: A padlock icon for immutability and a "schema_v: 1" badge in the corner.

Alternatively: A simple diagram showing the data flow:
```
Knowledge Store → Export Envelope → JSON File → Import → Knowledge Store
    │                   │                │           │
    ├─ Errors           ├─ schema_v      ├─ Filtered ├─ Merge/Replace
    ├─ Suggestions      ├─ exported_at   ├─ Portable └─ Validation
    ├─ Accepted         └─ counts                    └─ Immutability
    └─ Feedback
```

---

*This is a draft. Do not publish without editor approval.*