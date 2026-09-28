import type { PronunciationAudioInput } from './pronunciationTypes';

export interface AudioTransport {
  start(): Promise<void>;
  stop(): Promise<PronunciationAudioInput | null>;
  cancel(): void;
  isSupported(): boolean;
}

export class MediaRecorderAudioTransport implements AudioTransport {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startPromise: Promise<void> | null = null;
  private stopPromise: Promise<PronunciationAudioInput | null> | null = null;
  private session = 0;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined'
      && Boolean(navigator.mediaDevices?.getUserMedia)
      && typeof MediaRecorder !== 'undefined';
  }

  public start(): Promise<void> {
    const session = ++this.session;
    this.cancelActiveResources();

    if (!this.isSupported()) return Promise.resolve();

    this.startPromise = navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (session !== this.session) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        this.stream = stream;
        this.chunks = [];
        const preferredOptions: MediaRecorderOptions = { audioBitsPerSecond: 32000 };
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, preferredOptions);
        } catch {
          recorder = new MediaRecorder(stream);
        }
        this.recorder = recorder;

        recorder.ondataavailable = (event) => {
          if (session === this.session && event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        recorder.start();
      })
      .catch(() => {
        // Transcript recognition can still operate when audio capture is unavailable.
      })
      .then(() => undefined);

    return this.startPromise;
  }

  public async stop(): Promise<PronunciationAudioInput | null> {
    if (this.stopPromise) return this.stopPromise;
    const startPromise = this.startPromise;

    this.stopPromise = (async () => {
      await startPromise;
      const recorder = this.recorder;
      const stream = this.stream;

      if (!recorder) {
        this.releaseResources();
        return null;
      }

      return new Promise<PronunciationAudioInput | null>((resolve) => {
        const finalize = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = this.chunks.length > 0
            ? new Blob(this.chunks, { type: mimeType })
            : null;

          this.releaseResources();
          resolve(blob ? { blob, mimeType } : null);
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
    })();

    try {
      return await this.stopPromise;
    } finally {
      this.stopPromise = null;
    }
  }

  public cancel(): void {
    ++this.session;
    this.cancelActiveResources();
    this.releaseResources();
  }

  private cancelActiveResources(): void {
    if (this.recorder) {
      try {
        if (this.recorder.state !== 'inactive') this.recorder.stop();
      } catch {
        // ignore
      }
    }
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  private releaseResources(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.recorder = null;
    this.stream = null;
    this.chunks = [];
    this.startPromise = null;
  }
}

export const pronunciationAudioTransport = new MediaRecorderAudioTransport();
