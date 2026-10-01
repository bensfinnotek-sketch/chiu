import type { ConversationMessage, TutorResponse, TutorMode, TutorHint } from './types';
import { speechService } from './services/speech';
import { ttsService } from './services/tts';
import { aiMemoryService } from './services/aiMemory';
import { getAvatarProvider } from './services/avatar';
import type { ImmersionLevel, RoleplayScenario } from './services/roleplay';
export { pronunciationEngine } from './services/pronunciationEngine';
export type { PronunciationEngine, WordPronunciationResult, SentencePronunciationResult, TonePronunciationResult } from './services/pronunciationEngine';

import { postJson } from './services/request';
import { appLogger } from './services/logger';

export interface AiTutorService {
  respond(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];memory?:{summary?:string;keyFacts?:string[];vocabulary?:string[];grammarIssues?:string[]};difficulty?:'easy'|'normal'|'challenge';immersion?:ImmersionLevel;roleplay?:{scenario:RoleplayScenario;learnerFacts?:string[];choices?:string[]};signal?:AbortSignal;}):Promise<TutorResponse>;
  stream(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];signal?:AbortSignal;onDelta:(text:string)=>void;}):Promise<string>;
  hint(input:{prompt:string;targetLevel?:string;level:1|2|3|4;signal?:AbortSignal}):Promise<TutorHint>;
}
export const aiTutorService:AiTutorService={
  respond:(input)=>postJson<TutorResponse>('/api/ai/speaking',{userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),nativeLanguage:'vi',difficulty:input.difficulty||'normal',memory:input.memory,immersion:input.immersion,roleplay:input.roleplay},input.signal),
  async stream(input){
    const controller=new AbortController(); const signal=input.signal; const abort=()=>controller.abort(); signal?.addEventListener('abort',abort,{once:true});
    try {
      const response=await fetch('/api/ai/speaking/stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-8)}),signal:controller.signal});
      if(!response.ok||!response.body) throw new Error('stream-unavailable');
      const reader=response.body.getReader(); const decoder=new TextDecoder(); let buffer=''; let full='';
      while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const events=buffer.split(/\n\n/);buffer=events.pop()||'';for(const event of events){const line=event.split('\n').find(x=>x.startsWith('data: '));if(!line)continue;const payload=JSON.parse(line.slice(6));if(payload.type==='delta'){full+=payload.text;input.onDelta(payload.text)}if(payload.type==='error')throw new Error(payload.error)}} return full;
    } finally {signal?.removeEventListener('abort',abort)}
  },
  hint:(input)=>postJson<TutorHint>('/api/ai/hint',{prompt:input.prompt,targetLevel:input.targetLevel||'HSK 1',level:input.level},input.signal),
};

export const speechToTextService={
  async start(onText:(text:string)=>void, onInterim?:(text:string)=>void, onError?:(message:string)=>void, language:'zh-CN'|'zh-TW'|'en-US'|'vi-VN'='zh-CN'){
    await speechService.start({language,callbacks:{onFinal:onText,onInterim,onError:message=>{appLogger.error('stt-error',message);onError?.(message);}}});
  },
  stop(){speechService.stop();}, abort(){speechService.abort();}, isSupported(){return speechService.isSupported();}
};
export const textToSpeechService={
  async speak(text:string,rate:0.75|1|1.25=1){
    getAvatarProvider().setState('speaking');
    try { return await ttsService.speakChinese(text,{rate,lang:'zh-CN'}); } catch(error){appLogger.error('tts-error',error);throw error;}
    finally { getAvatarProvider().setState('idle'); }
  },
  stop(){ttsService.stopSpeaking();getAvatarProvider().setState('idle');},
  pause(){ttsService.pauseSpeaking();}, resume(){ttsService.resumeSpeaking();}, isSupported(){return ttsService.isSupported();}
};
export const avatarService={
  initialize(){getAvatarProvider().initialize();},
  setState(state:'idle'|'listening'|'thinking'|'speaking'|'happy'|'encouraging'|'confused'|'error'){getAvatarProvider().setState(state);},
  subscribe(listener:(state:import('./services/avatar').AvatarState)=>void){return getAvatarProvider().subscribe(listener);},
  speak(text:string,options?:{rate?:0.75|1|1.25}){getAvatarProvider().speak(text,options);},
  stop(){getAvatarProvider().stop();},
  destroy(){getAvatarProvider().destroy();}
};

export { lessonEngine, validateGeneratedLesson, normalizeGeneratedLesson, lessonToStructured } from './services/lessonEngine';
export type { LessonSchema, LessonGenerationParameters, LessonQuizQuestion, LessonType } from './learning/types';

export { motivationService } from './services/motivation';

export { progressService } from './services/progress';
