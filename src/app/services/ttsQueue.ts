import type { StreamingTTSProvider } from './streamingTts';

export interface TTSQueueSnapshot { pending:string[]; current:string|null; completed:string[]; failed:string[]; }
export class TTSQueue {
  private pending:string[]=[];
  private running=false;
  private stopped=false;
  private current:string|null=null;
  private completed:string[]=[];
  private failed:string[]=[];
  private idleWaiters:Array<()=>void>=[];
  constructor(private readonly provider:StreamingTTSProvider, private readonly maxPending=8){}
  enqueue(chunk:string){const value=chunk.trim();if(!value||this.stopped)return false;if(this.pending.length>=this.maxPending)return false;this.pending.push(value);void this.drain();return true;}
  private async drain(){
    if(this.running||this.stopped)return;
    this.running=true;
    try{
      while(this.pending.length&&!this.stopped){
        this.current=this.pending.shift()||null;
        if(!this.current)continue;
        try{await this.provider.stream(this.current);this.completed.push(this.current);if(this.completed.length>32)this.completed.shift();}
        catch{this.failed.push(this.current);if(this.failed.length>32)this.failed.shift();}
        finally{this.current=null;}
      }
    }finally{this.current=null;this.running=false;const waiters=this.idleWaiters.splice(0);waiters.forEach(fn=>fn());}
  }
  clear(){this.pending=[];}
  stop(){this.stopped=true;this.clear();this.provider.stop();}
  resume(){this.stopped=false;void this.drain();}
  waitForIdle(){if(!this.running&&this.pending.length===0)return Promise.resolve();return new Promise<void>(resolve=>this.idleWaiters.push(resolve));}
  pendingCount(){return this.pending.length;}
  currentChunk(){return this.current;}
  snapshot():TTSQueueSnapshot{return {pending:[...this.pending],current:this.current,completed:[...this.completed],failed:[...this.failed]};}
}
