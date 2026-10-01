export type AvatarState='idle'|'listening'|'thinking'|'speaking'|'happy'|'encouraging'|'confused'|'error';

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

export interface AvatarProvider {
  readonly id:string;
  readonly capabilities:AvatarCapabilities;
  initialize():void;
  setState(state:AvatarState):void;
  getState():AvatarState;
  subscribe(listener:(state:AvatarState)=>void):()=>void;
  speak(text:string,options?:{rate?:0.75|1|1.25}):void;
  stop():void;
  destroy():void;
}

export const linaAvatarDesign:AvatarDesign={
  name:'Lina / 林娜',
  face:'fictional young adult Vietnamese-facing Mandarin tutor',
  hair:'dark shoulder-length hair',
  outfit:'warm modern tutor top',
  background:'soft neutral studio',
  expression:'friendly and attentive',
  lighting:'soft diffused',
  cameraAngle:'front-facing medium shot'
};

let state:AvatarState='idle';
let initialized=false;
const listeners=new Set<(state:AvatarState)=>void>();

export const linaAvatarProvider:AvatarProvider={
  id:'lina-animated-fallback',
  capabilities:{
    renderMode:'animated-fallback',
    realtime:false,
    streamingTts:false,
    lipSync:false,
    facialAnimation:true,
    webrtc:false
  },
  initialize(){initialized=true;state='idle';},
  setState(next){if(!initialized)initialized=true;if(state===next)return;state=next;listeners.forEach(fn=>fn(next));},
  getState(){return state;},
  subscribe(listener){listeners.add(listener);listener(state);return()=>listeners.delete(listener);},
  speak(){this.setState('speaking');},
  stop(){this.setState('idle');},
  destroy(){initialized=false;listeners.clear();state='idle';}
};
export const avatarService=linaAvatarProvider;



let activeAvatarProvider:AvatarProvider=linaAvatarProvider;
export function configureAvatarProvider(provider:AvatarProvider){activeAvatarProvider.destroy();activeAvatarProvider=provider;activeAvatarProvider.initialize();return activeAvatarProvider;}
export function getAvatarProvider(){return activeAvatarProvider;}
