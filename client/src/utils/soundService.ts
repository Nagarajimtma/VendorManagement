/**
 * Sound Service for handling notification sounds
 */

export interface SoundOptions {
  volume?: number;
  type?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

class SoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Enable or disable notification sounds
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  /**
   * Check if sounds are enabled
   */
  isEnabledForUser(): boolean {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }

  /**
   * Generate a notification sound using Web Audio API
   */
  private generateSound(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.audioContext || !this.isEnabled || !this.isEnabledForUser()) return;

    // Resume audio context if suspended (required for some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play notification sound based on type
   */
  playNotificationSound(options: SoundOptions = {}) {
    const { volume = 0.1, type = 'default' } = options;

    switch (type) {
      case 'success':
        // Higher pitch for success
        this.generateSound(800, 0.2, volume);
        setTimeout(() => this.generateSound(600, 0.2, volume), 100);
        break;
      
      case 'error':
        // Lower pitch for errors
        this.generateSound(300, 0.3, volume);
        setTimeout(() => this.generateSound(250, 0.3, volume), 150);
        break;
      
      case 'warning':
        // Medium pitch for warnings
        this.generateSound(500, 0.25, volume);
        setTimeout(() => this.generateSound(450, 0.25, volume), 100);
        setTimeout(() => this.generateSound(400, 0.25, volume), 200);
        break;
      
      case 'info':
        // Clean tone for info
        this.generateSound(600, 0.2, volume);
        break;
      
      default:
        // Standard notification sound
        this.generateSound(440, 0.2, volume);
        break;
    }
  }

  /**
   * Play system alert sound
   */
  playAlertSound() {
    if (!this.audioContext || !this.isEnabled || !this.isEnabledForUser()) return;

    // Three quick beeps
    this.generateSound(800, 0.1, 0.15);
    setTimeout(() => this.generateSound(800, 0.1, 0.15), 150);
    setTimeout(() => this.generateSound(800, 0.1, 0.15), 300);
  }

  /**
   * Test sound functionality
   */
  testSound() {
    this.playNotificationSound({ type: 'info', volume: 0.2 });
  }
}

// Create and export singleton instance
const soundService = new SoundService();
export default soundService;