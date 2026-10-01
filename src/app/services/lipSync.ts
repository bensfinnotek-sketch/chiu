import type { AudioMetrics, LipSyncFrame, Viseme, VisemeFrame } from './realtimeTypes';

export interface LipSyncEngine { fromAudio(metrics:AudioMetrics):LipSyncFrame; fromViseme(frame:VisemeFrame):LipSyncFrame; reset():void; }

const visemeForVolume=(m:AudioMetrics):Viseme=>m.isSpeaking?'unknown':'silence';
export class AudioDrivenLipSync implements LipSyncEngine {
  fromAudio(m:AudioMetrics):LipSyncFrame { const intensity=Math.min(1,Math.max(0,m.energy*7)); return {timestamp:m.timestamp,mouthOpen:Math.min(1,intensity*.9),mouthWidth:Math.min(1,.25+intensity*.45),jawOpen:Math.min(1,intensity*.55),viseme:visemeForVolume(m),intensity}; }
  fromViseme(frame:VisemeFrame):LipSyncFrame { const open=frame.viseme==='silence'?0:Math.min(1,frame.intensity); return {timestamp:frame.timestamp,mouthOpen:open,mouthWidth:.3+open*.5,jawOpen:open*.55,viseme:frame.viseme,intensity:open}; }
  reset(){ }
}
export const lipSyncEngine=new AudioDrivenLipSync();
