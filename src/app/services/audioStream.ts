export interface AudioStreamController { play(source:MediaStream):Promise<void>; pause():void; resume():void; stop():void; destroy():void; }
export class BrowserAudioStreamController implements AudioStreamController {
  private context:AudioContext|null=null; private source:MediaStreamAudioSourceNode|null=null; private gain:GainNode|null=null;
  async play(stream:MediaStream){this.stop();this.context=this.context||new AudioContext();if(this.context.state==='suspended')await this.context.resume();this.source=this.context.createMediaStreamSource(stream);this.gain=this.context.createGain();this.source.connect(this.gain);this.gain.connect(this.context.destination);}
  pause(){this.gain?.gain.setTargetAtTime(0,this.context?.currentTime||0,.01)}
  resume(){this.gain?.gain.setTargetAtTime(1,this.context?.currentTime||0,.01)}
  stop(){this.source?.disconnect();this.gain?.disconnect();this.source=null;this.gain=null}
  destroy(){this.stop();void this.context?.close();this.context=null}
}
export const audioStreamController=new BrowserAudioStreamController();
