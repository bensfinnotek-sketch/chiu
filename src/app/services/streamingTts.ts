import type { TtsSpeed } from './tts';

export interface StreamingTTSProvider {
  readonly id:string;
  readonly streamingAudio:boolean;
  readonly audioSource:'none'|'pcm'|'media-element';
  start(options?:{rate?:TtsSpeed;lang?:string}):Promise<void>;
  stream(textChunk:string):Promise<void>;
  pause():void; resume():void; stop():void;
  onAudioChunk(listener:(chunk:unknown)=>void):()=>void;
  onStart(listener:()=>void):()=>void;
  onEnd(listener:()=>void):()=>void;
  onError(listener:(error:Error)=>void):()=>void;
  destroy():void;
}

export class BrowserChunkedTTSProvider implements StreamingTTSProvider {
  readonly id='browser-speech-chunked'; readonly streamingAudio=false; readonly audioSource='none' as const;
  private rate:TtsSpeed=1; private lang='zh-CN'; private queue:Promise<void>=Promise.resolve(); private stopped=false;
  private starts=new Set<()=>void>(); private ends=new Set<()=>void>(); private errors=new Set<(e:Error)=>void>(); private chunks=new Set<(c:unknown)=>void>();
  async start(options:{rate?:TtsSpeed;lang?:string}={}){this.rate=options.rate||1;this.lang=options.lang||'zh-CN';this.stopped=false;synth()?.cancel();this.starts.forEach(fn=>fn())}
  async stream(textChunk:string){const text=textChunk.trim();if(!text||this.stopped)return;this.queue=this.queue.then(()=>this.say(text));await this.queue}
  private say(text:string){return new Promise<void>((resolve,reject)=>{const s=synth();if(!s){const e=new Error('tts-unavailable');this.errors.forEach(fn=>fn(e));reject(e);return}const u=new SpeechSynthesisUtterance(text);u.lang=this.lang;u.rate=this.rate;u.onend=()=>{this.chunks.forEach(fn=>fn(text));resolve()};u.onerror=()=>{const e=new Error('tts-playback-failed');this.errors.forEach(fn=>fn(e));reject(e)};s.speak(u)})}
  pause(){synth()?.pause()} resume(){synth()?.resume()}
  stop(){this.stopped=true;synth()?.cancel();this.queue=Promise.resolve();this.ends.forEach(fn=>fn())}
  onAudioChunk(fn:(c:unknown)=>void){this.chunks.add(fn);return()=>this.chunks.delete(fn)} onStart(fn:()=>void){this.starts.add(fn);return()=>this.starts.delete(fn)} onEnd(fn:()=>void){this.ends.add(fn);return()=>this.ends.delete(fn)} onError(fn:(e:Error)=>void){this.errors.add(fn);return()=>this.errors.delete(fn)}
  destroy(){this.stop();this.starts.clear();this.ends.clear();this.errors.clear();this.chunks.clear()}
}
function synth():SpeechSynthesis|null{return typeof window!=='undefined'&&'speechSynthesis' in window?window.speechSynthesis:null}
export const streamingTtsProvider=new BrowserChunkedTTSProvider();
