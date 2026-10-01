import type { TutorResponse } from '../types';
import { validateEmotion, type RealtimeSpeechState, type ValidatedEmotion } from './realtimeTypes';
import { streamingTtsProvider, type StreamingTTSProvider } from './streamingTts';
import { TTSQueue } from './ttsQueue';
import { SpeechChunker } from './speechChunker';
import { getAvatarProvider } from './avatar';
import { lipSyncEngine } from './lipSync';
import { facialAnimationEngine } from './facialAnimation';
import { audioAnalyzer } from './audioAnalyzer';

export interface RealtimeTurnMetrics { turnId:string; turnStartedAt:number; geminiFirstTokenAt?:number; ttsFirstChunkAt?:number; audioFirstPlayedAt?:number; turnCompletedAt?:number; ttftMs?:number; firstAudioLatencyMs?:number; totalTurnMs?:number; }
export interface RealtimeOrchestratorInput { rate?:0.75|1|1.25; signal?:AbortSignal; speak?:boolean; onText?:(text:string)=>void; onResponse?:(response:TutorResponse)=>void; }
export class RealtimeSpeechOrchestrator {
  private turnId=0;
  private abortController:AbortController|null=null;
  private chunker=new SpeechChunker();
  private queue:TTSQueue;
  private speakEnabled=true;
  private snapshot:RealtimeSpeechState={status:'idle',text:'',audioState:'idle',avatarState:'idle',emotion:'neutral',lipSyncState:'inactive'};
  private metricsState:RealtimeTurnMetrics|null=null;
  private unsubscribeAudio:()=>void;
  constructor(private readonly provider:StreamingTTSProvider=streamingTtsProvider){this.queue=new TTSQueue(provider);this.unsubscribeAudio=provider.onAudioChunk(()=>{if(provider.audioSource!=='none'&&this.metricsState&&!this.metricsState.audioFirstPlayedAt)this.metricsState.audioFirstPlayedAt=performance.now();});}
  private nextId(){this.turnId+=1;return 'turn_'+String(this.turnId).padStart(3,'0');}
  attachAudioSource(source:MediaStreamAudioSourceNode|AudioNode){audioAnalyzer.attach(source);audioAnalyzer.start(metrics=>this.setAudioMetrics(metrics));}
  detachAudioSource(){audioAnalyzer.stop();audioAnalyzer.destroy();}
  startConversationTurn(input:RealtimeOrchestratorInput={}){
    this.stopPreviousTurn();
    const controller=new AbortController();this.abortController=controller;
    input.signal?.addEventListener('abort',()=>controller.abort(),{once:true});
    const turnId=this.nextId();const started=performance.now();
    this.metricsState={turnId,turnStartedAt:started};this.chunker.reset();this.queue.resume();this.speakEnabled=input.speak!==false;
    this.snapshot={turnId,status:'thinking',text:'',audioState:'buffering',avatarState:'thinking',emotion:'neutral',lipSyncState:'inactive',startedAt:Date.now()};
    getAvatarProvider().setState('thinking');
    return {turnId,signal:controller.signal};
  }
  receiveUserInput(){this.snapshot={...this.snapshot,status:'thinking'};}
  receiveStreamingText(delta:string,input:RealtimeOrchestratorInput & {turnId?:string}={}){
    if(!delta||!this.metricsState||this.abortController?.signal.aborted||input.turnId&&input.turnId!==this.metricsState.turnId)return;
    if(!this.metricsState.geminiFirstTokenAt)this.metricsState.geminiFirstTokenAt=performance.now();
    this.snapshot={...this.snapshot,text:this.snapshot.text+delta,status:'speaking'};
    getAvatarProvider().setState('speaking');
    input.onText?.(delta);
    if(this.speakEnabled)for(const chunk of this.chunker.push(delta)){this.metricsState.ttsFirstChunkAt??=performance.now();this.queue.enqueue(chunk);}
  }
  async finalizeTurn(response?:TutorResponse){
    if(!this.metricsState)return;
    if(this.speakEnabled)for(const chunk of this.chunker.flush()){this.metricsState.ttsFirstChunkAt??=performance.now();this.queue.enqueue(chunk);}
    if(this.speakEnabled)await this.queue.waitForIdle();
    const done=performance.now();this.metricsState.turnCompletedAt=done;
    const m=this.metricsState;
    m.ttftMs=m.geminiFirstTokenAt?m.geminiFirstTokenAt-m.turnStartedAt:undefined;
    m.firstAudioLatencyMs=m.audioFirstPlayedAt?m.audioFirstPlayedAt-m.turnStartedAt:undefined;
    m.totalTurnMs=done-m.turnStartedAt;
    if(response){const emotion=validateEmotion(response.emotion);this.snapshot={...this.snapshot,emotion};getAvatarProvider().setEmotion?.(emotion);}
    this.snapshot={...this.snapshot,status:'idle',audioState:'ended',avatarState:'idle',endedAt:Date.now()};
    getAvatarProvider().setState(response?.emotion==='happy'?'happy':'idle');
    if(response) getAvatarProvider().setEmotion?.(validateEmotion(response.emotion));
  }
  setAudioMetrics(metrics:{volume:number;isSpeaking:boolean;energy:number;lowFrequency:number;midFrequency:number;highFrequency:number;timestamp:number}){
    if(!this.metricsState||this.abortController?.signal.aborted)return;
    const frame=lipSyncEngine.fromAudio(metrics);
    this.snapshot={...this.snapshot,lipSyncState:'audio-driven',audioState:metrics.isSpeaking?'playing':'paused'};
    getAvatarProvider().setLipSync?.(frame);
    const expression=facialAnimationEngine.expression(getAvatarProvider().getState(),this.snapshot.emotion,metrics);
    getAvatarProvider().setFacialExpression?.(expression);
  }
  stopPreviousTurn(){this.abortController?.abort();this.abortController=null;this.chunker.reset();this.queue.stop();lipSyncEngine.reset();getAvatarProvider().setLipSync?.({timestamp:performance.now(),mouthOpen:0,mouthWidth:0,jawOpen:0,viseme:'silence',intensity:0});getAvatarProvider().setState('idle');this.snapshot={...this.snapshot,status:'idle',audioState:'idle',avatarState:'idle',lipSyncState:'inactive'};}
  interrupt(){this.stopPreviousTurn();}
  metrics(){return this.metricsState?{...this.metricsState}:null;}
  state(){return {...this.snapshot};}
  destroy(){this.stopPreviousTurn();this.detachAudioSource();this.unsubscribeAudio();this.provider.destroy();}
}

export const realtimeSpeechOrchestrator=new RealtimeSpeechOrchestrator();
