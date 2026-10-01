export interface AiTutorService { respond(input: string): Promise<unknown>; }
export interface SpeechToTextService { start(onText: (text: string) => void): Promise<void>; stop(): void; }
export interface TextToSpeechService { speak(text: string): Promise<void>; stop(): void; }
export interface AvatarService { setState(state: 'idle'|'listening'|'thinking'|'speaking'): void; }

export const aiTutorService: AiTutorService = {
  async respond() { throw new Error('AI Tutor is not connected yet.'); }
};
export const speechToTextService: SpeechToTextService = {
  async start() { throw new Error('Speech-to-Text is not connected yet.'); },
  stop() {}
};
export const textToSpeechService: TextToSpeechService = {
  async speak() { throw new Error('Text-to-Speech is not connected yet.'); },
  stop() {}
};
export const avatarService: AvatarService = {
  setState() {}
};
