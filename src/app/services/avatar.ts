export type AvatarState='idle'|'listening'|'thinking'|'speaking'|'happy'|'encouraging'|'confused'|'correcting'|'error';

export type AvatarRenderMode='animated-fallback'|'live-provider';

export interface AvatarDesign {
  name:string;
  face:string;
  hair:string;
  outfit:string;
  background:string;
  expression:string;
  lighting:string;
  cameraAngle:string;
}

export interface AvatarCapabilities {
  renderMode:AvatarRenderMode;
  realtime:boolean;
  streamingTts:boolean;
  lipSync:boolean;
  facialAnimation:boolean;
  webrtc:boolean;
}

export interface AvatarAnimationState { lipSync?:import('./realtimeTypes').LipSyncFrame; facial?:import('./realtimeTypes').FacialExpression; emotion?:'neutral'|'happy'|'encouraging'|'curious'|'confused'|'correcting'; viseme?:import('./realtimeTypes').Viseme; }

export interface AvatarProvider {
  readonly id:string;
  readonly capabilities:AvatarCapabilities;
  initialize():void;
  setState(state:AvatarState):void;
  getState():AvatarState;
  subscribe(listener:(state:AvatarState)=>void):()=>void;
  speak(text:string,options?:{rate?:0.75|1|1.25}):void;
  setEmotion?(emotion:'neutral'|'happy'|'encouraging'|'curious'|'confused'|'correcting'):void;
  setLipSync?(frame:import('./realtimeTypes').LipSyncFrame):void;
  setFacialExpression?(expression:import('./realtimeTypes').FacialExpression):void;
  setViseme?(viseme:import('./realtimeTypes').Viseme):void;
  getAnimationState?():AvatarAnimationState;
  stop():void;
  destroy():void;
}

export const linaAvatarDesign:AvatarDesign={
  name:'Lina / 林娜',
  face:'fictional young adult Mandarin tutor with an original face; proportions inspired by a 4:3 medium bust reference',
  hair:'dark shoulder-length hair',
  outfit:'soft dusty-rose ribbed tutor top with a modest scoop neckline',
  background:'soft neutral studio composition, 4:3 bust framing',
  expression:'friendly and attentive',
  lighting:'soft diffused',
  cameraAngle:'front-facing 4:3 medium bust shot with wider shoulders and optional raised-hand greeting'
};

let state:AvatarState='idle';
let initialized=false;
let animation:AvatarAnimationState={};
const listeners=new Set<(state:AvatarState)=>void>();

export const linaAvatarProvider:AvatarProvider={
  id:'lina-animated-fallback',
  capabilities:{
    renderMode:'animated-fallback',
    realtime:false,
    streamingTts:false,
    lipSync:true,
    facialAnimation:true,
    webrtc:false
  },
  initialize(){initialized=true;state='idle';},
  setState(next){if(!initialized)initialized=true;if(state===next)return;state=next;listeners.forEach(fn=>fn(next));},
  setEmotion(emotion){animation.emotion=emotion;},
  setLipSync(frame){animation.lipSync=frame;},
  setFacialExpression(expression){animation.facial=expression;},
  setViseme(viseme){animation.viseme=viseme;},
  getAnimationState(){return {...animation}},
  getState(){return state;},
  subscribe(listener){listeners.add(listener);listener(state);return()=>listeners.delete(listener);},
  speak(){this.setState('speaking');},
  stop(){this.setState('idle');},
  destroy(){initialized=false;listeners.clear();state='idle';animation={};}
};

let activeAvatarProvider:AvatarProvider=linaAvatarProvider;
export function configureAvatarProvider(provider:AvatarProvider){activeAvatarProvider.destroy();activeAvatarProvider=provider;activeAvatarProvider.initialize();return activeAvatarProvider;}
export function getAvatarProvider(){return activeAvatarProvider;}
