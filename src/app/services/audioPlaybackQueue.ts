export interface AudioPlaybackItem { id:string; play(signal:AbortSignal):Promise<void>; }
export class AudioPlaybackQueue {
  private pending:AudioPlaybackItem[]=[];
  private current:AudioPlaybackItem|null=null;
  private controller:AbortController|null=null;
  private running=false;
  enqueue(item:AudioPlaybackItem){this.pending.push(item);void this.drain();}
  private async drain(){if(this.running)return;this.running=true;try{while(this.pending.length){const item=this.pending.shift();if(!item)continue;this.current=item;this.controller=new AbortController();await item.play(this.controller.signal).catch(()=>undefined);this.controller=null;this.current=null;}}finally{this.running=false;}}
  clear(){this.pending=[];}
  stop(){this.controller?.abort();this.controller=null;this.clear();this.current=null;}
  pause(){/* provider-specific pause is handled by the TTS/audio provider */}
  resume(){void this.drain();}
  size(){return this.pending.length+(this.current?1:0);}
}
