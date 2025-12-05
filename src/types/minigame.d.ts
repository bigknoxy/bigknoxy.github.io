/**
 * MiniGame API Types
 * Global type declarations for the window.miniGame API
 */

declare global {
  interface Window {
    miniGame?: {
      start(): void;
      pause(): void;
      reset(): void;
      restart(): void;
      getScore(): number;
      setScore(score: number): void;
      addScore(points: number): void;
      setSoundEnabled(enabled: boolean): void;
      getHighScore(): number;
      resetHighScore(): void;
      isPlaying(): boolean;
      isPaused(): boolean;
      setGameSpeed(speed: number): void;
      setScoreChangeCallback(callback: (score: number) => void): void;
      raw: any;
    };
    __miniGameReady?: Promise<boolean>;
    __miniGameReadyPromise?: Promise<boolean>;
    __lastMiniGameEvent?: {
      name: string;
      detail: any;
      time: number;
    };
  }

  interface CustomEvent<T = any> extends Event {
    detail: T;
  }
}

// InputHandler type declarations
export interface InputHandlerType {
  trigger(action: string): void;
  initialize(): void;
  destroy(): void;
  getInputState(): any;
  isPressed(key: string): boolean;
  onCallback(action: string, callback: () => void): void;
  offCallback(action: string, callback: () => void): void;
  simulateKeyPress(key: string, pressed: boolean): void;
  createVirtualGamepad(): any;
  attachToElement(element: HTMLElement): void;
  detachFromElement(element: HTMLElement): void;
}

export {};
