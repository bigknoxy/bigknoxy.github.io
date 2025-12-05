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

export {};
