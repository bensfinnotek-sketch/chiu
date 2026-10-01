import type { AudioMetrics } from './realtimeTypes';

export interface AudioAnalyzer { attach(source:MediaStreamAudioSourceNode|AudioNode):void; start(onMetrics:(metrics:AudioMetrics)=>void):void; stop():void; destroy():void; }

export class WebAudioAnalyzer implements AudioAnalyzer {
  private context:AudioContext|null=null; private analyser:AnalyserNode|null=null; private frame=0; private callback:((m:AudioMetrics)=>void)|null=null; private data:Float32Array<ArrayBuffer>|null=null;
  attach(source:MediaStreamAudioSourceNode|AudioNode){this.stop();this.context=source.context as AudioContext;this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.analyser.smoothingTimeConstant=.72;source.connect(this.analyser);this.data=new Float32Array(this.analyser.fftSize) as Float32Array<ArrayBuffer>;}
  start(onMetrics:(m:AudioMetrics)=>void){this.callback=onMetrics;if(!this.analyser||this.frame)return;const tick=()=>{if(!this.analyser||!this.data)return;this.analyser.getFloatTimeDomainData(this.data);let sum=0;for(const v of this.data)sum+=v*v;const energy=Math.sqrt(sum/this.data.length);const f=this.analyser.frequencyBinCount;const bands=new Uint8Array(f);this.analyser.getByteFrequencyData(bands);const third=Math.max(1,Math.floor(f/3));const avg=(from:number,to:number)=>{let s=0;for(let i=from;i<to;i++)s+=bands[i];return s/Math.max(1,to-from)/255};onMetrics({volume:Math.min(1,energy*4),energy,isSpeaking:energy>.025,lowFrequency:avg(0,third),midFrequency:avg(third,third*2),highFrequency:avg(third*2,f),timestamp:performance.now()});this.frame=requestAnimationFrame(tick)};this.frame=requestAnimationFrame(tick)}
  stop(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=0;this.callback=null}
  destroy(){this.stop();this.analyser?.disconnect();this.analyser=null;this.context=null;this.data=null}
}
export const audioAnalyzer=new WebAudioAnalyzer();
