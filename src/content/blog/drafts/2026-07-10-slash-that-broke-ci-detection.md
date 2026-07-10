---
title: "The Slash That Broke CI/CD Detection: A One-Character Bug"
description: "A repository analyzer missed GitHub Actions workflows because of a missing '/' prefix. Here's how a one-character typo slipped through testing and affected 100% of analyzed repos."
pubDate: 2026-07-10
draft: true
tags: ["python", "debugging", "testing", "github-actions", "ghAuto"]
heroImage: "/assets/images/blog/ci-detection-bug.png"
---

# The Slash That Broke CI/CD Detection

*Or: How One Missing Character Made Every Repository Look Like It Had No CI/CD*

Last week, users of [ghAuto](https://github.com/bigknoxy/ghAuto) reported something strange: the tool was telling them their repositories had no CI/CD configuration, even when they had full GitHub Actions workflows with multiple YAML files.

The bug was in the repository analyzer — a one-character typo that caused `"/.github"` to be checked as `".github"`. Every repository with GitHub Actions was being incorrectly flagged as having no CI/CD.

Here's what happened, and why this kind of bug is so hard to catch.

---

## The Setup

ghAuto is a Python CLI tool that analyzes GitHub repositories for health issues: missing documentation, outdated dependencies, lack of tests, and no CI/CD. It uses the GitHub API to inspect repository contents and generates a health score with actionable recommendations.

The analyzer works like this:

```python
async def _check_ci_cd(self, owner: str, repo: str) -> dict:
    contents = await self.client.get_repository_contents(owner, repo, "")
    paths = ["/" + f["name"] for f in contents]
    
    # Check for .github/workflows
    if ".github" in paths:  # ← BUG: missing '/' prefix
        # ... check for workflow files
```

The code fetches the root directory listing, builds a list of paths with `/` prefixes, then checks if specific paths exist.

Simple enough. Except it wasn't working.

---

## The Bug

Look at this line again:

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

The same bug affected other checks:
- `".circleci"` instead of `"/.circleci"`
- `".travis.yml"` instead of `"/.travis.yml"`
- `"Jenkinsfile"` instead of `"/Jenkinsfile"`

Every single CI/CD detection was broken for repositories using these tools.

---

## The Fix

The fix was trivial — add the missing `/` prefix:

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

This is the embarrassing part. The bug shipped because:

1. **No unit tests for the analyzer**: The `_check_ci_cd()` function had no tests asserting that it correctly detected `.github` directories.

2. **Integration tests used mocked data**: The existing tests mocked the GitHub API response, but the mock data didn't include the `/` prefix either — so the tests passed even though the logic was wrong.

3. **Manual testing was sparse**: I tested the tool on my own repositories, but they all had CI/CD so I didn't notice the detection was broken — the tool was just telling me what I already knew.

The fix commit (95c4f08) included a note:

> This fix ensures that repositories with GitHub Actions workflows are correctly identified as having CI/CD configured.

But the real fix was adding actual tests:

```python
async def test_check_ci_cd_detects_github_actions():
    mock_client = MockGitHubClient()
    mock_client.get_repository_contents.return_value = [
        {"name": ".github", "type": "dir"},
        {"name": "README.md", "type": "file"},
    ]
    analyzer = RepositoryAnalyzer(mock_client)
    result = await analyzer._check_ci_cd("owner", "repo")
    assert result["has_ci"] is True  # This would have failed before
```

---

## The Aftermath

The fix was merged in PR #11 along with:
- A new GitHub Actions workflow for ghAuto itself (pytest, ruff, mypy)
- Dependabot configuration for weekly dependency updates
- CONTRIBUTING.md and CODE_OF_CONDUCT.md files

The irony is thick: a tool that tells other repositories to add CI/CD didn't have CI/CD itself.

---

## Lessons

1. **Test the positive case**: Don't just test "no CI/CD detected" — test that CI/CD IS detected when it exists.

2. **Prefixes matter**: When you build paths programmatically, be consistent about leading slashes. Consider using `pathlib` instead of string concatenation.

3. **Dogfood your health checks**: If you build a tool that checks for CI/CD, add CI/CD to your own repo and verify your tool detects it correctly.

4. **Mocks can lie**: Mocked data that mirrors your buggy logic will give you passing tests and broken code.

---

## Fact-Check Checklist

- [ ] Verify the commit hash: 95c4f08 (May 19, 2026)
- [ ] Confirm the bug affected four checks: `.github`, `.circleci`, `.travis.yml`, `Jenkinsfile`
- [ ] Verify PR #11 merged the fix along with CI/CD for ghAuto itself
- [ ] Check that test assertions match the actual code paths
- [ ] Verify ghAuto repo URL: https://github.com/bigknoxy/ghAuto

---

## Hero Image Suggestion

A split-screen showing:
- Left: Terminal output showing "No CI/CD detected" (before fix)
- Right: Terminal output showing "CI/CD: GitHub Actions detected" (after fix)
- Middle: Magnifying glass highlighting the missing `/` in the code

Color scheme: GitHub dark theme (dimmed background, green checkmarks on right, red X on left)

---

*Have you shipped a one-character bug? I'd love to hear about it. Find me at [@bigknoxy](https://x.com/bigknoxy).*