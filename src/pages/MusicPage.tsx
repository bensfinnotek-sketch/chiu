import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Music as MusicIcon,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CHINESE_SONGS } from '../data/songsData';
import { SongItem } from '../types';
import { voiceService } from '../services/voiceService';

export const MusicPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentSong, setCurrentSong] = useState<SongItem>(CHINESE_SONGS[0]);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play line audio
  const playLyricLine = (index: number) => {
    setActiveLineIndex(index);
    const line = currentSong.lyrics[index];
    if (line) {
      voiceService.speakText(line.chinese, {
        rate: 0.85,
        onEnd: () => {
          if (isPlaying && index < currentSong.lyrics.length - 1) {
            playLyricLine(index + 1);
          } else {
            setIsPlaying(false);
          }
        },
      });
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      voiceService.stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playLyricLine(activeLineIndex);
    }
  };

  const handleNextSong = () => {
    voiceService.stopSpeaking();
    setIsPlaying(false);
    const currentIndex = CHINESE_SONGS.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % CHINESE_SONGS.length;
    setCurrentSong(CHINESE_SONGS[nextIndex]);
    setActiveLineIndex(0);
  };

  const handlePrevSong = () => {
    voiceService.stopSpeaking();
    setIsPlaying(false);
    const currentIndex = CHINESE_SONGS.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + CHINESE_SONGS.length) % CHINESE_SONGS.length;
    setCurrentSong(CHINESE_SONGS[prevIndex]);
    setActiveLineIndex(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716761] hover:text-[#E86F51] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh mục công cụ</span>
      </button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Học tiếng Trung qua bài hát
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Thưởng thức âm nhạc, luyện ngữ điệu tự nhiên với lời bài hát đồng bộ Pinyin và dịch nghĩa
        </p>
      </div>

      {/* Song Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CHINESE_SONGS.map((song) => {
          const isSelected = song.id === currentSong.id;
          return (
            <button
              key={song.id}
              type="button"
              onClick={() => {
                voiceService.stopSpeaking();
                setIsPlaying(false);
                setCurrentSong(song);
                setActiveLineIndex(0);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#E86F51] text-white shadow-md shadow-[#E86F51]/20'
                  : 'bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 text-[#716761]'
              }`}
            >
              {song.title}
            </button>
          );
        })}
      </div>

      {/* Main Music Player Stage */}
      <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/20 shadow-xl space-y-8">
        {/* Track info & Cover */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={currentSong.coverImage}
            alt={currentSong.title}
            referrerPolicy="no-referrer"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-white/10"
          />
          <div className="text-center sm:text-left space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">
              {currentSong.hskLevel} · {currentSong.difficulty}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-chinese text-[#211A17] dark:text-white">
              {currentSong.title}
            </h2>
            <p className="text-sm font-bold text-[#D5A85C]">
              Ca sĩ: {currentSong.artist}
            </p>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Nhấn vào bất kỳ câu hát nào bên dưới để nghe đọc chậm từng câu!
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-6 py-2 border-y border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={handlePrevSong}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#716761]"
          >
            <SkipBack size={20} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-[#E86F51] text-white flex items-center justify-center shadow-lg shadow-[#E86F51]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            type="button"
            onClick={handleNextSong}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#716761]"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Synchronized Karaoke Lyrics Display */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
          {currentSong.lyrics.map((line, idx) => {
            const isCurrent = activeLineIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => playLyricLine(idx)}
                className={`p-4 rounded-2xl transition-all cursor-pointer text-left space-y-1 ${
                  isCurrent
                    ? 'bg-[#FFF0EB] dark:bg-[#342822] border-2 border-[#E86F51] scale-[1.02] shadow-sm'
                    : 'bg-[#FFF9F4]/70 dark:bg-[#181412] hover:bg-[#FFF0EB]/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`font-chinese text-lg sm:text-xl font-bold ${
                      isCurrent ? 'text-[#E86F51]' : 'text-[#211A17] dark:text-white'
                    }`}
                  >
                    {line.chinese}
                  </p>
                  {isCurrent && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E86F51] animate-ping" />
                  )}
                </div>
                <p className="text-xs font-semibold text-[#D5A85C]">{line.pinyin}</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                  {line.translationVi}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
