export type SpeechLanguage = 'zh-CN' | 'zh-TW' | 'en-US' | 'vi-VN';
export type SpeechState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionCallbacks {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onState?: (state: SpeechState) => void;
  onError?: (message: string) => void;
}
export interface SpeechService {
  start(options?: { language?: SpeechLanguage; callbacks?: SpeechRecognitionCallbacks }): Promise<void>;
  stop(): void;
  abort(): void;
  isSupported(): boolean;
}
type RecognitionLike = {
  lang:string; continuous:boolean; interimResults:boolean; maxAlternatives:number;
  start():void; stop():void; abort():void;
  onresult:((event:any)=>void)|null; onerror:((event:any)=>void)|null; onend:(()=>void)|null;
};
type RecognitionConstructor = new()=>RecognitionLike;
function getConstructor():RecognitionConstructor|null {
  if (typeof window==='undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}
function friendlyError(code:string) {
  if (code==='not-allowed'||code==='service-not-allowed') return 'Bạn chưa cấp quyền microphone.';
  if (code==='no-speech'||code==='audio-capture') return 'Mình chưa nghe rõ. Bạn thử nói chậm hơn nhé.';
  if (code==='network') return 'Đang gặp sự cố kết nối. Bạn thử lại nhé.';
  return 'Mình chưa nghe rõ. Bạn thử lại nhé.';
}
let current:RecognitionLike|null=null;
export const speechService:SpeechService = {
  start({language='zh-CN',callbacks={}}={}) {
    const Constructor=getConstructor();
    if (!Constructor) { const e=new Error('Trình duyệt này chưa hỗ trợ nhận diện giọng nói.'); callbacks.onError?.(e.message); callbacks.onState?.('error'); return Promise.reject(e); }
    return new Promise((resolve,reject)=>{
      const recognition=new Constructor(); current=recognition;
      let settled=false; let finalText='';
      recognition.lang=language; recognition.continuous=true; recognition.interimResults=true; recognition.maxAlternatives=1;
      callbacks.onState?.('listening');
      recognition.onresult=(event:any)=>{
        let interim='';
        for(let i=event.resultIndex||0;i<event.results.length;i+=1){
          const result=event.results[i]; const text=String(result[0]?.transcript||'').trim(); if(!text) continue;
          if(result.isFinal) finalText=[finalText,text].filter(Boolean).join(' ').trim(); else interim=[interim,text].filter(Boolean).join(' ').trim();
        }
        if(interim) callbacks.onInterim?.(interim);
        if(finalText) callbacks.onFinal?.(finalText);
      };
      recognition.onerror=(event:any)=>{
        const message=friendlyError(String(event?.error||'unknown')); callbacks.onError?.(message); callbacks.onState?.('error');
        if(!settled){settled=true;reject(new Error(message));}
      };
      recognition.onend=()=>{ callbacks.onState?.('idle'); if(!settled){settled=true;resolve();} if(current===recognition) current=null; };
      try { recognition.start(); } catch(error){ settled=true; callbacks.onState?.('error'); reject(error); }
    });
  },
  stop(){ current?.stop(); },
  abort(){ current?.abort(); current=null; },
  isSupported(){ return Boolean(getConstructor()); },
};