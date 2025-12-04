---
Bug: Search excerpts include HTML <mark> tags instead of sanitized text
Date: 2025-12-03
Location: src/components/ui/SearchBar.astro (SearchBar rendering of excerpt)
Repro: Type a query (e.g., 'jeet') in SearchBar; results show excerpt with literal '<mark>' tags.
Severity: Minor UI/UX (affects rendering/HTML safety)
Suggested fix: Sanitize excerpts to strip/escape HTML tags or render highlights safely; prioritize after game implementation.
---
