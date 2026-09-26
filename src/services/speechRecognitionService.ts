// Web Speech Recognition Service for HanziAI
// Target language: zh-CN (Mandarin)

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onInterimResult?: (interim: string) => void;
  onError?: (error: string) => void;
  onEnd?: (finalTranscript?: string, audioBlob?: Blob | null) => void;
  onStart?: () => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private isSupportedBrowser: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioCaptureStartPromise: Promise<void> | null = null;
  private audioFinalizationPromise: Promise<Blob | null> | null = null;
  private audioCaptureSession = 0;

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
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isSupported(): boolean {
    return this.isSupportedBrowser;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public startListening(callbacks: SpeechRecognitionCallbacks): boolean {
    if (!this.recognition || !this.isSupportedBrowser) {
      if (callbacks.onError) {
        callbacks.onError('Trình duyệt hiện tại không hỗ trợ nhận diện giọng nói (Web Speech API). Bạn có thể gõ trực tiếp câu trả lời!');
      }
      return false;
    }

    try {
      this.abortListening();
    } catch {
      // ignore
    }

    let finalAccumulated = '';
    const audioSession = ++this.audioCaptureSession;
    this.startAudioCapture(audioSession);

    this.recognition.onstart = () => {
      this.isListeningActive = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalAccumulated += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && callbacks.onInterimResult) {
        callbacks.onInterimResult(interim);
      }

      const activeText = finalAccumulated || interim;
      callbacks.onResult(activeText, Boolean(finalAccumulated));
    };

    this.recognition.onerror = (event: any) => {
      this.isListeningActive = false;
      const errorCode = event?.error || 'unknown';

      let userMsg = 'Không thể nhận diện giọng nói.';
      if (errorCode === 'not-allowed') {
        userMsg = 'Quyền truy cập micro đã bị từ chối. Vui lòng cấp quyền micro trong cài đặt trình duyệt để luyện nói.';
      } else if (errorCode === 'no-speech') {
        userMsg = 'Không phát hiện thấy âm thanh. Hãy thử nói lại gần micro hơn nhé.';
      } else if (errorCode === 'audio-capture') {
        userMsg = 'Không tìm thấy micro phù hợp trên thiết bị của bạn.';
      } else if (errorCode === 'network') {
        userMsg = 'Mạng yếu hoặc không thể kết nối tới dịch vụ nhận diện giọng nói.';
      }

      if (callbacks.onError) callbacks.onError(userMsg);
    };

    this.recognition.onend = async () => {
      this.isListeningActive = false;
      const audioBlob = await this.finishAudioCapture();
      if (callbacks.onEnd) callbacks.onEnd(finalAccumulated, audioBlob);
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      if (callbacks.onError) {
        callbacks.onError(err?.message || 'Không thể khởi động micro.');
      }
      return false;
    }
  }

  public getLastAudioCapture(): Blob | null {
    if (this.audioChunks.length === 0) return null;
    return new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
  }

  private startAudioCapture(session: number): void {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return;
    }

    this.audioCaptureStartPromise = navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (session !== this.audioCaptureSession || !this.recognition) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.mediaStream = stream;
      this.audioChunks = [];
      const recorder = new MediaRecorder(stream);
      this.mediaRecorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      recorder.start();
    }).catch(() => {
      // Web Speech recognition can still operate when audio recording is unavailable.
    }).then(() => undefined);
  }

  private async finishAudioCapture(): Promise<Blob | null> {
    if (this.audioFinalizationPromise) return this.audioFinalizationPromise;
    if (this.audioCaptureStartPromise) await this.audioCaptureStartPromise;

    this.audioFinalizationPromise = new Promise((resolve) => {
      const recorder = this.mediaRecorder;
      const stream = this.mediaStream;
      if (!recorder) {
        stream?.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
        this.audioCaptureStartPromise = null;
        this.audioFinalizationPromise = null;
        resolve(null);
        return;
      }

      const finalize = () => {
        const blob = this.audioChunks.length > 0
          ? new Blob(this.audioChunks, { type: recorder.mimeType || 'audio/webm' })
          : null;
        stream?.getTracks().forEach((track) => track.stop());
        this.mediaRecorder = null;
        this.mediaStream = null;
        this.audioCaptureStartPromise = null;
        this.audioFinalizationPromise = null;
        resolve(blob);
      };

      recorder.onstop = finalize;
      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          finalize();
        }
      } catch {
        finalize();
      }
    });

    return this.audioFinalizationPromise;
  }

  public stopListening(): void {
    // Invalidate a pending microphone permission request so a late stream cannot outlive the turn.
    ++this.audioCaptureSession;
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListeningActive = false;
  }

  public abortListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
    this.isListeningActive = false;
    ++this.audioCaptureSession;
    void this.finishAudioCapture();
  }
}

export const speechRecognitionService = new SpeechRecognitionService();