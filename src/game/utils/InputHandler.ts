/**
 * Input Handler - Manages keyboard and touch input
 */

import type { InputState } from "../types/GameTypes";

export class InputHandler {
  private keys: InputState;
  private callbacks: Map<string, (() => void)[]>;
  private isInitialized: boolean = false;

  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      pause: false,
    };
    this.callbacks = new Map();
  }

  /**
   * Initialize input handlers (call this when DOM is ready)
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    // Keyboard events
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Touch events for mobile
    window.addEventListener("touchstart", this.handleTouchStart.bind(this));
    window.addEventListener("touchend", this.handleTouchEnd.bind(this));

    // Mouse events as fallback
    window.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Prevent context menu on long press
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    this.isInitialized = true;
  }

  /**
   * Cleanup input handlers
   */
  public destroy(): void {
    if (typeof window === "undefined") return;

    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    window.removeEventListener("keyup", this.handleKeyUp.bind(this));
    window.removeEventListener("touchstart", this.handleTouchStart.bind(this));
    window.removeEventListener("touchend", this.handleTouchEnd.bind(this));
    window.removeEventListener("mousedown", this.handleMouseDown.bind(this));
    window.removeEventListener("mouseup", this.handleMouseUp.bind(this));

    this.isInitialized = false;
  }

  /**
   * Handle keyboard key down
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        this.keys.left = true;
        event.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        this.keys.right = true;
        event.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
        this.keys.up = true;
        event.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        this.keys.down = true;
        event.preventDefault();
        break;
      case "Space":
      case "KeyJ":
        this.keys.space = true;
        event.preventDefault();
        this.triggerCallbacks("jump");
        break;
      case "KeyP":
      case "Escape":
        this.keys.pause = !this.keys.pause;
        event.preventDefault();
        this.triggerCallbacks("pause");
        break;
    }
  }

  /**
   * Handle keyboard key up
   */
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        this.keys.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.keys.right = false;
        break;
      case "ArrowUp":
      case "KeyW":
        this.keys.up = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.keys.down = false;
        break;
      case "Space":
      case "KeyJ":
        this.keys.space = false;
        break;
    }
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const touch = event.touches[0];
    const x = touch.clientX;
    const screenWidth = window.innerWidth;

    // Left side of screen for left movement
    if (x < screenWidth * 0.3) {
      this.keys.left = true;
    }
    // Right side of screen for right movement
    else if (x > screenWidth * 0.7) {
      this.keys.right = true;
    }
    // Middle of screen for jump
    else {
      this.keys.space = true;
      this.triggerCallbacks("jump");
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    // Reset all touch-based inputs
    this.keys.left = false;
    this.keys.right = false;
    this.keys.space = false;
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(event: MouseEvent): void {
    // Left click for jump
    if (event.button === 0) {
      this.keys.space = true;
      this.triggerCallbacks("jump");
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(event: MouseEvent): void {
    // Left click release
    if (event.button === 0) {
      this.keys.space = false;
    }
  }

  /**
   * Get current input state
   */
  public getInputState(): InputState {
    return { ...this.keys };
  }

  /**
   * Check if specific key is pressed
   */
  public isPressed(key: keyof InputState): boolean {
    return this.keys[key];
  }

  /**
   * Check if any movement key is pressed
   */
  public isMoving(): boolean {
    return this.keys.left || this.keys.right || this.keys.up || this.keys.down;
  }

  /**
   * Check if jump/action is pressed
   */
  public isJumping(): boolean {
    return this.keys.space;
  }

  /**
   * Check if pause is toggled
   */
  public isPaused(): boolean {
    return this.keys.pause;
  }

  /**
   * Get horizontal movement direction
   */
  public getHorizontalDirection(): number {
    if (this.keys.left) return -1;
    if (this.keys.right) return 1;
    return 0;
  }

  /**
   * Get vertical movement direction
   */
  public getVerticalDirection(): number {
    if (this.keys.up) return -1;
    if (this.keys.down) return 1;
    return 0;
  }

  /**
   * Get movement vector
   */
  public getMovementVector(): { x: number; y: number } {
    return {
      x: this.getHorizontalDirection(),
      y: this.getVerticalDirection(),
    };
  }

  /**
   * Reset all input states
   */
  public reset(): void {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      pause: false,
    };
  }

  /**
   * Register callback for specific action
   */
  public onCallback(action: string, callback: () => void): void {
    if (!this.callbacks.has(action)) {
      this.callbacks.set(action, []);
    }
    this.callbacks.get(action)!.push(callback);
  }

  /**
   * Remove callback for specific action
   */
  public offCallback(action: string, callback: () => void): void {
    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger all callbacks for an action
   */
  private triggerCallbacks(action: string): void {
    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error("InputHandler: Error in callback:", error);
        }
      });
    }
  }

  /**
   * Check if input handler is initialized
   */
  public isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): {
    keys: InputState;
    callbacks: Map<string, number>;
    initialized: boolean;
  } {
    const callbackCounts = new Map<string, number>();
    for (const [action, callbacks] of this.callbacks) {
      callbackCounts.set(action, callbacks.length);
    }

    return {
      keys: { ...this.keys },
      callbacks: callbackCounts,
      initialized: this.isInitialized,
    };
  }

  /**
   * Simulate key press (for testing)
   */
  public simulateKeyPress(key: keyof InputState, pressed: boolean): void {
    this.keys[key] = pressed;

    if (pressed && (key === "space" || key === "pause")) {
      this.triggerCallbacks(key === "space" ? "jump" : "pause");
    }
  }

  /**
   * Enable/disable specific input
   */
  public setEnabled(key: keyof InputState, enabled: boolean): void {
    if (!enabled) {
      this.keys[key] = false;
    }
  }

  /**
   * Create virtual gamepad interface
   */
  public createVirtualGamepad(): {
    onButtonPress: (button: string) => void;
    onButtonRelease: (button: string) => void;
  } {
    return {
      onButtonPress: (button: string) => {
        switch (button.toLowerCase()) {
          case "left":
            this.keys.left = true;
            break;
          case "right":
            this.keys.right = true;
            break;
          case "up":
            this.keys.up = true;
            break;
          case "down":
            this.keys.down = true;
            break;
          case "a":
          case "jump":
            this.keys.space = true;
            this.triggerCallbacks("jump");
            break;
          case "start":
          case "pause":
            this.keys.pause = !this.keys.pause;
            this.triggerCallbacks("pause");
            break;
        }
      },
      onButtonRelease: (button: string) => {
        switch (button.toLowerCase()) {
          case "left":
            this.keys.left = false;
            break;
          case "right":
            this.keys.right = false;
            break;
          case "up":
            this.keys.up = false;
            break;
          case "down":
            this.keys.down = false;
            break;
          case "a":
          case "jump":
            this.keys.space = false;
            break;
        }
      },
    };
  }
}
