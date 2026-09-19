import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';

export type MicrophoneState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'DISABLED' | 'ERROR';

interface MicrophoneButtonProps {
  state?: MicrophoneState;
  isListening?: boolean;
  isProcessing?: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'normal' | 'large';
  statusText?: string;
  errorMessage?: string;
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  state,
  isListening = false,
  isProcessing = false,
  onClick,
  disabled = false,
  size = 'large',
  statusText,
  errorMessage,
  className = '',
}) => {
  // Derive effective state
  const effectiveState: MicrophoneState =
    state ||
    (errorMessage
      ? 'ERROR'
      : isProcessing
      ? 'PROCESSING'
      : isListening
      ? 'LISTENING'
      : disabled
      ? 'DISABLED'
      : 'IDLE');

  // Elapsed recording timer
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (effectiveState === 'LISTENING') {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [effectiveState]);

  // Format seconds as mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLarge = size === 'large';

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Animated concentric rings while listening */}
        {effectiveState === 'LISTENING' && (
          <>
            <div className="absolute -inset-4 rounded-full bg-[#E86F51]/25 animate-ping duration-1000 pointer-events-none" />
            <div className="absolute -inset-7 rounded-full border-2 border-[#E86F51]/40 animate-pulse duration-700 pointer-events-none" />
          </>
        )}

        <button
          type="button"
          onClick={onClick}
          disabled={effectiveState === 'DISABLED' || effectiveState === 'PROCESSING'}
          aria-label={
            effectiveState === 'LISTENING'
              ? 'Dừng ghi âm (Stop listening)'
              : effectiveState === 'PROCESSING'
              ? 'Đang xử lý (Processing)'
              : 'Bắt đầu nói tiếng Trung (Start speaking)'
          }
          className={`relative z-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isLarge ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14'
          } ${
            effectiveState === 'LISTENING'
              ? 'bg-[#E86F51] text-white shadow-xl shadow-[#E86F51]/40 scale-105 ring-4 ring-[#E86F51]/30'
              : effectiveState === 'PROCESSING'
              ? 'bg-[#D5A85C] text-white animate-pulse'
              : effectiveState === 'ERROR'
              ? 'bg-[#D0533C] text-white shadow-md'
              : 'bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] text-white hover:shadow-xl hover:shadow-[#E86F51]/30 hover:scale-105'
          }`}
        >
          {effectiveState === 'PROCESSING' ? (
            <Loader2 className={`animate-spin ${isLarge ? 'w-9 h-9' : 'w-6 h-6'}`} />
          ) : effectiveState === 'LISTENING' ? (
            <div className="flex items-center gap-1">
              {/* Equalizer bars */}
              <span className="w-1 bg-white rounded-full h-3 animate-[bounce_0.6s_infinite_100ms]" />
              <span className="w-1 bg-white rounded-full h-6 animate-[bounce_0.6s_infinite_200ms]" />
              <span className="w-1 bg-white rounded-full h-9 animate-[bounce_0.6s_infinite_300ms]" />
              <span className="w-1 bg-white rounded-full h-6 animate-[bounce_0.6s_infinite_400ms]" />
              <span className="w-1 bg-white rounded-full h-3 animate-[bounce_0.6s_infinite_500ms]" />
            </div>
          ) : effectiveState === 'ERROR' ? (
            <AlertCircle className={`${isLarge ? 'w-9 h-9' : 'w-6 h-6'}`} />
          ) : effectiveState === 'DISABLED' ? (
            <MicOff className={`${isLarge ? 'w-8 h-8' : 'w-5 h-5'} opacity-60`} />
          ) : (
            <Mic className={`${isLarge ? 'w-9 h-9' : 'w-6 h-6'}`} />
          )}
        </button>
      </div>

      {/* Recording timer & label badge */}
      {effectiveState === 'LISTENING' ? (
        <div className="flex items-center gap-2 bg-[#E86F51]/10 dark:bg-[#E86F51]/20 px-3 py-1 rounded-full text-xs font-semibold text-[#E86F51] tracking-wider animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#E86F51] animate-ping" />
          <span>{formatTimer(seconds)}</span>
          <span className="text-[11px] font-normal opacity-80">• Đang lắng nghe...</span>
        </div>
      ) : statusText ? (
        <p className="text-xs sm:text-sm font-medium text-[#716761] dark:text-[#A89E97] text-center max-w-xs">
          {statusText}
        </p>
      ) : null}

      {errorMessage && (
        <p className="text-xs text-[#D0533C] dark:text-[#F08080] text-center max-w-xs font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
