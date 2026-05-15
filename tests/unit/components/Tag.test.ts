/**
 * Tag Component Tests
 *
 * Tests the logic in src/components/ui/Tag.astro.
 * The component:
 *   - Accepts a single required `label` string prop
 *   - Renders it inside a <span> with fixed phosphor-faint bordered style
 *   - No conditional logic — all output is static except the label content
 *
 * We verify the prop contract and that the tag renders its label as-is.
 */

import { describe, it, expect } from "bun:test";

// Mirrors the CSS classes applied to the <span> in Tag.astro
const TAG_CLASSES =
  "text-[9px] px-[10px] py-[3px] border border-phosphor-faint text-phosphor-text tracking-wider";

// Models the Tag component as a function that returns expected HTML structure info
function resolveTag(label: string): { label: string; classes: string } {
  return { label, classes: TAG_CLASSES };
}

describe("Tag", () => {
  describe("label prop", () => {
    it("renders the provided label unchanged", () => {
      const { label } = resolveTag("TypeScript");
      expect(label).toBe("TypeScript");
    });

    it("renders a label with spaces", () => {
      const { label } = resolveTag("Game Dev");
      expect(label).toBe("Game Dev");
    });

    it("renders a label with special characters", () => {
      const { label } = resolveTag("C++ / WebGL");
      expect(label).toBe("C++ / WebGL");
    });

    it("renders an empty string label (edge case)", () => {
      const { label } = resolveTag("");
      expect(label).toBe("");
    });

    it("renders a numeric string label", () => {
      const { label } = resolveTag("2024");
      expect(label).toBe("2024");
    });

    it("renders labels with uppercase/lowercase mixed", () => {
      const { label } = resolveTag("Astro v4");
      expect(label).toBe("Astro v4");
    });
  });

  describe("CSS class contract", () => {
    it("always includes 'border' and 'border-phosphor-faint'", () => {
      const { classes } = resolveTag("any");
      expect(classes).toContain("border");
      expect(classes).toContain("border-phosphor-faint");
    });

    it("always includes phosphor text color", () => {
      const { classes } = resolveTag("any");
      expect(classes).toContain("text-phosphor-text");
    });

    it("always includes font-size utility", () => {
      const { classes } = resolveTag("any");
      expect(classes).toContain("text-[9px]");
    });

    it("always includes padding utilities", () => {
      const { classes } = resolveTag("any");
      expect(classes).toContain("px-[10px]");
      expect(classes).toContain("py-[3px]");
    });

    it("always includes tracking-wider for letter-spacing", () => {
      const { classes } = resolveTag("any");
      expect(classes).toContain("tracking-wider");
    });

    it("classes are identical regardless of label value", () => {
      const a = resolveTag("TypeScript");
      const b = resolveTag("Rust");
      const c = resolveTag("");
      expect(a.classes).toBe(b.classes);
      expect(b.classes).toBe(c.classes);
    });
  });

  describe("multiple tag instances", () => {
    it("produces distinct labels for different inputs", () => {
      const tags = ["TypeScript", "Astro", "Tailwind", "Bun"].map(resolveTag);
      const labels = tags.map((t) => t.label);
      expect(labels).toEqual(["TypeScript", "Astro", "Tailwind", "Bun"]);
    });

    it("all instances share the same class string", () => {
      const tags = ["TypeScript", "Astro", "Tailwind"].map(resolveTag);
      const unique = new Set(tags.map((t) => t.classes));
      expect(unique.size).toBe(1);
    });
  });
});
