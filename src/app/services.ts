import type { ConversationMessage, TutorResponse, TutorMode, TutorHint } from './types';
import { speechService } from './services/speech';
import { ttsService } from './services/tts';
import { aiMemoryService } from './services/aiMemory';
import { linaAvatarProvider } from './services/avatar';
import type { ImmersionLevel, RoleplayScenario } from './services/roleplay';
export { pronunciationEngine } from './services/pronunciationEngine';
export type { PronunciationEngine, WordPronunciationResult, SentencePronunciationResult, TonePronunciationResult } from './services/pronunciationEngine';

export interface AiTutorService {
  respond(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];memory?:{summary?:string;keyFacts?:string[];vocabulary?:string[];grammarIssues?:string[]};difficulty?:'easy'|'normal'|'challenge';immersion?:ImmersionLevel;roleplay?:{scenario:RoleplayScenario;learnerFacts?:string[];choices?:string[]};signal?:AbortSignal;}):Promise<TutorResponse>;
  hint(input:{prompt:string;targetLevel?:string;level:1|2|3|4;signal?:AbortSignal}):Promise<TutorHint>;
}
import { postJson } from './services/request';
import { appLogger } from './services/logger';

export const aiTutorService:AiTutorService={
  respond:(input)=>postJson<TutorResponse>('/api/ai/speaking',{userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),nativeLanguage:'vi',difficulty:input.difficulty||'normal',memory:input.memory,immersion:input.immersion,roleplay:input.roleplay},input.signal),
  hint:(input)=>postJson<TutorHint>('/api/ai/hint',{prompt:input.prompt,targetLevel:input.targetLevel||'HSK 1',level:input.level},input.signal),
};

export const speechToTextService={
  async start(onText:(text:string)=>void, onInterim?:(text:string)=>void, onError?:(message:string)=>void, language:'zh-CN'|'zh-TW'|'en-US'|'vi-VN'='zh-CN'){
    await speechService.start({language,callbacks:{onFinal:onText,onInterim,onError}});
  },
  stop(){speechService.stop();}, abort(){speechService.abort();}, isSupported(){return speechService.isSupported();}
};
export const textToSpeechService={
  async speak(text:string,rate:0.75|1|1.25=1){
    linaAvatarProvider.setState('speaking');
    try { return await ttsService.speakChinese(text,{rate,lang:'zh-CN'}); }
    finally { linaAvatarProvider.setState('idle'); }
  },
  stop(){ttsService.stopSpeaking();linaAvatarProvider.setState('idle');},
  pause(){ttsService.pauseSpeaking();}, resume(){ttsService.resumeSpeaking();}, isSupported(){return ttsService.isSupported();}
};
export const avatarService={
  initialize(){linaAvatarProvider.initialize();},
  setState(state:'idle'|'listening'|'thinking'|'speaking'|'happy'|'encouraging'|'confused'|'error'){linaAvatarProvider.setState(state);},
  subscribe(listener:(state:import('./services/avatar').AvatarState)=>void){return linaAvatarProvider.subscribe(listener);},
  speak(text:string,options?:{rate?:0.75|1|1.25}){linaAvatarProvider.speak(text,options);},
  stop(){linaAvatarProvider.stop();},
  destroy(){linaAvatarProvider.destroy();}
};

export { lessonEngine, validateGeneratedLesson, normalizeGeneratedLesson, lessonToStructured } from './services/lessonEngine';
export type { LessonSchema, LessonGenerationParameters, LessonQuizQuestion, LessonType } from './learning/types';

export { motivationService } from './services/motivation';
