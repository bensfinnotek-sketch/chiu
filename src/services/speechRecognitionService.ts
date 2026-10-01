// Browser Speech Recognition adapter. The UI talks to the modular speech facade instead.
export type SpeechLanguage = 'zh-CN' | 'zh-TW' | 'en-US' | 'vi-VN';

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onInterimResult?: (interim: string) => void;
  onError?: (error: string) => void;
  onEnd?: (finalTranscript?: string) => void;
  onStart?: () => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive = false;
  private isSupportedBrowser = false;
  private shouldFinalizeOnEnd = false;
  private language: SpeechLanguage = 'zh-CN';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupportedBrowser = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = this.language;
      }
    }
  }

  public isSupported(): boolean { return this.isSupportedBrowser; }
  public isListening(): boolean { return this.isListeningActive; }

  public startListening(callbacks: SpeechRecognitionCallbacks, language: SpeechLanguage = 'zh-CN'): boolean {
    if (!this.recognition || !this.isSupportedBrowser) {
      callbacks.onError?.('Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói. Bạn có thể gõ trực tiếp câu trả lời.');
      return false;
    }

    this.language = language;
    this.recognition.lang = language;
    try { this.abortListening(); } catch { /* noop */ }

    let finalAccumulated = '';
    this.recognition.onstart = () => {
      this.isListeningActive = true;
      this.shouldFinalizeOnEnd = true;
      callbacks.onStart?.();
    };
    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) finalAccumulated += item[0].transcript;
        else interim += item[0].transcript;
      }
      callbacks.onInterimResult?.(interim);
      callbacks.onResult([finalAccumulated, interim].filter(Boolean).join(' ').trim(), Boolean(finalAccumulated));
    };
    this.recognition.onerror = (event: any) => {
      this.isListeningActive = false;
      this.shouldFinalizeOnEnd = false;
      const code = event?.error || 'unknown';
      const userMsg =
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Bạn chưa cấp quyền microphone.'
          : code === 'no-speech'
          ? 'Mình chưa nghe rõ. Bạn thử nói chậm hơn nhé.'
          : code === 'network'
          ? 'Đang gặp sự cố kết nối. Bạn thử lại nhé.'
          : code === 'audio-capture'
          ? 'Không tìm thấy microphone trên thiết bị này.'
          : 'Mình chưa nghe rõ. Bạn thử nói lại nhé.';
      callbacks.onError?.(userMsg);
    };
    this.recognition.onend = () => {
      this.isListeningActive = false;
      if (this.shouldFinalizeOnEnd) {
        this.shouldFinalizeOnEnd = false;
        callbacks.onEnd?.(finalAccumulated.trim());
      }
    };

    try {
      this.recognition.start();
      return true;
    } catch {
      this.isListeningActive = false;
      callbacks.onError?.('Mình chưa thể mở microphone. Bạn thử lại nhé.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try { this.recognition.stop(); } catch { /* noop */ }
    }
    this.isListeningActive = false;
  }

  public abortListening(): void {
    if (this.recognition) {
      try { this.recognition.abort(); } catch { /* noop */ }
    }
    this.isListeningActive = false;
    this.shouldFinalizeOnEnd = false;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
