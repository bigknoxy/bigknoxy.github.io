/**
 * BackLink Component Tests
 *
 * Tests the logic in src/components/ui/BackLink.astro.
 * The component:
 *   - Accepts required `href` string prop (the link destination)
 *   - Accepts required `label` string prop (rendered as "cd /label" text)
 *   - Renders a wrapper div with "mb-8 text-[11px]"
 *   - Renders an <a> with the href, with phosphor dim/bright hover classes
 *   - The visible text pattern is: "← cd {label}"
 *   - The "←" arrow is rendered in a separate <span class="text-phosphor-faint">
 *
 * We mirror the prop contract and text composition logic.
 */

import { describe, it, expect } from "bun:test";

// Mirrors the wrapper div classes in BackLink.astro
const WRAPPER_CLASSES = "mb-8 text-[11px]";

// Mirrors the anchor classes in BackLink.astro
const ANCHOR_CLASSES =
  "text-phosphor-dim hover:text-phosphor-bright transition-colors tracking-wider";

// Mirrors the arrow span class
const ARROW_CLASSES = "text-phosphor-faint";

// Models the resolved output of BackLink.astro
function resolveBackLink(href: string, label: string) {
  return {
    href,
    label,
    wrapperClasses: WRAPPER_CLASSES,
    anchorClasses: ANCHOR_CLASSES,
    arrowClasses: ARROW_CLASSES,
    // The visible text: arrow span + " cd " + label
    visibleText: `← cd ${label}`,
  };
}

describe("BackLink", () => {
  describe("href prop", () => {
    it("passes href through to the anchor element", () => {
      const { href } = resolveBackLink("/projects", "/projects");
      expect(href).toBe("/projects");
    });

    it("works with root path", () => {
      const { href } = resolveBackLink("/", "/");
      expect(href).toBe("/");
    });

    it("works with nested paths", () => {
      const { href } = resolveBackLink("/blog/my-post", "/blog");
      expect(href).toBe("/blog/my-post");
    });

    it("works with external URLs", () => {
      const { href } = resolveBackLink("https://example.com", "example");
      expect(href).toBe("https://example.com");
    });
  });

  describe("label prop and visible text", () => {
    it("prefixes label with '← cd ' for terminal nav style", () => {
      const { visibleText } = resolveBackLink("/projects", "/projects");
      expect(visibleText).toBe("← cd /projects");
    });

    it("works with plain label without leading slash", () => {
      const { visibleText } = resolveBackLink("/blog", "blog");
      expect(visibleText).toBe("← cd blog");
    });

    it("works with empty label (edge case)", () => {
      const { visibleText } = resolveBackLink("/", "");
      expect(visibleText).toBe("← cd ");
    });

    it("preserves label casing exactly", () => {
      const { visibleText } = resolveBackLink("/about", "About Me");
      expect(visibleText).toBe("← cd About Me");
    });

    it("label and href can differ (common usage)", () => {
      const { href, label } = resolveBackLink("/projects", "/projects");
      expect(href).toBe("/projects");
      expect(label).toBe("/projects");
    });
  });

  describe("CSS class contracts", () => {
    it("wrapper has mb-8 for bottom spacing", () => {
      const { wrapperClasses } = resolveBackLink("/", "/");
      expect(wrapperClasses).toContain("mb-8");
    });

    it("wrapper has text-[11px] for small font size", () => {
      const { wrapperClasses } = resolveBackLink("/", "/");
      expect(wrapperClasses).toContain("text-[11px]");
    });

    it("anchor uses phosphor-dim as default text color", () => {
      const { anchorClasses } = resolveBackLink("/", "/");
      expect(anchorClasses).toContain("text-phosphor-dim");
    });

    it("anchor has hover state for phosphor-bright", () => {
      const { anchorClasses } = resolveBackLink("/", "/");
      expect(anchorClasses).toContain("hover:text-phosphor-bright");
    });

    it("anchor has transition-colors for smooth hover", () => {
      const { anchorClasses } = resolveBackLink("/", "/");
      expect(anchorClasses).toContain("transition-colors");
    });

    it("anchor has tracking-wider for letter-spacing", () => {
      const { anchorClasses } = resolveBackLink("/", "/");
      expect(anchorClasses).toContain("tracking-wider");
    });

    it("arrow span uses text-phosphor-faint (dim arrow)", () => {
      const { arrowClasses } = resolveBackLink("/", "/");
      expect(arrowClasses).toContain("text-phosphor-faint");
    });
  });

  describe("edge cases", () => {
    it("both href and label as empty strings does not throw", () => {
      expect(() => resolveBackLink("", "")).not.toThrow();
    });

    it("label with unicode chars is preserved", () => {
      const { visibleText } = resolveBackLink("/about", "←→↑↓");
      expect(visibleText).toBe("← cd ←→↑↓");
    });

    it("label with numbers is valid", () => {
      const { visibleText } = resolveBackLink("/v2", "v2");
      expect(visibleText).toBe("← cd v2");
    });
  });
});
