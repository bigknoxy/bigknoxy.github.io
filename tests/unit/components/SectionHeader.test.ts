/**
 * SectionHeader Component Tests
 *
 * Tests the logic in src/components/layout/SectionHeader.astro.
 * The component:
 *   - Accepts required `label` string
 *   - Accepts optional `linkHref` and `linkText` strings
 *   - Accepts optional `marginClass` (default "mb-10")
 *   - Conditionally renders an <a> only when BOTH linkHref AND linkText are provided
 *   - Always renders the label span and a section-rule div
 *
 * We mirror the conditional-render and class-composition logic here.
 */

import { describe, it, expect } from "bun:test";

// Mirrors the wrapper class composition from SectionHeader.astro
function resolveWrapperClass(marginClass: string = "mb-10"): string {
  return `flex items-center gap-5 ${marginClass}`;
}

// Mirrors the link conditional from SectionHeader.astro
function shouldRenderLink(
  linkHref?: string,
  linkText?: string
): boolean {
  return Boolean(linkHref && linkText);
}

// Represents the full resolved prop set (mirrors what Astro.props destructuring does)
function resolveProps(props: {
  label: string;
  linkHref?: string;
  linkText?: string;
  marginClass?: string;
}) {
  return {
    label: props.label,
    linkHref: props.linkHref,
    linkText: props.linkText,
    marginClass: props.marginClass ?? "mb-10",
  };
}

describe("SectionHeader", () => {
  describe("marginClass prop and wrapper class", () => {
    it("defaults to 'mb-10' when marginClass is not provided", () => {
      const cls = resolveWrapperClass();
      expect(cls).toContain("mb-10");
    });

    it("uses the provided marginClass value", () => {
      const cls = resolveWrapperClass("mb-16");
      expect(cls).toContain("mb-16");
    });

    it("always includes flex layout utilities", () => {
      const cls = resolveWrapperClass();
      expect(cls).toContain("flex");
      expect(cls).toContain("items-center");
      expect(cls).toContain("gap-5");
    });

    it("custom marginClass replaces the default, not appended twice", () => {
      const cls = resolveWrapperClass("mb-0");
      expect(cls).not.toContain("mb-10");
      expect(cls).toContain("mb-0");
    });

    it("accepts zero-margin utility class", () => {
      const cls = resolveWrapperClass("mb-0");
      expect(cls).toContain("mb-0");
    });
  });

  describe("link conditional rendering", () => {
    it("renders link when both linkHref and linkText are provided", () => {
      expect(shouldRenderLink("/projects", "VIEW ALL")).toBe(true);
    });

    it("does NOT render link when only linkHref is provided", () => {
      expect(shouldRenderLink("/projects", undefined)).toBe(false);
    });

    it("does NOT render link when only linkText is provided", () => {
      expect(shouldRenderLink(undefined, "VIEW ALL")).toBe(false);
    });

    it("does NOT render link when both are omitted", () => {
      expect(shouldRenderLink()).toBe(false);
    });

    it("does NOT render link when linkHref is empty string", () => {
      expect(shouldRenderLink("", "VIEW ALL")).toBe(false);
    });

    it("does NOT render link when linkText is empty string", () => {
      expect(shouldRenderLink("/projects", "")).toBe(false);
    });

    it("does NOT render link when both are empty strings", () => {
      expect(shouldRenderLink("", "")).toBe(false);
    });
  });

  describe("prop defaults via resolveProps", () => {
    it("marginClass defaults to 'mb-10' when absent", () => {
      const props = resolveProps({ label: "PROJECTS" });
      expect(props.marginClass).toBe("mb-10");
    });

    it("linkHref and linkText are undefined when not provided", () => {
      const props = resolveProps({ label: "PROJECTS" });
      expect(props.linkHref).toBeUndefined();
      expect(props.linkText).toBeUndefined();
    });

    it("label passes through without modification", () => {
      const props = resolveProps({ label: "FEATURED WORK" });
      expect(props.label).toBe("FEATURED WORK");
    });

    it("all provided props are preserved", () => {
      const props = resolveProps({
        label: "BLOG",
        linkHref: "/blog",
        linkText: "VIEW ALL POSTS",
        marginClass: "mb-6",
      });
      expect(props.label).toBe("BLOG");
      expect(props.linkHref).toBe("/blog");
      expect(props.linkText).toBe("VIEW ALL POSTS");
      expect(props.marginClass).toBe("mb-6");
    });
  });

  describe("label content", () => {
    it("accepts uppercase labels", () => {
      const props = resolveProps({ label: "FEATURED PROJECTS" });
      expect(props.label).toBe("FEATURED PROJECTS");
    });

    it("accepts labels with slashes (terminal style)", () => {
      const props = resolveProps({ label: "~/projects" });
      expect(props.label).toBe("~/projects");
    });

    it("accepts empty string as label (edge case)", () => {
      const props = resolveProps({ label: "" });
      expect(props.label).toBe("");
    });
  });
});
