import React, { useState } from 'react';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  Plus,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { VocabularyItem } from '../types';
import { storageService } from '../services/storageService';
import { AudioButton } from '../components/common/AudioButton';

export const FlashcardsPage: React.FC = () => {
  const [cards, setCards] = useState<VocabularyItem[]>(storageService.getSavedWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'HSK 1' | 'HSK 2'>('all');
  const [reviewedCount, setReviewedCount] = useState(0);

  const filteredCards =
    activeFilter === 'all' ? cards : cards.filter((c) => c.hskLevel === activeFilter);
  const currentCard = filteredCards[currentIndex] || cards[0];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setIsFlipped(false);
    setReviewedCount((prev) => prev + 1);

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
            Thẻ nhớ thông minh (Flashcards SRS)
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Phương pháp Lặp lại ngắt quãng (Spaced Repetition) giúp ghi nhớ vĩnh viễn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#716761]">Cấp độ:</span>
          {(['all', 'HSK 1', 'HSK 2'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setActiveFilter(lvl);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === lvl
                  ? 'bg-[#E86F51] text-white shadow-xs'
                  : 'bg-white dark:bg-[#241F1C] border border-gray-200 dark:border-white/10 text-[#716761]'
              }`}
            >
              {lvl === 'all' ? 'Tất cả' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97]">
        <span>
          Thẻ số {currentIndex + 1} / {filteredCards.length}
        </span>
        <span>Hôm nay đã ôn: {reviewedCount} lượt</span>
      </div>

      {/* 3D Flashcard Box */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={handleFlip}
            className="w-full min-h-[320px] sm:min-h-[360px] bg-white dark:bg-[#241F1C] rounded-3xl p-8 border-2 border-[#E86F51]/20 shadow-xl cursor-pointer select-none flex flex-col justify-between text-center relative hover:border-[#E86F51] transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">
                {currentCard.hskLevel}
              </span>
              <span className="text-xs text-[#716761] dark:text-[#A89E97]">
                Nhấn thẻ để lật mặt sau ↻
              </span>
            </div>

            {/* Front of Card */}
            {!isFlipped ? (
              <div className="my-auto space-y-4">
                <p className="font-chinese text-6xl sm:text-7xl font-black text-[#211A17] dark:text-white tracking-wider">
                  {currentCard.chinese || currentCard.hanzi}
                </p>
                <div className="flex justify-center">
                  <AudioButton text={currentCard.chinese || currentCard.hanzi || ''} size="lg" label="Nghe phát âm" />
                </div>
              </div>
            ) : (
              /* Back of Card */
              <div className="my-auto space-y-4 animate-fade-in">
                <p className="font-chinese text-4xl font-black text-[#211A17] dark:text-white">
                  {currentCard.chinese || currentCard.hanzi}
                </p>
                <p className="text-2xl font-bold text-[#E86F51]">{currentCard.pinyin}</p>
                <p className="text-lg font-extrabold text-[#211A17] dark:text-white">
                  {currentCard.meaningVi}
                </p>

                {currentCard.exampleSentence && (
                  <div className="p-3 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/15 text-xs text-[#716761] dark:text-[#A89E97] space-y-1 max-w-md mx-auto">
                    <p className="font-chinese font-bold text-sm text-[#211A17] dark:text-white">
                      {currentCard.exampleSentence}
                    </p>
                    <p className="text-[#E86F51]">{currentCard.examplePinyin}</p>
                    <p>{currentCard.exampleTranslationVi}</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] text-gray-400 font-medium">
              {!isFlipped ? 'Chưa nhớ? Lật xem Pinyin & Nghĩa' : 'Đánh giá mức độ ghi nhớ ở bên dưới'}
            </div>
          </div>

          {/* SRS Rating Actions (Always accessible or after flip) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleRating('again')}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer flex flex-col items-center gap-1"
            >
              <span>Lặp lại (Again)</span>
              <span className="text-[10px] opacity-70">&lt; 1 phút</span>
            </button>

            <button
              type="button"
              onClick={() => handleRating('hard')}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer flex flex-col items-center gap-1"
            >
              <span>Khó (Hard)</span>
              <span className="text-[10px] opacity-70">1 ngày</span>
            </button>

            <button
              type="button"
              onClick={() => handleRating('good')}
              className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer flex flex-col items-center gap-1"
            >
              <span>Tốt (Good)</span>
              <span className="text-[10px] opacity-70">3 ngày</span>
            </button>

            <button
              type="button"
              onClick={() => handleRating('easy')}
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex flex-col items-center gap-1"
            >
              <span>Dễ (Easy)</span>
              <span className="text-[10px] opacity-70">7 ngày</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#241F1C] rounded-3xl border border-[#E86F51]/15 space-y-4">
          <Layers size={36} className="mx-auto text-[#E86F51]" />
          <h3 className="text-xl font-bold text-[#211A17] dark:text-white">
            Chưa có từ vựng nào trong danh sách
          </h3>
          <p className="text-sm text-[#716761]">
            Hãy học các bài học HSK và nhấn biểu tượng bookmark để lưu từ vựng vào đây nhé!
          </p>
        </div>
      )}
    </div>
  );
};
