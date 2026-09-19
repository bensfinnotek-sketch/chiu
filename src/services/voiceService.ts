// Voice service providing Web Speech Recognition & Speech Synthesis for Chinese (Mandarin)

class VoiceService {
  private recognition: any = null;
  private isRecognitionSupported: boolean = false;
  private isSynthesisSupported: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isRecognitionSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
      this.isSynthesisSupported = 'speechSynthesis' in window;
    }
  }

  public hasSpeechRecognition(): boolean {
    return this.isRecognitionSupported;
  }

  public hasSpeechSynthesis(): boolean {
    return this.isSynthesisSupported;
  }

  public startListening(
    optionsOrResult:
      | ((transcript: string, isFinal: boolean) => void)
      | {
          onResult: (transcript: string, isFinal?: boolean) => void;
          onError?: (error: string) => void;
          onEnd?: () => void;
        },
    onErrorCallback?: (error: string) => void,
    onEndCallback?: () => void
  ): boolean {
    const onResult =
      typeof optionsOrResult === 'function'
        ? optionsOrResult
        : optionsOrResult.onResult;
    const onError =
      typeof optionsOrResult === 'function'
        ? onErrorCallback
        : optionsOrResult.onError;
    const onEnd =
      typeof optionsOrResult === 'function'
        ? onEndCallback
        : optionsOrResult.onEnd;

    if (!this.recognition) {
      if (onError) onError('Trình duyệt không hỗ trợ nhận diện giọng nói tiếng Trung.');
      return false;
    }

    try {
      this.recognition.abort(); // clear any previous
    } catch {
      // ignore
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      onResult(text, Boolean(finalTranscript));
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (onError) {
        if (event.error === 'not-allowed') {
          onError('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép micro để luyện nói.');
        } else if (event.error === 'no-speech') {
          onError('Không phát hiện thấy giọng nói. Hãy thử nói lại gần micro hơn nhé.');
        } else {
          onError(`Lỗi micro: ${event.error}`);
        }
      }
    };

    this.recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      if (onError) onError(err?.message || 'Không thể kích hoạt micro.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  public speakText(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): void {
    if (!this.isSynthesisSupported) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = options?.rate || 0.9; // slightly slower for language learners
    utterance.pitch = options?.pitch || 1.0;

    // Pick best Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.includes('zh') || v.lang.includes('cmn') || v.name.includes('Chinese')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;
    utterance.onerror = () => {
      if (options?.onEnd) options.onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceService = new VoiceService();
