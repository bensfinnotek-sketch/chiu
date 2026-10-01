import type { AvatarState } from './avatar';
import type { FacialExpression, ValidatedEmotion } from './realtimeTypes';

export interface FacialAnimationEngine { expression(state:AvatarState,emotion:ValidatedEmotion,metrics?:{volume:number;isSpeaking:boolean}):FacialExpression; }

export class SubtleFacialAnimation implements FacialAnimationEngine {
  expression(state:AvatarState,emotion:ValidatedEmotion,metrics={volume:0,isSpeaking:false}):FacialExpression {
    const smile=emotion==='happy'?1:emotion==='encouraging'?.78:emotion==='correcting'?.18:0;
    const brow=emotion==='confused'?.65:emotion==='curious'?.25:emotion==='correcting'?.35:0;
    return {smile,brow,eyeFocus:state==='listening'||state==='thinking'?1:.72,headTilt:state==='confused'?.18:0,nod:state==='encouraging'?.25:0,jaw:metrics.isSpeaking?Math.min(1,metrics.volume):0};
  }
}
export const facialAnimationEngine=new SubtleFacialAnimation();
