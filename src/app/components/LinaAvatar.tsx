import React, { useEffect, useRef } from 'react';
import { getAvatarProvider, linaAvatarDesign, type AvatarState } from '../services/avatar';
import avatarImage from './welcome-hero-800.webp';

const stateLabel: Record<AvatarState, string> = {
  idle: 'sẵn sàng',
  listening: 'đang lắng nghe',
  thinking: 'đang suy nghĩ',
  speaking: 'đang nói',
  happy: 'vui',
  encouraging: 'động viên',
  confused: 'chưa hiểu rõ',
  correcting: 'đang sửa nhẹ',
  error: 'đang gặp lỗi',
};

export function LinaAvatar({ state, compact = false }: { state: AvatarState; compact?: boolean }) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frame = 0;

    const tick = () => {
      const stage = stageRef.current;
      const anim = getAvatarProvider().getAnimationState?.();

      if (stage) {
        const lip = anim?.lipSync;
        const facial = anim?.facial;
        stage.style.setProperty('--lina-mouth-open', String(lip?.mouthOpen ?? 0));
        stage.style.setProperty('--lina-mouth-width', String(lip?.mouthWidth ?? 0.3));
        stage.style.setProperty('--lina-jaw-open', String(lip?.jawOpen ?? 0));
        stage.style.setProperty('--lina-speech-intensity', String(lip?.intensity ?? 0));
        stage.style.setProperty('--lina-smile', String(facial?.smile ?? 0));
        stage.style.setProperty('--lina-brow', String(facial?.brow ?? 0));
        stage.style.setProperty('--lina-head-tilt', String(facial?.headTilt ?? 0));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const aria = `${linaAvatarDesign.name}, ${stateLabel[state]}`;

  return (
    <div
      ref={stageRef}
      className={`lina-avatar-stage ${compact ? 'compact ' : ''}lina-avatar-stage-${state}`}
      role="img"
      aria-label={aria}
      data-avatar-provider={getAvatarProvider().id}
      data-lipsync="audio-driven-when-audio-source-is-available"
    >
      <div className="lina-avatar-photo-shell" aria-hidden="true">
        <div className="lina-avatar-photo-glow" />
        <img className="lina-avatar-photo" src={avatarImage} alt="" draggable={false} />
        <div className="lina-avatar-photo-shade" />
        <div className="lina-avatar-state-orb" />
      </div>

      <span className="lina-avatar-state-label" aria-hidden="true">
        {state === 'idle' ? 'Lina' : stateLabel[state]}
      </span>

      <span className="sr-only">
        {aria}. Avatar ảnh mới được dùng làm preview; animation realtime vẫn được giữ ở lớp trạng thái.
      </span>
    </div>
  );
}
