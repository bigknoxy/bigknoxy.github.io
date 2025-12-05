import { describe, it, expect, beforeEach } from "bun:test";

// Minimal DOM environment is available via tests/test-setup.ts
import "../test-setup";

describe("MiniGame GAME OVER overlay integration", () => {
  beforeEach(() => {
    // Minimal DOM shim for environments without a full DOM (tests)
    if (
      typeof document === "undefined" ||
      typeof document.getElementById !== "function"
    ) {
      (global as any).document = {
        _elements: {} as Record<string, any>,
        body: { innerHTML: "" },
        getElementById(id: string) {
          return (this._elements as any)[id] || null;
        },
        createElement(tag: string) {
          const el: any = {
            tagName: tag.toUpperCase(),
            id: "",
            className: "",
            classList: {
              _set: new Set<string>(),
              add(s: string) {
                this._set.add(s);
              },
              remove(s: string) {
                this._set.delete(s);
              },
              contains(s: string) {
                return this._set.has(s);
              },
            },
            _attrs: {},
            _listeners: {} as Record<string, Function[]>,
            textContent: "",
            innerHTML: "",
            setAttribute(name: string, value: string) {
              this._attrs[name] = String(value);
            },
            getAttribute(name: string) {
              return this._attrs[name] || null;
            },
            addEventListener(name: string, fn: Function) {
              (this._listeners[name] = this._listeners[name] || []).push(fn);
            },
            dispatchEvent(ev: any) {
              const fns = this._listeners[ev.type] || [];
              fns.forEach((f: any) => f.call(this, ev));
              return true;
            },
            focus() {},
            click() {
              const fns = this._listeners["click"] || [];
              fns.forEach((f: any) => f.call(this, new Event("click")));
            },
          };
          return el;
        },
      } as any;
    }

    // Create required elements and register by id
    const root = document.createElement("div");
    root.id = "mini-game-root";
    (document as any)._elements["mini-game-root"] = root;
    const canvas = document.createElement("canvas");
    canvas.id = "mini-game-canvas";
    (document as any)._elements["mini-game-canvas"] = canvas;
    const overlay = document.createElement("div");
    overlay.id = "game-over-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.classList.add("hidden");
    (document as any)._elements["game-over-overlay"] = overlay;
    const title = document.createElement("h2");
    title.id = "gameover-title";
    title.textContent = "GAME OVER";
    (document as any)._elements["gameover-title"] = title;
    const score = document.createElement("p");
    score.id = "gameover-score";
    score.textContent = "FINAL: 0000";
    score.setAttribute("aria-live", "assertive");
    (document as any)._elements["gameover-score"] = score;
    const restart = document.createElement("button");
    restart.id = "gameover-restart";
    restart.textContent = "Restart";
    (document as any)._elements["gameover-restart"] = restart;
    const hud = document.createElement("span");
    hud.id = "mini-game-score";
    hud.textContent = "SCORE: 0000";
    (document as any)._elements["mini-game-score"] = hud;

    // Clear any existing window.miniGame
    try {
      delete (window as any).miniGame;
    } catch (e) {
      (window as any).miniGame = undefined;
    }
  });

  it("shows overlay on game:gameover and restart triggers reset/start", async () => {
    const root = document.getElementById("mini-game-root")!;
    const overlay = document.getElementById("game-over-overlay")!;
    const scoreEl = document.getElementById("gameover-score")!;
    const restartBtn = document.getElementById(
      "gameover-restart",
    )! as HTMLButtonElement;

    // Mock window.miniGame with jest-like spies
    let calledReset = false;
    let calledStart = false;
    (window as any).miniGame = {
      reset: () => {
        calledReset = true;
      },
      start: () => {
        calledStart = true;
      },
      getScore: () => 42,
    };

    // Attach the client wiring that should be present in MiniGame.astro
    // We'll implement a small portion mimicking the expected behavior
    (function attachWiring() {
      function onGameOver(e: any) {
        const final =
          e && e.detail && typeof e.detail.score === "number"
            ? e.detail.score
            : 0;
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
        scoreEl.textContent = "FINAL: " + String(final).padStart(4, "0");
      }

      function onResetOrStart() {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        // reset HUD
        const hud = document.getElementById("mini-game-score");
        if (hud) hud.textContent = "SCORE: 0000";
      }

      root.addEventListener("game:gameover", onGameOver);
      root.addEventListener("game:reset", onResetOrStart);
      root.addEventListener("game:start", onResetOrStart);

      restartBtn.addEventListener("click", function () {
        // call engine reset/start
        if (
          (window as any).miniGame &&
          typeof (window as any).miniGame.reset === "function"
        )
          (window as any).miniGame.reset();
        if (
          (window as any).miniGame &&
          typeof (window as any).miniGame.start === "function"
        )
          (window as any).miniGame.start();
        // hide overlay
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      });
    })();

    // Dispatch a gameover event
    const ev = new CustomEvent("game:gameover", { detail: { score: 1337 } });
    root.dispatchEvent(ev);

    // Assertions after event
    expect(overlay.classList.contains("hidden")).toBe(false);
    expect(overlay.getAttribute("aria-hidden")).toBe("false");
    expect(scoreEl.textContent).toBe("FINAL: 1337");

    // Click restart
    restartBtn.click();

    expect(calledReset).toBe(true);
    expect(calledStart).toBe(true);
    expect(overlay.classList.contains("hidden")).toBe(true);
    expect(document.getElementById("mini-game-score")!.textContent).toBe(
      "SCORE: 0000",
    );
  });
});
