import React from 'react';

export type LinaTeacherState =
  | 'idle' | 'listening' | 'thinking' | 'speaking'
  | 'happy' | 'encouraging' | 'confused' | 'error';

interface LinaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  state?: LinaTeacherState;
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
  showStatusBadge?: boolean;
}

const stateLabel: Record<LinaTeacherState, string> = {
  idle: 'Sẵn sàng',
  listening: 'Đang lắng nghe',
  thinking: 'Đang suy nghĩ',
  speaking: 'Đang nói',
  happy: 'Vui',
  encouraging: 'Đang động viên',
  confused: 'Chưa hiểu rõ',
  error: 'Có lỗi',
};

export const LinaAvatar: React.FC<LinaAvatarProps> = ({
  size = 'md', state, isSpeaking = false, isListening = false, className = '', showStatusBadge = true,
}) => {
  const effectiveState: LinaTeacherState = state || (isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle');
  const sizeMap = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-24 h-24', hero: 'w-32 h-32 md:w-40 md:h-40' };
  const expressive = effectiveState === 'happy' || effectiveState === 'encouraging';
  const attentive = effectiveState === 'listening' || effectiveState === 'thinking';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      role="img"
      aria-label={`Lina 林娜 · ${stateLabel[effectiveState]}`}
    >
      {(effectiveState === 'speaking' || effectiveState === 'happy' || effectiveState === 'encouraging') && (
        <span className="absolute -inset-2 rounded-full bg-[#E86F51]/20 animate-pulse pointer-events-none" />
      )}
      {effectiveState === 'listening' && (
        <span className="absolute -inset-2 rounded-full border-2 border-[#D5A85C]/70 animate-pulse pointer-events-none" />
      )}
      {effectiveState === 'thinking' && (
        <span className="absolute -inset-1.5 rounded-full border-2 border-[#8B72DE]/40 border-dashed animate-spin duration-[3000ms] pointer-events-none" />
      )}

      <div className={`${sizeMap[size]} rounded-full overflow-hidden border-2 border-white/90 dark:border-[#3D312A] shadow-md bg-gradient-to-br from-[#FFF0EB] via-[#FCE4DC] to-[#F5A28E]/40 flex items-center justify-center relative transition-transform duration-300 ${effectiveState === 'speaking' ? 'scale-105' : attentive ? 'scale-[1.02]' : 'hover:scale-105'}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="58" fill="#FFF2EC" />
          <circle cx="60" cy="60" r="48" fill="#FCE5DC" />

          <path d="M30 65C28 35 92 35 90 65C92 88 86 100 84 110H36C34 100 28 88 30 65Z" fill="#2D221E" />
          <path d="M24 115C26 92 40 85 60 85C80 85 94 92 96 115Z" fill="#E86F51" />
          <path d="M48 85L60 102L72 85Z" fill="#FFF" />
          <path d="M46 86L60 105L56 115H28Z" fill="#D35A3D" />
          <path d="M74 86L60 105L64 115H92Z" fill="#C44E32" />
          <path d="M52 74V87C52 92 68 92 68 87V74Z" fill="#FFD2BC" />
          <ellipse cx="60" cy="58" rx="23" ry="26" fill="#FFE2D3" />
          <path d="M36 50C44 40 54 44 62 43C70 42 80 40 84 52C86 58 85 64 83 68C81 60 78 52 70 50C60 48 50 56 36 50Z" fill="#2D221E" />
          <circle cx="36" cy="46" r="4.5" fill="#D5A85C" /><circle cx="36" cy="46" r="2.5" fill="#FFF9F4" />

          <path d={effectiveState === 'confused' ? 'M44 51Q50 48 54 51' : expressive ? 'M44 52Q50 48 54 51' : 'M44 51Q50 48 54 51'} stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d={effectiveState === 'confused' ? 'M66 49Q72 52 76 48' : expressive ? 'M66 51Q70 48 76 51' : 'M66 51Q70 48 76 51'} stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          <circle cx="49" cy="56" r="3.2" fill="#211A17" /><circle cx="71" cy="56" r="3.2" fill="#211A17" />
          <circle cx="48" cy="55" r="1.1" fill="#FFF" /><circle cx="70" cy="55" r="1.1" fill="#FFF" />
          <circle cx="49" cy="56" r="8" stroke="#D5A85C" strokeWidth="1.5" fill="none" />
          <circle cx="71" cy="56" r="8" stroke="#D5A85C" strokeWidth="1.5" fill="none" />
          <path d="M57 56H63" stroke="#D5A85C" strokeWidth="1.5" />

          <circle cx="43" cy="64" r="4" fill="#FFA590" opacity={expressive ? "0.55" : "0.4"} />
          <circle cx="77" cy="64" r="4" fill="#FFA590" opacity={expressive ? "0.55" : "0.4"} />
          <path d="M60 59L59 63L61 63" stroke="#E5B29B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {effectiveState === 'speaking' ? (
            <ellipse cx="60" cy="69" rx="7" ry="5" fill="#D0533C" className="animate-[pulse_700ms_ease-in-out_infinite]" />
          ) : effectiveState === 'confused' ? (
            <path d="M54 70Q60 66 66 70" stroke="#D0533C" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : expressive ? (
            <path d="M52 67Q60 76 68 67" stroke="#D0533C" strokeWidth="2.3" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M53 68Q60 74 67 68" stroke="#D0533C" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}

          <rect x="34" y="55" width="3" height="7" rx="1.5" fill="#716761" />
          <path d="M35 62Q42 70 48 69" stroke="#716761" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="69" r="1.5" fill="#E86F51" />
        </svg>
      </div>

      {showStatusBadge && (
        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-[#181412] rounded-full shadow-sm transition-colors ${
          effectiveState === 'speaking' ? 'bg-[#E86F51] animate-pulse ring-2 ring-[#E86F51]/30'
          : effectiveState === 'listening' ? 'bg-[#D5A85C] animate-pulse ring-2 ring-[#D5A85C]/30'
          : effectiveState === 'thinking' ? 'bg-[#8B72DE] animate-ping'
          : effectiveState === 'happy' ? 'bg-[#F0B24D]'
          : effectiveState === 'encouraging' ? 'bg-[#65A873] animate-pulse'
          : effectiveState === 'confused' ? 'bg-[#9A86D6]'
          : effectiveState === 'error' ? 'bg-[#D0533C]'
          : 'bg-[#65A873]'
        }`} title={`Lina: ${stateLabel[effectiveState]}`} />
      )}
    </div>
  );
};
