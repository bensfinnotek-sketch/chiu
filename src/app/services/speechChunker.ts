export class SpeechChunker {
  private buffer='';
  private readonly maxChunkLength=96;
  push(text:string):string[]{this.buffer+=text;return this.drain(false);}
  flush():string[]{return this.drain(true);}
  reset(){this.buffer='';}
  private drain(force:boolean):string[]{
    const out:string[]=[];
    while(this.buffer){
      const match=this.buffer.match(/^(.{1,96}?[。！？!?；;\n]+)(?:\s*)/u);
      if(match){out.push(match[1].trim());this.buffer=this.buffer.slice(match[0].length);continue;}
      if(this.buffer.length>=this.maxChunkLength){
        const boundary=this.findBoundary(this.buffer);
        if(boundary>12){out.push(this.buffer.slice(0,boundary).trim());this.buffer=this.buffer.slice(boundary).trim();continue;}
      }
      break;
    }
    if(force&&this.buffer.trim()){out.push(this.buffer.trim());this.buffer='';}
    return out.filter(Boolean);
  }
  private findBoundary(text:string){const candidates=[...text.matchAll(/[，、,\s]/gu)].map(m=>m.index??-1).filter(i=>i>0&&i<text.length-1);return candidates.length?candidates[candidates.length-1]+1:-1;}
}

export const speechChunker=new SpeechChunker();
