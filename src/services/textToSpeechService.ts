// Browser Text-to-Speech adapter for Mandarin zh-CN.
export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class TextToSpeechService {
  private isSupportedTTS = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isSpeakingActive = false;
  private selectedVoiceName = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupportedTTS = true;
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) this.cachedVoices = window.speechSynthesis.getVoices();
  }
  public isSupported(): boolean { return this.isSupportedTTS; }
  public isSpeaking(): boolean { return this.isSpeakingActive; }

  public getChineseVoices(): SpeechSynthesisVoice[] {
    if (!this.cachedVoices.length) this.loadVoices();
    return this.cachedVoices.filter((voice) => {
      const lang = voice.lang.toLowerCase();
      return lang === 'zh-cn' || lang.startsWith('zh-') || lang.startsWith('cmn');
    });
  }

  public setVoice(voiceName?: string): void { this.selectedVoiceName = voiceName || ''; }

  public getChineseVoices(): SpeechSynthesisVoice[] {
    if (!this.cachedVoices.length) this.loadVoices();
    return this.cachedVoices.filter((voice) => voice.lang.toLowerCase() === 'zh-cn' || voice.lang.toLowerCase().startsWith('zh-') || voice.lang.toLowerCase().startsWith('cmn'));
  }

  public setVoice(voiceName?: string): void { this.selectedVoiceName = voiceName || ''; }

  public getChineseVoice(): SpeechSynthesisVoice | null {
    const voices = this.getChineseVoices();
    if (this.selectedVoiceName) {
      const selected = voices.find((v) => v.name === this.selectedVoiceName);
      if (selected) return selected;
    }
    const preferredNames = ['Tingting', 'Xiaoxiao', 'Yaoyao', 'Meijia', 'Lili', 'Huihui', 'Kangkang'];
    for (const name of preferredNames) {
      const v = voices.find((voice) => voice.name.includes(name));
      if (v) return v;
    }
    return voices.find((v) => v.lang.toLowerCase() === 'zh-cn') || voices[0] || null;
  }

  public speakChinese(text: string, options?: SpeakOptions): void {
    if (!this.isSupportedTTS || !text) {
      options?.onError?.(new Error('TTS_UNAVAILABLE'));
      return;
    }
    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = Math.min(1.25, Math.max(0.75, options?.rate ?? 1));
    utterance.pitch = options?.pitch ?? 1;
    const voice = options?.voice ? this.getChineseVoices().find((v) => v.name === options.voice) : this.getChineseVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { this.isSpeakingActive = true; options?.onStart?.(); };
    utterance.onend = () => { this.isSpeakingActive = false; this.currentUtterance = null; options?.onEnd?.(); };
    utterance.onerror = (err) => { this.isSpeakingActive = false; this.currentUtterance = null; options?.onError?.(err); options?.onEnd?.(); };
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
    this.isSpeakingActive = false;
    this.currentUtterance = null;
  }
  public pauseSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') { try { window.speechSynthesis.pause(); } catch { /* noop */ } }
  }
  public resumeSpeaking(): void {
    if (this.isSupportedTTS && typeof window !== 'undefined') { try { window.speechSynthesis.resume(); } catch { /* noop */ } }
  }
}
export const textToSpeechService = new TextToSpeechService();
