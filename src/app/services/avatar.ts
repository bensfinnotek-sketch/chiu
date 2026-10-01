export type AvatarState='idle'|'listening'|'thinking'|'speaking'|'happy'|'encouraging'|'confused'|'error';
export interface AvatarDesign { face:string; hair:string; outfit:string; background:string; expression:string; lighting:string; cameraAngle:string; }
export interface AvatarProvider {
  initialize():void;
  setState(state:AvatarState):void;
  getState():AvatarState;
  subscribe(listener:(state:AvatarState)=>void):()=>void;
  speak(text:string,options?:{rate?:0.75|1|1.25}):void;
  stop():void;
  destroy():void;
}
const design:AvatarDesign={face:'semi-realistic fictional young adult woman',hair:'dark shoulder-length hair',outfit:'warm modern tutor outfit',background:'soft neutral studio',expression:'friendly',lighting:'soft diffused',cameraAngle:'front-facing portrait'};
let state:AvatarState='idle';
const listeners=new Set<(state:AvatarState)=>void>();
export const linaAvatarProvider:AvatarProvider={
  initialize(){state='idle';},
  setState(next){state=next;listeners.forEach(fn=>fn(next));},
  getState(){return state;},
  subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
  speak(){this.setState('speaking');},
  stop(){this.setState('idle');},
  destroy(){listeners.clear();},
};
export const linaAvatarDesign=design;
