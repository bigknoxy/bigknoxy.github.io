/**
 * Audio System - Web Audio API implementation for 8-bit sound effects
 */

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  frequencies: {
    jump: number;
    collect: number;
    gameOver: number;
    background: number[];
  };
}

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private config: AudioConfig;
  private isInitialized: boolean = false;
  private isSuspended: boolean = true;
  private onUnmuteCallback?: () => void;

  constructor(config: AudioConfig) {
    this.config = config;
  }

  /**
   * Initialize audio context after user gesture
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if Web Audio API is available
      if (typeof window === "undefined" || !window.AudioContext) {
        console.warn("AudioManager: Web Audio API not supported");
        return;
      }

      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.config.volume;

      // Handle audio context state
      if (this.audioContext.state === "suspended") {
        this.isSuspended = true;
      } else {
        this.isSuspended = false;
      }

      this.isInitialized = true;
      console.log("AudioManager: Initialized successfully");
    } catch (error) {
      console.error("AudioManager: Failed to initialize:", error);
    }
  }

  /**
   * Resume audio context (must be called after user gesture)
   */
  public async resume(): Promise<void> {
    if (!this.audioContext || !this.isInitialized) return;

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        this.isSuspended = false;
        console.log("AudioManager: Audio context resumed");
      }
    } catch (error) {
      console.error("AudioManager: Failed to resume audio context:", error);
    }
  }

  /**
   * Play a synthesized sound effect
   */
  private async playSound(
    frequency: number,
    duration: number,
    type: OscillatorType = "square",
    volume: number = 0.2,
  ): Promise<void> {
    if (
      !this.isInitialized ||
      !this.audioContext ||
      !this.masterGain ||
      this.isSuspended
    ) {
      return;
    }

    if (!this.config.enabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Configure oscillator
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime,
      );

      // Configure ADSR envelope
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Attack
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, now + 0.05); // Decay/Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Release

      // Play sound
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.error("AudioManager: Failed to play sound:", error);
    }
  }

  /**
   * Play jump sound (rising pitch)
   */
  public async playJump(): Promise<void> {
    await this.playSound(this.config.frequencies.jump, 0.1, "square", 0.15);
    // Add second note for more character
    setTimeout(async () => {
      await this.playSound(
        this.config.frequencies.jump * 1.5,
        0.1,
        "square",
        0.1,
      );
    }, 50);
  }

  /**
   * Play collect sound (arpeggio)
   */
  public async playCollect(): Promise<void> {
    const notes = [523, 659, 784]; // C, E, G arpeggio
    for (let i = 0; i < notes.length; i++) {
      setTimeout(async () => {
        await this.playSound(notes[i], 0.1, "square", 0.12);
      }, i * 50);
    }
  }

  /**
   * Play game over sound (descending)
   */
  public async playGameOver(): Promise<void> {
    const notes = [400, 350, 300, 250, 200];
    for (let i = 0; i < notes.length; i++) {
      setTimeout(async () => {
        await this.playSound(notes[i], 0.2, "square", 0.15);
      }, i * 100);
    }
  }

  /**
   * Set master volume
   */
  public setVolume(level: number): void {
    this.config.volume = Math.max(0, Math.min(1, level));
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.volume;
    }
  }

  /**
   * Mute audio
   */
  public mute(): void {
    this.config.enabled = false;
  }

  /**
   * Unmute audio
   */
  public unmute(): void {
    this.config.enabled = true;
    // Call unmute callback if registered
    if (this.onUnmuteCallback) {
      this.onUnmuteCallback();
    }
  }

  /**
   * Set unmute callback
   */
  public setUnmuteCallback(callback: () => void): void {
    this.onUnmuteCallback = callback;
  }

  /**
   * Check if audio is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled && this.isInitialized && !this.isSuspended;
  }

  /**
   * Get current volume level
   */
  public getVolume(): number {
    return this.config.volume;
  }

  /**
   * Check if audio is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if audio context is suspended
   */
  public isAudioSuspended(): boolean {
    return this.isSuspended;
  }

  /**
   * Destroy audio manager
   */
  public destroy(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.isSuspended = true;
  }
}
