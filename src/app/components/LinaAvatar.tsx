import React, { useEffect, useRef, useState } from 'react';
import { getAvatarProvider, linaAvatarDesign, type AvatarState } from '../services/avatar';

export function LinaAvatar({ state, compact=false }: { state:AvatarState; compact?:boolean }) {
  const [blink,setBlink]=useState(false);
  const stageRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ let timer:number|undefined; const schedule=()=>{ timer=window.setTimeout(()=>{ setBlink(true); window.setTimeout(()=>{setBlink(false);schedule();},110); },2800+Math.random()*2600); }; schedule(); return()=>{if(timer)window.clearTimeout(timer);}; },[]);
  useEffect(()=>{let frame=0;const tick=()=>{const stage=stageRef.current;const anim=getAvatarProvider().getAnimationState?.();if(stage&&anim?.lipSync){stage.style.setProperty('--lina-mouth-open',String(anim.lipSync.mouthOpen));stage.style.setProperty('--lina-mouth-width',String(anim.lipSync.mouthWidth));stage.style.setProperty('--lina-jaw-open',String(anim.lipSync.jawOpen));stage.style.setProperty('--lina-speech-intensity',String(anim.lipSync.intensity));}else if(stage){stage.style.setProperty('--lina-mouth-open','0');stage.style.setProperty('--lina-mouth-width','0.3');stage.style.setProperty('--lina-jaw-open','0');stage.style.setProperty('--lina-speech-intensity','0');}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[]);
  const aria=`${linaAvatarDesign.name}, ${state==='idle'?'sẵn sàng':state==='listening'?'đang lắng nghe':state==='thinking'?'đang suy nghĩ':state==='speaking'?'đang nói':state==='happy'?'vui':state==='encouraging'?'động viên':state==='confused'?'chưa hiểu rõ':state==='correcting'?'đang sửa nhẹ':'đang gặp lỗi'}`;
  return <div ref={stageRef} className={`lina-avatar-stage ${compact?'compact ':''}lina-avatar-stage-${state}`} role="img" aria-label={aria} data-avatar-provider={getAvatarProvider().id} data-lipsync="audio-driven-when-audio-source-is-available">
    <div className="lina-avatar-bust" aria-hidden="true">
      <div className="lina-avatar-hair-back"/><div className="lina-avatar-neck"/><div className="lina-avatar-shoulders"/>
      <div className="lina-avatar-face"><div className="lina-avatar-hair-front"/><span className={`lina-avatar-eye left ${blink?'blink':''}`}/><span className={`lina-avatar-eye right ${blink?'blink':''}`}/><span className="lina-avatar-brow left"/><span className="lina-avatar-brow right"/><span className="lina-avatar-nose"/><span className="lina-avatar-mouth"/></div>
      <div className="lina-avatar-ear left"/><div className="lina-avatar-ear right"/>
    </div><span className="sr-only">{aria}. Đây là avatar hoạt họa dự phòng, chưa phải avatar realtime.</span>
  </div>;
}