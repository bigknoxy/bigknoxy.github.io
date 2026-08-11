---
title: "The Slash That Broke CI/CD: How One Character Failed 100% of Repositories"
description: "A Python regex analyst missed GitHub Actions workflows because of a missing '/' prefix in a string comparison. Here's how a one-character typo shipped to production and how adding CI/CD to the tool itself finally caught it."
pubDate: 2026-07-14
draft: true
tags: ["python", "debugging", "testing", "github-actions", "ghAuto", "lessons"]
heroImage: "/assets/images/blog/ghauto-ci-detection-bug.png"
---

# The Slash That Broke CI/CD

*Or: How One Missing Character Made Every Repository Look Like It Had No CI/CD*

Last month, a simple typo in [ghAuto](https://github.com/bigknoxy/ghAuto) — a Python CLI tool that analyzes GitHub repositories for health issues — caused the tool to tell users their repositories had no CI/CD configuration, even when they had full GitHub Actions workflows with multiple YAML files.

The bug was in the repository analyzer: a missing `/` prefix in a string comparison. The code checked if `".github"` existed in a list, but every item in that list started with `/` — `"/.github"`, `"/README.md"`, etc. This one-character mistake meant 100% of repositories with GitHub Actions were incorrectly flagged as having no CI/CD.

Here's what happened, why it was so hard to catch, and how the fix led to ironic improvements.

---

## The Setup

ghAuto is a Python CLI tool and dashboard that analyzes GitHub repositories for common maintenance issues: missing documentation, outdated dependencies, lack of tests, and no CI/CD. It uses the GitHub API to inspect repository contents and generates a health score with actionable recommendations.

The analyzer works like this:

```python
async def _check_ci_cd(self, owner: str, repo: str) -> dict:
    contents = await self.client.get_repository_contents(owner, repo, "")
    paths = ["/" + f["name"] for f in contents]
    
    # Check for .github/workflows
    if ".github" in paths:  # ← BUG: missing '/' prefix
        # ... check for workflow files
```

The code fetches the root directory listing, builds a list of paths with `/` prefixes, then checks if specific CI/CD indicators exist.

Simple enough. Except it wasn't working.

---

## The Bug

Look at the path construction again:

```python
paths = ["/" + f["name"] for f in contents]
```

Every path in the list starts with `/`:
- `/README.md`
- `/src/`
- `/.github/`
- `/pyproject.toml`

But the check was:

```python
if ".github" in paths:  # Checking for ".github" not "/.github"
```

The string `".github"` does not match `"/.github"`. So the condition was always `False`, even when the `.github` directory existed.

The same bug affected other CI/CD detection checks:
- `".circleci"` instead of `"/.circleci"`
- `".travis.yml"` instead of `"/.travis.yml"`
- `"Jenkinsfile"` instead of `"/Jenkinsfile"`

Every single CI/CD check was broken.

---

## The Fix

The fix commit [95c4f08](https://github.com/bigknoxy/ghAuto/commit/95c4f08) on May 19, 2026 changed four lines:

```diff
- if ".github" in paths:
+ if "/.github" in paths:

- for ci_file in [".travis.yml", "azure-pipelines.yml", "Jenkinsfile"]:
+ for ci_file in ["/.travis.yml", "/azure-pipelines.yml", "/Jenkinsfile"]:

- if ".circleci" in paths:
+ if "/.circleci" in paths:
```

Four lines changed. Six characters added. But the bug had been shipping for weeks.

---

## Why Wasn't This Caught?

The bug shipped because of a perfect storm of testing gaps:

### 1. No Unit Tests for the Analyzer

The `_check_ci_cd()` function had no tests asserting that it correctly detected `.github` directories when present. The only tests focused on error handling and API mocking.

### 2. Mocked Data Mirrored the Bug

Integration tests used mocked GitHub API responses, but the mock data didn't include the `/` prefix either — so the tests passed even though the logic was wrong:

```python
mock_client.get_repository_contents.return_value = [
    {"name": ".github", "type": "dir"},  # Mock data without / prefix
]
```

The test checked if `".github" in paths`, which matched the buggy code perfectly.

### 3. Manual Testing on Healthy Repos

I tested the tool on my own repositories, but they all already had CI/CD configured. The tool's output just confirmed what I already knew, so I didn't notice the detection was broken.

---

## The Irony: ghAuto Had No CI/CD

The fix was merged in PR #11 along with:
- A new GitHub Actions workflow for ghAuto itself (pytest, ruff, mypy)
- Dependabot configuration for weekly dependency updates
- CONTRIBUTING.md and CODE_OF_CONDUCT.md files

The irony is thick: a tool that tells other repositories to add CI/CD didn't have CI/CD itself.

The new workflow (`.github/workflows/ci.yml`) tests against Python 3.10, 3.11, and 3.12:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
      - name: Install dependencies
        run: pip install -e ".[dev]"
      - name: Lint with ruff
        run: ruff check src/ tests/
      - name: Run tests
        run: pytest -v --tb=short
```

---

## The Real Fix: Tests

Commit [95c4f08](https://github.com/bigknoxy/ghAuto/commit/95c4f08) included this note:

> This fix ensures that repositories with GitHub Actions workflows are correctly identified as having CI/CD configured.

But the *real* fix was adding tests to prevent regression:

```python
async def test_check_ci_cd_detects_github_actions():
    """Verify that .github directories are correctly detected."""
    mock_client = MockGitHubClient()
    mock_client.get_repository_contents.return_value = [
        {"name": ".github", "type": "dir"},
        {"name": "README.md", "type": "file"},
    ]
    
    analyzer = RepositoryAnalyzer(mock_client)
    result = await analyzer._check_ci_cd("owner", "repo")
    
    assert result["has_ci"] is True  # This would have failed before
    assert result["ci_type"] == "GitHub Actions"
```

The test would have caught the bug immediately. It wasn't there.

---

## Lessons

### 1. Test the Positive Case

Don't just test "no CI/CD detected" — test that CI/CD IS detected when it exists. This is a classic mistake: we test the happy path (no errors when valid input) but forget to test the detection path (does our logic actually recognize valid input?).

### 2. Prefixes Matter

When you build paths programmatically, be consistent about leading slashes. Consider using `pathlib` instead of string concatenation:

```python
from pathlib import PurePosixPath

# Better: explicit path construction
paths = {PurePosixPath("/") / f["name"] for f in contents}

if PurePosixPath("/.github") in paths:
    ...
```

### 3. Dogfood Your Health Checks

If you build a tool that checks for CI/CD, add CI/CD to your own repo and verify your tool detects it correctly. This is the "eating your own dogfood" principle — use your tool on yourself first.

After the fix, running `ghAuto analyze` on the ghAuto repo itself now correctly reports:

```
✓ CI/CD: GitHub Actions detected (ci.yml)
```

### 4. Mocks Can Lie

Mocked data that mirrors your buggy logic will give you passing tests and broken code. Always verify your mocks match real API responses — or better yet, test against real data periodically.

### 5. One-Character Bugs Hide Best in Simple Code

Complex code gets scrutiny. Simple code gets assumed correct. This bug was in a three-line list comprehension and a single `if` statement — the kind of code you write without thinking, which is exactly when you should think the most.

---

## Verification Checklist

If you're reviewing this post or want to verify the fix:

- [ ] Clone ghAuto: `git clone https://github.com/bigknoxy/ghAuto`
- [ ] Check the fix commit: `git show 95c4f08`
- [ ] Verify PR #11 merged the fix along with CI/CD for ghAuto itself
- [ ] Run tests: `pytest tests/test_analyzer.py -v`
- [ ] Check that `test_check_ci_cd_detects_github_actions` passes
- [ ] Install and analyze a repo with GitHub Actions: `./ghAuto analyze owner/repo`
- [ ] Verify it detects CI/CD correctly

---

## Hero Image Suggestion

A split-screen terminal comparison:

**Left side (before fix):**
```
$ ghauto analyze bigknoxy/ghAuto

Repository Health Score: 65/100

Issues Found:
✗ No CI/CD configuration detected
  Recommendation: Add GitHub Actions workflow in .github/workflows/
```

**Right side (after fix):**
```
$ ghauto analyze bigknoxy/ghAuto

Repository Health Score: 85/100

Issues Found:
✓ CI/CD: GitHub Actions detected (ci.yml)
✓ Tests: pytest detected
```

**Center:** A magnifying glass highlighting the missing `/` in the original code.

**Color scheme:** GitHub dark theme (dimmed background, green checkmarks on right, red X on left).

---

## Post-Mortem Timeline

| Date | Event |
|------|-------|
| May 19, 2026 | Bug fix committed (95c4f08) |
| May 23, 2026 | PR #11 merged with CI/CD for ghAuto itself |
| July 10, 2026 | Draft blog post created on bigknoxy.github.io |
| July 14, 2026 | This post written with verified technical details |

---

*Have you shipped a one-character bug? I'd love to hear about it. Find me at [@bigknoxy](https://x.com/bigknoxy).*