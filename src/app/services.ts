import type { ConversationMessage, TutorResponse, TutorMode, TutorHint } from './types';
import { speechService } from './services/speech';
import { ttsService } from './services/tts';

export interface AiTutorService {
  respond(input:{userText:string;targetLevel?:string;topic?:string;mode?:TutorMode;conversationHistory?:ConversationMessage[];memory?:{summary?:string;keyFacts?:string[];vocabulary?:string[];grammarIssues?:string[]};difficulty?:'easy'|'normal'|'challenge';signal?:AbortSignal;}):Promise<TutorResponse>;
  hint(input:{prompt:string;targetLevel?:string;level:1|2|3|4;signal?:AbortSignal}):Promise<TutorHint>;
}
async function postJson<T>(url:string,body:unknown,signal?:AbortSignal):Promise<T>{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data?.error||'Đang gặp sự cố kết nối. Bạn thử lại nhé.');
  return data as T;
}
export const aiTutorService:AiTutorService={
  respond:(input)=>postJson<TutorResponse>('/api/ai/speaking',{userText:input.userText,targetLevel:input.targetLevel||'HSK 1',topic:input.topic||'Daily Life',mode:input.mode||'conversation',conversationHistory:(input.conversationHistory||[]).slice(-12),nativeLanguage:'vi',difficulty:input.difficulty||'normal',memory:input.memory},input.signal),
  hint:(input)=>postJson<TutorHint>('/api/ai/hint',{prompt:input.prompt,targetLevel:input.targetLevel||'HSK 1',level:input.level},input.signal),
};

export const speechToTextService={
  async start(onText:(text:string)=>void, onInterim?:(text:string)=>void, onError?:(message:string)=>void){
    await speechService.start({language:'zh-CN',callbacks:{onFinal:onText,onInterim,onError}});
  },
  stop(){speechService.stop();}, abort(){speechService.abort();}, isSupported(){return speechService.isSupported();}
};
export const textToSpeechService={
  async speak(text:string,rate:0.75|1|1.25=1){return ttsService.speakChinese(text,{rate,lang:'zh-CN'});},
  stop(){ttsService.stopSpeaking();}, pause(){ttsService.pauseSpeaking();}, resume(){ttsService.resumeSpeaking();}, isSupported(){return ttsService.isSupported();}
};
export const avatarService:{setState(state:'idle'|'listening'|'thinking'|'speaking'|'error'):void}={setState(){}};
