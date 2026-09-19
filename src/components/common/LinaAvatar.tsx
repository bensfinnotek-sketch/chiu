import React from 'react';

export type LinaTeacherState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface LinaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  state?: LinaTeacherState;
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
  showStatusBadge?: boolean;
}

export const LinaAvatar: React.FC<LinaAvatarProps> = ({
  size = 'md',
  state,
  isSpeaking = false,
  isListening = false,
  className = '',
  showStatusBadge = true,
}) => {
  const effectiveState: LinaTeacherState =
    state || (isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle');

  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    hero: 'w-32 h-32 md:w-40 md:h-40',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {/* Animated aura rings */}
      {effectiveState === 'speaking' && (
        <span className="absolute -inset-2 rounded-full bg-[#E86F51]/25 animate-ping duration-1000 pointer-events-none" />
      )}
      {effectiveState === 'listening' && (
        <span className="absolute -inset-2 rounded-full border-2 border-[#D5A85C] animate-pulse pointer-events-none" />
      )}
      {effectiveState === 'thinking' && (
        <span className="absolute -inset-1.5 rounded-full border-2 border-[#E86F51]/40 border-dashed animate-spin duration-3000 pointer-events-none" />
      )}

      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden border-2 border-white/90 dark:border-[#3D312A] shadow-md bg-gradient-to-br from-[#FFF0EB] via-[#FCE4DC] to-[#F5A28E]/40 flex items-center justify-center relative transition-transform ${
          effectiveState === 'speaking' ? 'scale-105' : 'hover:scale-105'
        }`}
      >
        {/* Custom Original Vector Illustration of AI Teacher Lina */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background aura */}
          <circle cx="60" cy="60" r="58" fill="#FFF2EC" />
          <circle cx="60" cy="60" r="48" fill="#FCE5DC" />

          {/* Hair back */}
          <path
            d="M 30 65 C 28 35, 92 35, 90 65 C 92 88, 86 100, 84 110 L 36 110 C 34 100, 28 88, 30 65 Z"
            fill="#2D221E"
          />

          {/* Shoulders & Jacket */}
          <path
            d="M 24 115 C 26 92, 40 85, 60 85 C 80 85, 94 92, 96 115 Z"
            fill="#E86F51"
          />
          {/* Inner shirt collar */}
          <path
            d="M 48 85 L 60 102 L 72 85 Z"
            fill="#FFFFFF"
          />
          {/* Jacket lapel */}
          <path
            d="M 46 86 L 60 105 L 56 115 L 28 115 Z"
            fill="#D35A3D"
          />
          <path
            d="M 74 86 L 60 105 L 64 115 L 92 115 Z"
            fill="#C44E32"
          />

          {/* Neck */}
          <path
            d="M 52 74 L 52 87 C 52 92, 68 92, 68 87 L 68 74 Z"
            fill="#FFD2BC"
          />

          {/* Face */}
          <ellipse cx="60" cy="58" rx="23" ry="26" fill="#FFE2D3" />

          {/* Hair front bangs */}
          <path
            d="M 36 50 C 44 40, 54 44, 62 43 C 70 42, 80 40, 84 52 C 86 58, 85 64, 83 68 C 81 60, 78 52, 70 50 C 60 48, 50 56, 36 50 Z"
            fill="#2D221E"
          />

          {/* Hair pin / educational accessory */}
          <circle cx="36" cy="46" r="4.5" fill="#D5A85C" />
          <circle cx="36" cy="46" r="2.5" fill="#FFF9F4" />

          {/* Eyebrows */}
          <path d="M 44 51 Q 50 48 54 51" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M 66 51 Q 70 48 76 51" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Eyes (warm, smiling, friendly expression) */}
          <circle cx="49" cy="56" r="3.2" fill="#211A17" />
          <circle cx="71" cy="56" r="3.2" fill="#211A17" />
          {/* Eye shines */}
          <circle cx="48" cy="55" r="1.1" fill="#FFFFFF" />
          <circle cx="70" cy="55" r="1.1" fill="#FFFFFF" />

          {/* Teacher glasses (chic rose-gold round spectacles) */}
          <circle cx="49" cy="56" r="8" stroke="#D5A85C" strokeWidth="1.5" fill="none" />
          <circle cx="71" cy="56" r="8" stroke="#D5A85C" strokeWidth="1.5" fill="none" />
          <path d="M 57 56 L 63 56" stroke="#D5A85C" strokeWidth="1.5" />

          {/* Cheeks blush */}
          <circle cx="43" cy="64" r="4" fill="#FFA590" opacity="0.4" />
          <circle cx="77" cy="64" r="4" fill="#FFA590" opacity="0.4" />

          {/* Cute subtle nose */}
          <path d="M 60 59 L 59 63 L 61 63" stroke="#E5B29B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Smile / Mouth state */}
          {effectiveState === 'speaking' ? (
            <path
              d="M 54 67 Q 60 74 66 67 Z"
              fill="#D0533C"
            />
          ) : (
            <path
              d="M 53 68 Q 60 74 67 68"
              stroke="#D0533C"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Earpiece headset for AI language coaching */}
          <rect x="34" y="55" width="3" height="7" rx="1.5" fill="#716761" />
          <path d="M 35 62 Q 42 70 48 69" stroke="#716761" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="69" r="1.5" fill="#E86F51" />
        </svg>
      </div>

      {/* Online / status badge */}
      {showStatusBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-[#181412] rounded-full shadow-sm transition-colors ${
            effectiveState === 'speaking'
              ? 'bg-[#E86F51] animate-pulse ring-2 ring-[#E86F51]/30'
              : effectiveState === 'listening'
              ? 'bg-[#D5A85C] animate-pulse ring-2 ring-[#D5A85C]/30'
              : effectiveState === 'thinking'
              ? 'bg-[#8B72DE] animate-ping'
              : effectiveState === 'error'
              ? 'bg-[#D0533C]'
              : 'bg-[#65A873]'
          }`}
          title={`Lina: ${effectiveState}`}
        />
      )}
    </div>
  );
};
