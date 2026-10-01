export type RealtimeSpeechStatus='idle'|'listening'|'thinking'|'speaking'|'error';
export type ValidatedEmotion='neutral'|'happy'|'encouraging'|'curious'|'confused'|'correcting';
export type Viseme='silence'|'A'|'E'|'I'|'O'|'U'|'MBP'|'FV'|'SZ'|'SHCHJ'|'LN'|'GKH'|'TH'|'unknown';

export interface AudioMetrics { volume:number; energy:number; isSpeaking:boolean; lowFrequency:number; midFrequency:number; highFrequency:number; timestamp:number; }
export interface VisemeFrame { timestamp:number; duration:number; viseme:Viseme; intensity:number; }
export interface LipSyncFrame { timestamp:number; mouthOpen:number; mouthWidth:number; jawOpen:number; viseme:Viseme; intensity:number; }
export interface FacialExpression { smile:number; brow:number; eyeFocus:number; headTilt:number; nod:number; jaw:number; }
export interface RealtimeSpeechState { turnId?:string; status:RealtimeSpeechStatus; text:string; audioState:'idle'|'buffering'|'playing'|'paused'|'ended'|'error'; avatarState:string; emotion:ValidatedEmotion; lipSyncState:'inactive'|'audio-driven'|'viseme-timed'; startedAt?:number; endedAt?:number; }
export function validateEmotion(value:unknown):ValidatedEmotion {
  return value==='happy'||value==='encouraging'||value==='curious'||value==='confused'||value==='correcting'?value:'neutral';
}

export interface RealtimeTurnMetrics { turnId:string; turnStartedAt:number; geminiFirstTokenAt?:number; ttsFirstChunkAt?:number; audioFirstPlayedAt?:number; turnCompletedAt?:number; ttftMs?:number; firstAudioLatencyMs?:number; totalTurnMs?:number; }
