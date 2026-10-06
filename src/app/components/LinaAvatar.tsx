import React, { useEffect, useRef, useState } from 'react';
import { getAvatarProvider, linaAvatarDesign, type AvatarState } from '../services/avatar';
import avatarImage from './welcome-hero-800.webp';

const stateLabel: Record<AvatarState, string> = {
  idle:'sẵn sàng', listening:'đang lắng nghe', thinking:'đang suy nghĩ', speaking:'đang nói',
  happy:'vui', encouraging:'động viên', confused:'chưa hiểu rõ', correcting:'đang sửa nhẹ', error:'đang gặp lỗi'
};

export function LinaAvatar({ state, compact=false }: { state:AvatarState; compact?:boolean }) {
  const [blink,setBlink]=useState(false);
  const stageRef=useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    let timer:number|undefined;
    const schedule=()=>{
      timer=window.setTimeout(()=>{
        setBlink(true);
        window.setTimeout(()=>{setBlink(false);schedule();},110);
      },2800+Math.random()*2600);
    };
    schedule();
    return()=>{if(timer)window.clearTimeout(timer);};
  },[]);

  useEffect(()=>{
    let frame=0;
    const tick=()=>{
      const stage=stageRef.current;
      const anim=getAvatarProvider().getAnimationState?.();
      if(stage){
        const lip=anim?.lipSync;
        const facial=anim?.facial;
        stage.style.setProperty('--lina-mouth-open',String(lip?.mouthOpen??0));
        stage.style.setProperty('--lina-mouth-width',String(lip?.mouthWidth??.3));
        stage.style.setProperty('--lina-jaw-open',String(lip?.jawOpen??0));
        stage.style.setProperty('--lina-speech-intensity',String(lip?.intensity??0));
        stage.style.setProperty('--lina-smile',String(facial?.smile??0));
        stage.style.setProperty('--lina-brow',String(facial?.brow??0));
        stage.style.setProperty('--lina-head-tilt',String(facial?.headTilt??0));
        stage.style.setProperty('--lina-eye-focus',String(facial?.eyeFocus??0));
        stage.style.setProperty('--lina-nod',String(facial?.nod??0));
        stage.style.setProperty('--lina-jaw',String(facial?.jaw??0));
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[]);

  const aria=`${linaAvatarDesign.name}, ${stateLabel[state]}`;

  return <div ref={stageRef} className={`lina-avatar-stage ${compact?'compact ':''}lina-avatar-stage-${state}`} role="img" aria-label={aria} data-avatar-provider={getAvatarProvider().id} data-lipsync="audio-driven-when-audio-source-is-available">
    <div className="lina-avatar-photo-shell" aria-hidden="true">
      <div className="lina-avatar-photo-glow"/>
      <div className="lina-avatar-photo-motion">
        <img className={`lina-avatar-photo ${blink?'blink':''}`} src={avatarImage} alt="" draggable={false}/>
      </div>
      <div className="lina-avatar-photo-shade"/>
      <div className="lina-avatar-speech-ring"/>
      <div className="lina-avatar-state-orb"/>
    </div>
    <span className="lina-avatar-state-label" aria-hidden="true">{state==='idle'?'Lina':stateLabel[state]}</span>
    <span className="sr-only">{aria}. Ảnh Lina có chuyển động nhẹ theo trạng thái nói, nghe, suy nghĩ và cảm xúc.</span>
  </div>;
}
