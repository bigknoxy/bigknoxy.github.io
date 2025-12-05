/**
 * Test Bootstrap - Web Audio API Mocks for Node.js Environment
 * This file sets up mocks for browser APIs that aren't available in Node.js
 */

// Mock Web Audio API with minimal implementation
class MockAudioContext {
  public state: "suspended" | "running" | "closed" = "running";
  public currentTime: number = 0;
  public destination: any = {};

  createOscillator(): any {
    return {
      connect: () => {},
      disconnect: () => {},
      type: "sine",
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      start: () => {},
      stop: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  createGain(): any {
    return {
      connect: () => {},
      disconnect: () => {},
      gain: {
        value: 1,
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  async resume(): Promise<void> {
    this.state = "running";
  }

  async close(): Promise<void> {
    this.state = "closed";
  }

  addEventListener: () => void = () => {};
  removeEventListener: () => void = () => {};
}

// Mock window object for Node.js
if (typeof global !== "undefined") {
  // Web Audio API mocks
  (global as any).AudioContext = MockAudioContext;
  (global as any).webkitAudioContext = MockAudioContext;

  // Window performance mocks
  (global as any).window = {
    performance: {
      now: () => Date.now(),
    },
    requestAnimationFrame: (callback: FrameRequestCallback) =>
      setTimeout(callback, 16) as unknown as number,
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  // Also add requestAnimationFrame to global scope
  (global as any).requestAnimationFrame = (callback: FrameRequestCallback) =>
    setTimeout(callback, 16) as unknown as number;
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

  // Canvas mock for 2D context
  (global as any).HTMLCanvasElement = class MockCanvas {
    width = 240;
    height = 216;

    getContext(type: string) {
      if (type === "2d") {
        return {
          fillRect: () => {},
          clearRect: () => {},
          fillText: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          drawImage: () => {},
          imageSmoothingEnabled: false,
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          font: "",
          textAlign: "left",
          textBaseline: "top",
          globalAlpha: 1,
          createLinearGradient: () => ({
            addColorStop: () => {},
          }),
          arc: () => {},
          closePath: () => {},
          fill: () => {},
        };
      }
      return null;
    }
  };

  // EventTarget mock
  (global as any).EventTarget = class MockEventTarget {
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  };

  // localStorage mock
  const localStorageMock: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => localStorageMock[key] || null,
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageMock[key];
    },
    clear: () => {
      Object.keys(localStorageMock).forEach(
        (key) => delete localStorageMock[key],
      );
    },
    get length() {
      return Object.keys(localStorageMock).length;
    },
    key: (index: number) => Object.keys(localStorageMock)[index] || null,
  };

  // Document mock
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === "canvas") {
        return new (global as any).HTMLCanvasElement();
      }
      return {
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
    },
  };
}

console.log("Test bootstrap loaded - Web Audio API mocks initialized");
