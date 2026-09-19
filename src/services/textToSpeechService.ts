// Text-to-Speech Service for HanziAI (Mandarin zh-CN)

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class TextToSpeechService {
  private isSupportedTTS: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isSpeakingActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupportedTTS = true;
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public isSupported(): boolean {
    return this.isSupportedTTS;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  public getChineseVoice(): SpeechSynthesisVoice | null {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      this.loadVoices();
    }

    // Preferred priority: zh-CN female natural voices
    const preferredNames = ['Tingting', 'Xiaoxiao', 'Yaoyao', 'Meijia', 'Lili', 'Huihui', 'Kangkang'];
    for (const name of preferredNames) {
      const v = this.cachedVoices.find(
        (voice) => voice.name.includes(name) && voice.lang.toLowerCase().includes('zh')
      );
      if (v) return v;
    }

    // Next priority: any zh-CN voice
    const zhCN = this.cachedVoices.find((v) => v.lang.toLowerCase() === 'zh-cn');
    if (zhCN) return zhCN;

    // Next priority: any voice starting with zh or containing Chinese
    const anyZh = this.cachedVoices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('zh') ||
        v.lang.toLowerCase().startsWith('cmn') ||
        v.name.toLowerCase().includes('chinese')
    );
    if (anyZh) return anyZh;

    return null;
  }

  public speakChinese(text: string, options?: SpeakOptions): void {
    if (!this.isSupportedTTS || !text) return;

    // Immediately stop any prior audio to prevent concurrent sound overlap
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = options?.rate ?? 0.9; // 0.9 is natural yet clear for learners
    utterance.pitch = options?.pitch ?? 1.0;

    const voice = this.getChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeakingActive = true;
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeakingActive = false;
      this.currentUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (err) => {
      this.isSpeakingActive = false;
      this.currentUtterance = null;
      if (options?.onError) options.onError(err);
      if (options?.onEnd) options.onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeakingActive = false;
    this.currentUtterance = null;
  }

  public pauseSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }
  }

  public resumeSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
  }
}

export const textToSpeechService = new TextToSpeechService();
