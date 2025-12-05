/**
 * Input Handler - Manages keyboard and touch input
 */

import type { InputState } from "../types/GameTypes";

export class InputHandler {
  private keys: InputState;
  private callbacks: Map<string, (() => void)[]>;
  private isInitialized: boolean = false;
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleKeyUp: (event: KeyboardEvent) => void;
  private boundHandleMouseDown: (event: MouseEvent) => void;
  private boundHandleMouseUp: (event: MouseEvent) => void;

  // Element-level touch handler references
  private elementTouchHandlers: Map<
    HTMLElement,
    {
      boundTouchStart: (event: TouchEvent) => void;
      boundTouchEnd: (event: TouchEvent) => void;
      boundPointerDown: (event: PointerEvent) => void;
      boundPointerUp: (event: PointerEvent) => void;
    }
  > = new Map();
  private lastTriggerTime: Map<string, number> = new Map();
  private readonly TRIGGER_DEBOUNCE_MS = 100;

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

    // Pre-bind handlers to ensure consistent references for add/remove
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
  }

  /**
   * Initialize input handlers (call this when DOM is ready)
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    // Keyboard events only - touch/pointer events are handled via attachToElement
    window.addEventListener("keydown", this.boundHandleKeyDown);
    window.addEventListener("keyup", this.boundHandleKeyUp);

    // Mouse events as fallback (global)
    window.addEventListener("mousedown", this.boundHandleMouseDown);
    window.addEventListener("mouseup", this.boundHandleMouseUp);

    // Prevent context menu on long press
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    this.isInitialized = true;
  }

  /**
   * Cleanup input handlers
   */
  public destroy(): void {
    if (typeof window === "undefined") return;

    window.removeEventListener("keydown", this.boundHandleKeyDown);
    window.removeEventListener("keyup", this.boundHandleKeyUp);
    window.removeEventListener("mousedown", this.boundHandleMouseDown);
    window.removeEventListener("mouseup", this.boundHandleMouseUp);

    // Detach from all elements
    for (const [element] of this.elementTouchHandlers) {
      this.detachFromElement(element);
    }

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
   * Handle touch start (DOM-agnostic - no preventDefault)
   */
  private handleTouchStart(event: TouchEvent): void {
    // Note: preventDefault must be called by the element-level handler if needed

    // Gracefully handle cases where touches might be undefined
    if (!event.touches || event.touches.length === 0) {
      // Fallback: treat as jump if no touch data available
      this.keys.space = true;
      this.triggerCallbacks("jump");
      return;
    }

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
   * Handle touch end (DOM-agnostic - no preventDefault)
   */
  private handleTouchEnd(_event: TouchEvent): void {
    // Note: preventDefault must be called by the element-level handler if needed

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
   * Handle pointer down (unified touch/mouse/stylus input - DOM-agnostic)
   */
  private handlePointerDown(_event: PointerEvent): void {
    // Note: preventDefault must be called by the element-level handler if needed

    // Treat pointer down like a touch/click - trigger jump
    this.keys.space = true;
    this.triggerCallbacks("jump");
  }

  /**
   * Handle pointer up (DOM-agnostic)
   */
  private handlePointerUp(_event: PointerEvent): void {
    // Note: preventDefault must be called by the element-level handler if needed

    this.keys.space = false;
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
   * Trigger action programmatically (for UI/external calls)
   */
  public trigger(action: string): void {
    const now = Date.now();
    const lastTime = this.lastTriggerTime.get(action) || 0;

    // Debounce rapid repeated triggers for jump actions
    if (action === "space" || action === "jump") {
      if (now - lastTime < this.TRIGGER_DEBOUNCE_MS) {
        return; // Skip duplicate triggers
      }
      this.lastTriggerTime.set(action, now);
    }

    switch (action.toLowerCase()) {
      case "space":
      case "jump":
        this.keys.space = true;
        this.triggerCallbacks("jump");
        // Auto-reset space after a short delay to prevent stuck state
        setTimeout(() => {
          this.keys.space = false;
        }, 50);
        break;
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
      case "pause":
      case "start":
        this.keys.pause = !this.keys.pause;
        this.triggerCallbacks("pause");
        break;
    }
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

  /**
   * Attach touch/pointer handlers to a specific element
   * These handlers will call preventDefault() to block page scrolling
   */
  public attachToElement(element: HTMLElement): void {
    if (this.elementTouchHandlers.has(element)) {
      return; // Already attached
    }

    // Create element-specific handlers that call preventDefault
    const boundTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      this.handleTouchStart(event);
    };

    const boundTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      this.handleTouchEnd(event);
    };

    const boundPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      this.handlePointerDown(event);
    };

    const boundPointerUp = (event: PointerEvent) => {
      event.preventDefault();
      this.handlePointerUp(event);
    };

    // Store handlers for later removal
    this.elementTouchHandlers.set(element, {
      boundTouchStart,
      boundTouchEnd,
      boundPointerDown,
      boundPointerUp,
    });

    // Attach listeners with preventDefault capability
    element.addEventListener("touchstart", boundTouchStart, { passive: false });
    element.addEventListener("touchend", boundTouchEnd, { passive: false });

    if (window.PointerEvent) {
      element.addEventListener("pointerdown", boundPointerDown, {
        passive: false,
      });
      element.addEventListener("pointerup", boundPointerUp, { passive: false });
    }
  }

  /**
   * Detach touch/pointer handlers from a specific element
   */
  public detachFromElement(element: HTMLElement): void {
    const handlers = this.elementTouchHandlers.get(element);
    if (!handlers) {
      return; // Not attached
    }

    // Remove listeners
    element.removeEventListener("touchstart", handlers.boundTouchStart);
    element.removeEventListener("touchend", handlers.boundTouchEnd);

    if (window.PointerEvent) {
      element.removeEventListener("pointerdown", handlers.boundPointerDown);
      element.removeEventListener("pointerup", handlers.boundPointerUp);
    }

    // Clean up stored references
    this.elementTouchHandlers.delete(element);
  }
}
