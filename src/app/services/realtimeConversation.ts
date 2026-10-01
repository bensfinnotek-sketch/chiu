import type { TutorResponse, TutorMode, ConversationMessage } from '../types';
import { validateEmotion, type RealtimeSpeechState } from './realtimeTypes';
import { streamingTtsProvider } from './streamingTts';
import { getAvatarProvider } from './avatar';
import { lipSyncEngine } from './lipSync';
import { facialAnimationEngine } from './facialAnimation';
import { appLogger } from './logger';

export interface RealtimeConversationController {
  speak(text:string,options?:{rate?:0.75|1|1.25;emotion?:unknown}):Promise<void>;
  speakStream(chunks:AsyncIterable<string>|Iterable<string>,options?:{rate?:0.75|1|1.25;emotion?:unknown}):Promise<string>;
  beginStream(options?:{rate?:0.75|1|1.25;emotion?:unknown}):Promise<void>;
  pushStreamChunk(chunk:string):Promise<void>;
  endStream():void;
  interrupt():void;
  state():RealtimeSpeechState;
  destroy():void;
}

export class LinaRealtimeConversationController implements RealtimeConversationController {
  private current:AbortController|null=null;
  private snapshot:RealtimeSpeechState={status:'idle',text:'',audioState:'idle',avatarState:'idle',emotion:'neutral',lipSyncState:'inactive'};
  constructor(private readonly provider=streamingTtsProvider){}
  private update(p:Partial<RealtimeSpeechState>){this.snapshot={...this.snapshot,...p}}
  private streamFull='';
  private streaming=false;
  async beginStream(options:{rate?:0.75|1|1.25;emotion?:unknown}={}){this.interrupt();const emotion=validateEmotion(options.emotion);this.streamFull='';this.streaming=true;this.update({status:'speaking',text:'',audioState:'buffering',avatarState:'speaking',emotion,lipSyncState:'inactive',startedAt:Date.now()});getAvatarProvider().setState('speaking');await this.provider.start({rate:options.rate||1});}
  async pushStreamChunk(chunk:string){if(!this.streaming||!chunk)return;this.streamFull+=chunk;this.update({text:this.streamFull,audioState:'playing'});await this.provider.stream(chunk);}
  endStream(){if(!this.streaming)return;this.streaming=false;this.update({audioState:'ended',status:'idle',avatarState:'idle',endedAt:Date.now()});getAvatarProvider().setState(this.snapshot.emotion==='happy'?'happy':'idle');this.provider.stop();}
  async speak(text:string,options:{rate?:0.75|1|1.25;emotion?:unknown}={}){this.interrupt();const emotion=validateEmotion(options.emotion);this.update({status:'speaking',text,audioState:'buffering',avatarState:'speaking',emotion,lipSyncState:'inactive',startedAt:Date.now()});getAvatarProvider().setState('speaking');await this.provider.start({rate:options.rate||1});this.update({audioState:'playing'});try{await this.provider.stream(text);this.update({audioState:'ended',endedAt:Date.now(),status:'idle',avatarState:'idle'});getAvatarProvider().setState(emotion==='happy'?'happy':'idle')}catch(error){appLogger.error('tts-error',error);this.update({audioState:'error',status:'error',avatarState:'error'});getAvatarProvider().setState('error');throw error}finally{this.provider.stop()}}
  async speakStream(chunks:AsyncIterable<string>|Iterable<string>,options:{rate?:0.75|1|1.25;emotion?:unknown}={}){this.interrupt();const emotion=validateEmotion(options.emotion);this.update({status:'speaking',text:'',audioState:'buffering',avatarState:'speaking',emotion,lipSyncState:'inactive',startedAt:Date.now()});getAvatarProvider().setState('speaking');await this.provider.start({rate:options.rate||1});let full='';try{for await(const chunk of chunks){if(!chunk)continue;full+=chunk;this.update({text:full,audioState:'playing'});await this.provider.stream(chunk)}this.update({audioState:'ended',status:'idle',avatarState:'idle',endedAt:Date.now()});getAvatarProvider().setState(emotion==='happy'?'happy':'idle');return full}catch(error){appLogger.error('tts-error',error);this.update({audioState:'error',status:'error',avatarState:'error'});getAvatarProvider().setState('error');throw error}finally{this.provider.stop()}}
  interrupt(){this.current?.abort();this.current=null;this.provider.stop();lipSyncEngine.reset();this.update({status:'idle',audioState:'idle',avatarState:'idle',lipSyncState:'inactive'});getAvatarProvider().setState('idle')}
  state(){return {...this.snapshot}}
  destroy(){this.interrupt();this.provider.destroy()}
}
export const realtimeConversationController=new LinaRealtimeConversationController();
