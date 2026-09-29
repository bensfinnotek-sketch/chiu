import React, { useMemo, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, ArrowLeft } from 'lucide-react';
import { CHINESE_SONGS } from '../data/songsData';
import { SongItem } from '../types';
import { voiceService } from '../services/voiceService';
import { flashcardService } from '../services/flashcardService';

export const MusicPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentSong, setCurrentSong] = useState<SongItem>(CHINESE_SONGS[0]);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [repeatLine, setRepeatLine] = useState(false);
  const [savedLine, setSavedLine] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<'all' | 'upbeat' | 'chill' | 'motivational'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6'>('all');
  const filteredSongs = useMemo(() => CHINESE_SONGS.filter(song => (moodFilter === 'all' || song.mood === moodFilter) && (levelFilter === 'all' || song.hskLevel === levelFilter)), [moodFilter, levelFilter]);

  const playLyricLine = (index: number) => {
    setActiveLineIndex(index);
    const line = currentSong.lyrics[index];
    if (line) voiceService.speakText(line.chinese, {
      rate: playbackRate,
      onEnd: () => {
        if (!isPlaying) return setIsPlaying(false);
        if (repeatLine) return playLyricLine(index);
        if (index < currentSong.lyrics.length - 1) playLyricLine(index + 1);
        else setIsPlaying(false);
      },
    });
  };

  const togglePlay = () => {
    if (isPlaying) { voiceService.stopSpeaking(); setIsPlaying(false); }
    else { setIsPlaying(true); playLyricLine(activeLineIndex); }
  };

  const saveCurrentLineToReview = async () => {
    const line = currentSong.lyrics[activeLineIndex];
    if (!line) return;
    try {
      await flashcardService.createFlashcard({
        hanzi: line.chinese,
        pinyin: line.pinyin || '',
        meaning: line.translationVi || '',
        example_sentence: line.chinese,
        topic: `music:${currentSong.id}`,
        hsk_level: Number(String(currentSong.hskLevel).replace(/\D/g,'')) || 1,
      });
      setSavedLine(line.chinese);
    } catch { setSavedLine(null); }
  };

  const handleNextSong = () => { voiceService.stopSpeaking(); setIsPlaying(false); const i=CHINESE_SONGS.findIndex(s=>s.id===currentSong.id); setCurrentSong(CHINESE_SONGS[(i+1)%CHINESE_SONGS.length]); setActiveLineIndex(0); setSavedLine(null); };
  const handlePrevSong = () => { voiceService.stopSpeaking(); setIsPlaying(false); const i=CHINESE_SONGS.findIndex(s=>s.id===currentSong.id); setCurrentSong(CHINESE_SONGS[(i-1+CHINESE_SONGS.length)%CHINESE_SONGS.length]); setActiveLineIndex(0); setSavedLine(null); };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716761] hover:text-[#E86F51] transition-colors cursor-pointer"><ArrowLeft size={16}/><span>Quay lại danh mục công cụ</span></button>
      <div className="space-y-2"><h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">Học tiếng Trung qua bài hát</h1><p className="text-sm text-[#716761] dark:text-[#A89E97]">Thưởng thức âm nhạc, luyện ngữ điệu tự nhiên với lời bài hát đồng bộ Pinyin và dịch nghĩa</p></div>
      <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10"><span className="text-xs font-extrabold text-[#716761] self-center">Không khí:</span>{[['all','Tất cả'],['upbeat','🎉 Vui'],['chill','🌙 Chill'],['motivational','🔥 Cố gắng']].map(([value,label])=><button key={value} type="button" onClick={()=>setMoodFilter(value as any)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${moodFilter===value?'bg-[#E86F51] text-white':'bg-white dark:bg-[#241F1C] text-[#716761]'}`}>{label}</button>)}<span className="text-xs font-extrabold text-[#716761] self-center ml-2">HSK:</span>{['all','HSK 1','HSK 2','HSK 3','HSK 4','HSK 5','HSK 6'].map(level=><button key={level} type="button" onClick={()=>setLevelFilter(level as any)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${levelFilter===level?'bg-[#D5A85C] text-white':'bg-white dark:bg-[#241F1C] text-[#716761]'}`}>{level==='all'?'Tất cả':level}</button>)}</div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">{filteredSongs.map(song => <button key={song.id} type="button" onClick={()=>{voiceService.stopSpeaking();setIsPlaying(false);setCurrentSong(song);setActiveLineIndex(0);setSavedLine(null);}} className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${song.id===currentSong.id?'bg-[#E86F51] text-white shadow-md shadow-[#E86F51]/20':'bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 text-[#716761]'}`}>{song.title}</button>)}</div>
      <div className="text-xs text-[#716761] dark:text-[#A89E97]">🎵 {filteredSongs.length} bài trong thư viện · ưu tiên nhịp vui, dễ nghe và có bài luyện tập nguyên tác của Chiu.</div>
      <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/20 shadow-xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6"><img src={currentSong.coverImage} alt={currentSong.title} referrerPolicy="no-referrer" className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-white/10"/><div className="text-center sm:text-left space-y-2"><span className="px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">{currentSong.hskLevel} · {currentSong.difficulty}</span><span className="px-3 py-1 rounded-full bg-[#FFF9E8] dark:bg-[#332B1D] text-[#B78322] text-xs font-bold">{currentSong.mood === 'upbeat' ? '🎉 Nhịp vui' : currentSong.mood === 'chill' ? '🌙 Chill' : currentSong.mood === 'motivational' ? '🔥 Tạo động lực' : '💛 Cảm xúc'}{currentSong.bpm ? ` · ${currentSong.bpm} BPM` : ''}</span><h2 className="text-2xl sm:text-3xl font-extrabold font-chinese text-[#211A17] dark:text-white">{currentSong.title}</h2><p className="text-sm font-bold text-[#D5A85C]">Ca sĩ: {currentSong.artist}</p><p className="text-xs text-[#716761] dark:text-[#A89E97]">Nhấn vào bất kỳ câu hát nào bên dưới để nghe đọc chậm từng câu!</p></div></div>
        <div className="flex items-center justify-center gap-6 py-2 border-y border-gray-100 dark:border-white/10"><button type="button" onClick={handlePrevSong} className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#716761]"><SkipBack size={20}/></button><button type="button" onClick={togglePlay} className="w-14 h-14 rounded-full bg-[#E86F51] text-white flex items-center justify-center shadow-lg shadow-[#E86F51]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer">{isPlaying?<Pause size={24}/>:<Play size={24} className="ml-1"/>}</button><button type="button" onClick={handleNextSong} className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-[#716761]"><SkipForward size={20}/></button></div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10"><div className="flex items-center gap-2 text-xs"><span className="font-bold text-[#716761]">Tốc độ:</span>{[0.65,0.85,1].map(rate=><button key={rate} onClick={()=>setPlaybackRate(rate)} className={`px-2.5 py-1.5 rounded-xl font-bold ${playbackRate===rate?'bg-[#E86F51] text-white':'bg-white dark:bg-[#241F1C] text-[#716761]'}`}>{rate}×</button>)}</div><button type="button" onClick={()=>setRepeatLine(!repeatLine)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${repeatLine?'bg-[#E86F51] text-white':'bg-white dark:bg-[#241F1C] text-[#716761]'}`}>{repeatLine?'↻ Lặp dòng':'Lặp dòng'}</button><div className="text-[11px] text-[#716761] dark:text-[#A89E97]">Nghe chậm → đọc theo → lưu dòng khó → SRS.</div></div>
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">{currentSong.lyrics.map((line,idx)=>{const isCurrent=activeLineIndex===idx;return <div key={idx} onClick={()=>playLyricLine(idx)} className={`p-4 rounded-2xl transition-all cursor-pointer text-left space-y-1 ${isCurrent?'bg-[#FFF0EB] dark:bg-[#342822] border-2 border-[#E86F51] scale-[1.02] shadow-sm':'bg-[#FFF9F4]/70 dark:bg-[#181412] hover:bg-[#FFF0EB]/40 border border-transparent'}`}><div className="flex items-center justify-between"><p className={`font-chinese text-lg sm:text-xl font-bold ${isCurrent?'text-[#E86F51]':'text-[#211A17] dark:text-white'}`}>{line.chinese}</p>{isCurrent&&<span className="w-2.5 h-2.5 rounded-full bg-[#E86F51] animate-ping"/>}</div><p className="text-xs font-semibold text-[#D5A85C]">{line.pinyin}</p><p className="text-xs text-[#716761] dark:text-[#A89E97]">{line.translationVi}</p>{isCurrent&&<button type="button" onClick={(e)=>{e.stopPropagation();saveCurrentLineToReview();}} className={`mt-2 px-3 py-1.5 rounded-xl text-[11px] font-bold ${savedLine===line.chinese?'bg-emerald-50 text-emerald-700':'bg-white dark:bg-[#181412] text-[#E86F51] border border-[#E86F51]/15'}`}>{savedLine===line.chinese?'✓ Đã lưu ôn tập':'＋ Lưu dòng vào ôn tập'}</button>}</div>})}</div>
      </div>
    </div>
  );
};
