import { describe, it, expect, beforeEach } from "bun:test";
import { RenderSystem } from "../../src/game/systems/RenderSystem";

// Minimal mock canvas context capturing text draw calls
class MockCtx {
  public calls: Array<{
    text: string;
    x: number;
    y: number;
    font: string;
    align: string;
    baseline: string;
  }> = [];
  public fillStyle: string = "";
  public font: string = "";
  public textAlign: any = "left";
  public textBaseline: any = "top";

  fillRect(x: number, y: number, w: number, h: number) {
    // noop
  }
  measureText(text: string) {
    return {
      width: text.length * 6,
      actualBoundingBoxAscent: 6,
      actualBoundingBoxDescent: 2,
    } as any;
  }
  fillText(text: string, x: number, y: number) {
    this.calls.push({
      text,
      x,
      y,
      font: this.font,
      align: this.textAlign,
      baseline: this.textBaseline,
    });
  }
}

describe("RenderSystem GAME OVER centering", () => {
  let ctx: MockCtx;
  let rs: RenderSystem;

  beforeEach(() => {
    ctx = new MockCtx();
    rs = new RenderSystem(ctx as any, 240, 216, {
      pixelated: true,
      showFPS: false,
      showHitboxes: false,
      doubleBuffering: false,
    });
  });

  it("drawGameOver should center title and score using canvas internal resolution", () => {
    rs.drawGameOver(42);

    // Find GAME OVER call
    const titleCall = ctx.calls.find((c) => c.text === "GAME OVER");
    const scoreCall = ctx.calls.find(
      (c) => c.text && c.text.startsWith("FINAL"),
    );

    expect(titleCall).toBeDefined();
    expect(scoreCall).toBeDefined();

    // Expect x to be canvas center (240/2 = 120)
    expect(titleCall!.x).toBe(120);
    expect(scoreCall!.x).toBe(120);

    // Score should be below title (y greater than title y)
    expect(scoreCall!.y).toBeGreaterThan(titleCall!.y);
  });

  it("computes responsive font sizes within expected range", () => {
    // small canvas
    rs.resize(160, 120);
    rs.drawGameOver(7);
    const titleSmall = ctx.calls.find((c) => c.text === "GAME OVER");
    expect(titleSmall!.font).toMatch(/\d+px/);

    // larger canvas
    ctx.calls = [];
    rs.resize(800, 600);
    rs.drawGameOver(1234);
    const titleLarge = ctx.calls.find((c) => c.text === "GAME OVER");
    expect(titleLarge!.font).not.toEqual(titleSmall!.font);
  });
});
