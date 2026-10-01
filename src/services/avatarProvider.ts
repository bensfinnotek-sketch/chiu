import { speechService, type SpeakOptions } from './speech';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'encouraging'
  | 'confused'
  | 'error';

export interface AvatarProvider {
  initialize(): void;
  setState(state: AvatarState): void;
  getState(): AvatarState;
  subscribe(listener: (state: AvatarState) => void): () => void;
  speak(text: string, options?: SpeakOptions): void;
  stop(): void;
  destroy(): void;
}

/**
 * Vendor-neutral local avatar provider.
 * Level 1/2 uses the in-app Lina SVG + CSS animation; Level 3 can replace this
 * implementation without changing tutor or conversation UI contracts.
 */
class LocalAvatarProvider implements AvatarProvider {
  private state: AvatarState = 'idle';
  private listeners = new Set<(state: AvatarState) => void>();

  initialize(): void {}

  setState(state: AvatarState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }

  getState(): AvatarState {
    return this.state;
  }

  subscribe(listener: (state: AvatarState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  speak(text: string, options: SpeakOptions = {}): void {
    this.setState('speaking');
    speechService.speakChinese(text, {
      ...options,
      onStart: () => {
        this.setState('speaking');
        options.onStart?.();
      },
      onEnd: () => {
        this.setState('idle');
        options.onEnd?.();
      },
      onError: (error) => {
        this.setState('error');
        options.onError?.(error);
      },
    });
  }

  stop(): void {
    speechService.stopSpeaking();
    this.setState('idle');
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

export const avatarProvider: AvatarProvider = new LocalAvatarProvider();
