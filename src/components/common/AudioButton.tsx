import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { textToSpeechService } from '../../services/textToSpeechService';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  rate?: number;
  className?: string;
  label?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  size = 'md',
  rate = 0.9,
  className = '',
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      textToSpeechService.stopSpeaking();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    textToSpeechService.speakChinese(text, {
      rate,
      onStart: () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsLoading(false);
      },
      onError: () => {
        setIsPlaying(false);
        setIsLoading(false);
      },
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs gap-1',
    md: 'p-2 text-sm gap-1.5',
    lg: 'p-2.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Phát âm tiếng Trung: ${text}`}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isPlaying
          ? 'bg-[#E86F51] text-white shadow-sm ring-2 ring-[#E86F51]/30 animate-pulse'
          : 'bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] hover:bg-[#FCE2D8] dark:hover:bg-[#45332A]'
      } ${sizeClasses[size]} ${className}`}
      title={isPlaying ? 'Dừng phát âm' : 'Nghe phát âm chuẩn'}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="shrink-0 animate-spin" />
      ) : isPlaying ? (
        <div className="flex items-center gap-0.5 px-0.5">
          <span className="w-0.5 h-3 bg-white rounded-full animate-[bounce_0.6s_infinite_100ms]" />
          <span className="w-0.5 h-4 bg-white rounded-full animate-[bounce_0.6s_infinite_250ms]" />
          <span className="w-0.5 h-2.5 bg-white rounded-full animate-[bounce_0.6s_infinite_400ms]" />
        </div>
      ) : (
        <Volume2 size={iconSizes[size]} className="shrink-0" />
      )}
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
};
