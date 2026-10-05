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
  respond(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];memory?:{summary?:string;keyFacts?:string[];vocabulary?:string[];grammarIssues?:string[]};difficulty?:'easy'|'normal'|'challenge';immersion?:ImmersionLevel;roleplay?:{scenario:RoleplayScenario;learnerFacts?:string[];choices?:string[]};speakingGoal?:'reflex'|'conversation'|'correction';vocabularyContext?:string[];signal?:AbortSignal;}):Promise<TutorResponse>;
  stream(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];signal?:AbortSignal;onDelta:(text:string)=>void;speakingGoal?:'reflex'|'conversation'|'correction';vocabularyContext?:string[]}):Promise<{text:string;response?:TutorResponse;model?:string}>;
  hint(input:{prompt:string;targetLevel?:string;level:1|2|3|4;signal?:AbortSignal}):Promise<TutorHint>;
}
function buildClientSpeakingFallback(userText:string):TutorResponse {
  const text=userText.trim();
  if(/你好|您好/.test(text)) return {reply:"你好！很高兴和你练习中文。你叫什么名字？",pinyin:"Nǐ hǎo! Hěn gāoxìng hé nǐ liànxí Zhōngwén. Nǐ jiào shénme míngzi?",translation:"Xin chào! Rất vui được luyện tiếng Trung cùng bạn. Bạn tên là gì?",question:"你叫什么名字？",corrections:[],vocabulary:[],grammarNote:"Phản hồi dự phòng.",encouragement:"继续加油！",emotion:"encouraging",responseType:"conversation",clarityScore:4,grammarScore:4,vocabularyScore:3,naturalnessScore:4};
  return {reply:"说得不错！我们继续练习吧。",pinyin:"Shuō de búcuò! Wǒmen jìxù liànxí ba.",translation:"Bạn nói khá tốt! Chúng ta tiếp tục luyện tập nhé.",question:null,corrections:[],vocabulary:[],grammarNote:"Phản hồi dự phòng.",encouragement:"继续加油！",emotion:"encouraging",responseType:"conversation",clarityScore:4,grammarScore:4,vocabularyScore:3,naturalnessScore:4};
}

export const aiTutorService:AiTutorService={
  respond:(input)=>postJson<TutorResponse>('/api/speaking',{
    userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',
    mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),nativeLanguage:'vi',
    difficulty:input.difficulty||'normal',memory:input.memory,immersion:input.immersion,roleplay:input.roleplay,
    speakingGoal:input.speakingGoal||'conversation',vocabularyContext:input.vocabularyContext||[]
  },input.signal),
  async stream(input){
    // Keep the conversation path stable: use the established JSON speaking endpoint
    // and reveal the reply through the existing onDelta UI callback. The dedicated
    // SSE route remains available, but it must not be able to break the core tutor flow.
    const response=await postJson<TutorResponse>('/api/ai/speaking',{
      userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',
      mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),
      nativeLanguage:'vi',speakingGoal:input.speakingGoal||'conversation',vocabularyContext:input.vocabularyContext||[]
    },input.signal);
    const text=String(response.reply||'');
    if(text) input.onDelta(text);
    return {text,response,model:'speaking-analyze'};
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
