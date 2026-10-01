export type TtsSpeed=0.75|1|1.25;
export interface TtsOptions { rate?:TtsSpeed; voiceName?:string; lang?:string; }
export interface TtsService {
  speakChinese(text:string,options?:TtsOptions):Promise<void>;
  stopSpeaking():void; pauseSpeaking():void; resumeSpeaking():void;
  isSupported():boolean; getChineseVoices():SpeechSynthesisVoice[];
}
function synth():SpeechSynthesis|null { return typeof window!=='undefined'&&'speechSynthesis' in window?window.speechSynthesis:null; }
export const ttsService:TtsService={
  speakChinese(text,options={}){
    const s=synth(); if(!s) return Promise.reject(new Error('tts-unavailable')); const value=text.trim(); if(!value)return Promise.resolve();
    s.cancel(); const u=new SpeechSynthesisUtterance(value); u.lang=options.lang||'zh-CN'; u.rate=options.rate||1; u.pitch=1;
    const voice=s.getVoices().find(v=>v.name===options.voiceName)||s.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh-cn')); if(voice)u.voice=voice;
    return new Promise((resolve,reject)=>{u.onend=()=>resolve();u.onerror=()=>reject(new Error('tts-playback-failed'));s.speak(u);});
  },
  stopSpeaking(){synth()?.cancel();}, pauseSpeaking(){synth()?.pause();}, resumeSpeaking(){synth()?.resume();},
  isSupported(){return Boolean(synth());}, getChineseVoices(){return synth()?.getVoices().filter(v=>v.lang.toLowerCase().startsWith('zh'))||[];}
};