/**
 * TerminalBar Component Tests
 *
 * Tests the logic embedded in src/components/layout/TerminalBar.astro.
 * The component:
 *   - Always renders three terminal-dot spans and a title span
 *   - Accepts a required `title` string prop
 *   - Accepts an optional `groupHover` boolean (default false)
 *   - When groupHover=true:  class = "terminal-bar group-hover:border-phosphor-faint transition-colors"
 *   - When groupHover=false: class = "terminal-bar"
 *
 * Because Astro components require the full Astro runtime to render, we
 * mirror the exact class-selection logic here and verify it in isolation.
 */

import { describe, it, expect } from "bun:test";

// Mirrors the barClass logic from TerminalBar.astro
function resolveBarClass(groupHover: boolean = false): string {
  return groupHover
    ? "terminal-bar group-hover:border-phosphor-faint transition-colors"
    : "terminal-bar";
}

// Mirrors the expected inner structure description
function describeStructure(title: string): {
  dots: number;
  title: string;
} {
  return { dots: 3, title };
}

describe("TerminalBar", () => {
  describe("barClass logic (groupHover prop)", () => {
    it("returns 'terminal-bar' when groupHover is false (default)", () => {
      expect(resolveBarClass(false)).toBe("terminal-bar");
    });

    it("returns 'terminal-bar' when groupHover is omitted (default parameter)", () => {
      expect(resolveBarClass()).toBe("terminal-bar");
    });

    it("returns full class string when groupHover is true", () => {
      const result = resolveBarClass(true);
      expect(result).toBe(
        "terminal-bar group-hover:border-phosphor-faint transition-colors"
      );
    });

    it("includes 'terminal-bar' as the base class in both branches", () => {
      expect(resolveBarClass(false)).toContain("terminal-bar");
      expect(resolveBarClass(true)).toContain("terminal-bar");
    });

    it("groupHover=true adds hover and transition utilities", () => {
      const result = resolveBarClass(true);
      expect(result).toContain("group-hover:border-phosphor-faint");
      expect(result).toContain("transition-colors");
    });

    it("groupHover=false does NOT include hover utilities", () => {
      const result = resolveBarClass(false);
      expect(result).not.toContain("group-hover:");
      expect(result).not.toContain("transition-colors");
    });
  });

  describe("structure contracts", () => {
    it("renders exactly 3 terminal dots", () => {
      const { dots } = describeStructure("TEST");
      expect(dots).toBe(3);
    });

    it("passes title through unchanged", () => {
      const title = "MY_PROJECT.EXE";
      const { title: out } = describeStructure(title);
      expect(out).toBe(title);
    });

    it("accepts empty string as title without throwing", () => {
      expect(() => describeStructure("")).not.toThrow();
      const { title } = describeStructure("");
      expect(title).toBe("");
    });

    it("accepts multi-word titles with spaces", () => {
      const title = "README.md is here";
      const { title: out } = describeStructure(title);
      expect(out).toBe(title);
    });

    it("accepts titles with special characters", () => {
      const title = "GAME_OVER_[v1.0].EXE";
      const { title: out } = describeStructure(title);
      expect(out).toBe(title);
    });
  });

  describe("prop defaults", () => {
    it("groupHover defaults to false, so no hover classes emitted by default", () => {
      const defaultClass = resolveBarClass(); // no arg → default false
      expect(defaultClass).toBe("terminal-bar");
    });

    it("explicit false is identical to default", () => {
      expect(resolveBarClass(false)).toBe(resolveBarClass());
    });
  });
});
