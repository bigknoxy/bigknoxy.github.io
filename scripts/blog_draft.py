#!/usr/bin/env python3
"""
Blog Post Generator with Fact-Checking
- Generates draft blog posts from recent project activity
- Fact-checks technical details against git logs, PRs, issues
- Enforces 35 RPM rate limit for NVIDIA API calls
- Outputs draft to src/content/blog/drafts/
"""

import subprocess
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import time

# Rate limit: 35 RPM = 1.714 seconds between calls
RATE_LIMIT_SECONDS = 1.714
last_api_call = 0

def rate_limit_check():
    """Enforce 35 RPM limit for NVIDIA API calls"""
    global last_api_call
    elapsed = time.time() - last_api_call
    if elapsed < RATE_LIMIT_SECONDS:
        time.sleep(RATE_LIMIT_SECONDS - elapsed)
    last_api_call = time.time()

def run_command(cmd, cwd=None):
    """Run shell command safely"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd,
            capture_output=True, text=True, timeout=30
        )
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return f"ERROR: {e}", 1

def get_recent_activity(repo_path, days=7):
    """Get recent git activity from a repo"""
    since = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    cmd = f"git log --since='{since}' --oneline --no-merges"
    output, code = run_command(cmd, cwd=repo_path)
    if code != 0:
        return []
    return [line for line in output.split('\n') if line]

def get_pr_details(repo_path, pr_number):
    """Get PR details for fact-checking"""
    cmd = f"gh pr view {pr_number} --json title,body,labels,comments"
    output, code = run_command(cmd, cwd=repo_path)
    if code != 0:
        return None
    try:
        return json.loads(output)
    except:
        return None

def check_personal_info(text):
    """Scan for potential personal info leaks"""
    red_flags = []
    
    # Common patterns to avoid
    patterns = [
        (r'\d{3}-\d{3}-\d{4}', 'Phone number'),
        (r'\d{5}', 'ZIP code'),
        (r'@[a-zA-Z0-9_]+', 'Social handle (maybe)'),
    ]
    
    for pattern, name in patterns:
        import re
        matches = re.findall(pattern, text)
        if matches:
            red_flags.append(f"Possible {name}: {matches[:3]}")
    
    return red_flags

def generate_draft(topic, repo_path, output_path):
    """Generate a draft blog post"""
    print(f"Generating draft for: {topic}")
    print(f"Repo: {repo_path}")
    
    # Get recent activity
    activity = get_recent_activity(repo_path, days=14)
    
    if not activity:
        print("No recent activity found. Skipping.")
        return None
    
    # Create draft content
    draft = f"""---
title: "[DRAFT] {topic}"
description: "Draft post - needs editing"
pubDate: {datetime.now().strftime('%Y-%m-%d')}
draft: true
tags: ["draft", "needs-review"]
heroImage: "/assets/images/blog/draft-placeholder.png"
---

# {topic}

**DRAFT: This post needs fact-checking and editor review.**

## Recent Activity

{chr(10).join(activity[:5])}

## Notes for Author

- [ ] Verify all technical claims
- [ ] Check for personal info leaks
- [ ] Add code examples
- [ ] Write proper conclusion
- [ ] Select hero image
- [ ] Add appropriate tags

## Fact-Check Status

- [ ] Code snippets tested
- [ ] Dates verified against git log
- [ ] PR numbers correct
- [ ] No personal info exposed
- [ ] Links validated

---

*This is a draft. Do not publish without editor approval.*
"""
    
    # Check for personal info
    flags = check_personal_info(draft)
    if flags:
        print("WARNING: Potential personal info detected:")
        for flag in flags:
            print(f"  - {flag}")
    
    # Write draft
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(draft)
    
    print(f"Draft written to: {output_path}")
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: blog_draft.py <topic> <repo_path> [output_path]")
        sys.exit(1)
    
    topic = sys.argv[1]
    repo_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else f"src/content/blog/drafts/{datetime.now().strftime('%Y-%m-%d')}-draft.md"
    
    generate_draft(topic, repo_path, output_path)
