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
  const base={corrections:[],vocabulary:[],grammarNote:"Phản hồi dự phòng.",encouragement:"继续加油！",emotion:"encouraging" as const,responseType:"conversation" as const,clarityScore:4,grammarScore:4,vocabularyScore:3,naturalnessScore:4};
  if(/你好|您好/.test(text)) return {...base,reply:"你好！很高兴和你练习中文。你叫什么名字？",pinyin:"Nǐ hǎo! Hěn gāoxìng hé nǐ liànxí Zhōngwén. Nǐ jiào shénme míngzi?",translation:"Xin chào! Rất vui được luyện tiếng Trung cùng bạn. Bạn tên là gì?",question:"你叫什么名字？"};
  if(/我叫|我.*名字|姓名|名字是/.test(text)) return {...base,reply:"很高兴认识你，明！你平时喜欢做什么？",pinyin:"Hěn gāoxìng rènshi nǐ, Míng! Nǐ píngshí xǐhuan zuò shénme?",translation:"Rất vui được làm quen với bạn, Minh! Bình thường bạn thích làm gì?",question:"你平时喜欢做什么？"};
  if(/好的|好啊|可以|行/.test(text)) return {...base,reply:"太好了！那我们继续。你今天想练习什么？",pinyin:"Tài hǎo le! Nà wǒmen jìxù. Nǐ jīntiān xiǎng liànxí shénme?",translation:"Tuyệt quá! Vậy chúng ta tiếp tục nhé. Hôm nay bạn muốn luyện gì?",question:"你今天想练习什么？"};
  if(/喜欢|爱/.test(text)) return {...base,reply:"很好！我也想了解你的兴趣。你最喜欢什么？",pinyin:"Hěn hǎo! Wǒ yě xiǎng liǎojiě nǐ de xìngqù. Nǐ zuì xǐhuan shénme?",translation:"Rất tốt! Mình cũng muốn biết sở thích của bạn. Bạn thích điều gì nhất?",question:"你最喜欢什么？"};
  if(/谢谢/.test(text)) return {...base,reply:"不客气！你说得很自然。我们再练一句吧。",pinyin:"Bú kèqi! Nǐ shuō de hěn zìrán. Wǒmen zài liàn yí jù ba.",translation:"Không có gì! Bạn nói khá tự nhiên. Chúng ta luyện thêm một câu nhé.",question:null};
  return {...base,reply:"明白了！我们继续练习中文。你今天想聊什么？",pinyin:"Míngbai le! Wǒmen jìxù liànxí Zhōngwén. Nǐ jīntiān xiǎng liáo shénme?",translation:"Mình hiểu rồi! Chúng ta tiếp tục luyện tiếng Trung nhé. Hôm nay bạn muốn nói về chủ đề gì?",question:"你今天想聊什么？"};
}

export const aiTutorService:AiTutorService={
  respond:(input)=>postJson<TutorResponse>('/api/speaking',{
    userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',
    mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),nativeLanguage:'vi',
    difficulty:input.difficulty||'normal',memory:input.memory,immersion:input.immersion,roleplay:input.roleplay,
    speakingGoal:input.speakingGoal||'conversation',vocabularyContext:input.vocabularyContext||[]
  },input.signal),
  async stream(input){
    try{
      const response=await postJson<TutorResponse>('/api/speaking',{
        userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',
        mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),
        nativeLanguage:'vi',speakingGoal:input.speakingGoal||'conversation',vocabularyContext:input.vocabularyContext||[]
      },input.signal,{timeoutMs:22000,retries:0,dedupe:false});
      const text=String(response.reply||'');
      if(text) input.onDelta(text);
      return {text,response,model:'speaking-analyze'};
    }catch(error:any){
      if(input.signal?.aborted) throw error;
      appLogger.error('speaking-api-fallback',error?.message||String(error));
      const response=buildClientSpeakingFallback(input.userText);
      input.onDelta(response.reply);
      return {text:response.reply,response,model:'client-fallback'};
    }
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
