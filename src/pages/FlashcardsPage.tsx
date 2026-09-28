import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Plus,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  LogIn,
  Brain,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { AudioButton } from '../components/common/AudioButton';
import { flashcardService } from '../services/flashcardService';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

const getVisualEmoji = (card: any): string => {
  const text = `${card?.hanzi || ''} ${card?.chinese || ''} ${card?.meaningVi || ''}`.toLowerCase();
  const visualMap: Array<[string[], string]> = [
    [['饭', 'cơm', 'rice', 'ăn'], '🍚'],
    [['水', 'nước', 'water'], '💧'],
    [['茶', 'trà', 'tea'], '🍵'],
    [['咖啡', 'cà phê', 'coffee'], '☕'],
    [['苹果', 'táo', 'apple'], '🍎'],
    [['水果', 'trái cây', 'fruit'], '🍊'],
    [['猫', 'mèo', 'cat'], '🐱'],
    [['狗', 'chó', 'dog'], '🐶'],
    [['朋友', 'bạn', 'friend'], '🧑‍🤝‍🧑'],
    [['家', 'nhà', 'home'], '🏠'],
    [['学校', 'trường', 'school'], '🏫'],
    [['书', 'sách', 'book'], '📚'],
    [['老师', 'giáo viên', 'teacher'], '👩‍🏫'],
    [['学生', 'học sinh', 'student'], '🧑‍🎓'],
    [['工作', 'công việc', 'work'], '💼'],
    [['电话', 'điện thoại', 'phone'], '📱'],
    [['电脑', 'máy tính', 'computer'], '💻'],
    [['天气', 'thời tiết', 'weather'], '🌤️'],
    [['雨', 'mưa', 'rain'], '🌧️'],
    [['太阳', 'mặt trời', 'sun'], '☀️'],
    [['月', 'trăng', 'moon'], '🌙'],
    [['爱', 'yêu', 'love'], '❤️'],
    [['开心', 'vui', 'happy'], '😊'],
    [['生气', 'tức giận', 'angry'], '😠'],
    [['吃', 'ăn', 'eat'], '🍜'],
    [['喝', 'uống', 'drink'], '🥤'],
    [['买', 'mua', 'buy'], '🛍️'],
    [['钱', 'tiền', 'money'], '💰'],
    [['时间', 'thời gian', 'time'], '⏰'],
    [['旅行', 'du lịch', 'travel'], '✈️'],
  ];
  const found = visualMap.find(([keys]) => keys.some((key) => text.includes(key)));
  return found?.[1] || '🀄';
};

const getTwemojiUrl = (emoji: string) => {
  const codepoints = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoints}.svg`;
};

export const FlashcardsPage: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [cards, setCards] = useState<any[]>(() => storageService.getSavedWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6'>('all');
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [lastRating, setLastRating] = useState<'again' | 'hard' | 'good' | 'easy' | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      setIsLoading(true);
      setLoadError(null);
      flashcardService
        .getFlashcards()
        .then((dbCards) => {
          if (!isMounted) return;
          if (dbCards && dbCards.length > 0) {
            const mapped = dbCards.map((c) => ({
              id: c.id,
              hanzi: c.hanzi,
              chinese: c.hanzi,
              pinyin: c.pinyin,
              meaningVi: c.meaning,
              exampleSentence: c.example_sentence,
              hskLevel: c.hsk_level ? `HSK ${c.hsk_level}` : 'HSK 1',
              status: c.status,
              reviewCount: c.review_count,
            }));
            setCards(mapped);
          }
        })
        .catch((err) => {
          console.error('Could not load user flashcards from database:', err);
          if (isMounted) setLoadError(err instanceof Error ? err.message : 'Không thể tải thẻ nhớ từ máy chủ.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredCards = activeFilter === 'all' ? cards : cards.filter((c) => (c.hskLevel || c.level || 'HSK 1') === activeFilter);
  const currentCard = filteredCards[currentIndex] || null;
  const progressPercent = filteredCards.length ? Math.round(((currentIndex + (sessionComplete ? 1 : 0)) / filteredCards.length) * 100) : 0;

  const handleFlip = () => {
    if (isReviewing || sessionComplete) return;
    setIsFlipped((value) => !value);
  };

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (isReviewing || sessionComplete || !currentCard) return;
    setIsFlipped(false);
    setLastRating(rating);

    if (currentCard.id && user) {
      setIsReviewing(true);
      const atomicRating = rating === 'again' ? 'incorrect' : 'correct';
      try {
        const updated = await flashcardService.reviewFlashcard(currentCard.id, atomicRating);
        setCards((prev) => prev.map((card) => card.id === currentCard.id ? {
          ...card,
          status: updated.status,
          reviewCount: updated.review_count,
        } : card));
        setReviewedCount((prev) => prev + 1);
      } catch (err) {
        console.warn('Could not update card progress:', err);
        setLastRating(null);
        return;
      } finally {
        setIsReviewing(false);
      }
    } else {
      setReviewedCount((prev) => prev + 1);
    }

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((value) => value + 1);
      setLastRating(null);
    } else {
      setSessionComplete(true);
    }
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setLastRating(null);
    setSessionComplete(false);
    setReviewedCount(0);
  };

  const visualEmoji = currentCard ? getVisualEmoji(currentCard) : '🀄';
  const visualUrl = getTwemojiUrl(visualEmoji);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">
            <Brain size={14} /> Daily Review
          </div>
          <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white mt-1">Thẻ nhớ thông minh</h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">Ôn nhanh, phản hồi ngay, giữ nhịp ghi nhớ mỗi ngày.</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs text-[#716761] dark:text-[#A89E97] shrink-0">Cấp độ:</span>
          {(['all', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lvl) => {
            const requiresPremium = lvl !== 'all' && Number(lvl.replace('HSK ', '')) >= 3;
            const locked = requiresPremium && !isPremium;
            return (
              <button key={lvl} type="button" onClick={() => {
                if (locked) { onNavigate?.('pricing'); return; }
                setActiveFilter(lvl); setCurrentIndex(0); setIsFlipped(false); setLastRating(null); setSessionComplete(false);
              }} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeFilter === lvl ? 'bg-[#E86F51] text-white shadow-sm' : 'bg-white dark:bg-[#241F1C] border border-gray-200 dark:border-white/10 text-[#716761] dark:text-[#A89E97]'}`} title={locked ? 'HSK 3–6 dành cho tài khoản PRO' : undefined}>
                {lvl === 'all' ? 'Tất cả' : lvl}{locked ? ' 🔒' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {!user && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2"><Sparkles size={16} className="text-[#E86F51] shrink-0" /><span>Bạn đang học ở chế độ Khách. Đăng nhập để tự động lưu và đồng bộ từ vựng cá nhân.</span></div>
          {onNavigate && <button type="button" onClick={() => onNavigate('login')} className="chiu-btn chiu-btn-primary px-3 text-xs shrink-0 inline-flex items-center justify-center gap-1.5"><LogIn size={13} /> Đăng nhập</button>}
        </div>
      )}

      {loadError && user && <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-200">Không thể tải dữ liệu flashcard từ tài khoản. Vui lòng thử lại. Chi tiết: {loadError}</div>}

      {filteredCards.length > 0 && !sessionComplete && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97]"><span>Ôn tập · {currentIndex + 1} / {filteredCards.length}</span><span>{reviewedCount} lượt đã đánh giá</span></div>
          <div className="chiu-progress" aria-label={`Tiến độ ôn tập ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div>
        </div>
      )}

      {sessionComplete ? (
        <div className="chiu-card chiu-completion p-7 sm:p-10 text-center space-y-6 animate-fade-in">
          <div className="chiu-completion-icon mx-auto w-20 h-20 rounded-full bg-[#EAF5EC] dark:bg-emerald-950/40 text-[#65A873] flex items-center justify-center shadow-sm"><CheckCircle2 size={40} /></div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-black"><Zap size={13} /> Phiên ôn tập hoàn tất</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white mt-3">Bạn đã giữ nhịp rất tốt 👏</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-2">Đã đánh giá {reviewedCount} thẻ trong phiên này. SRS vẫn quyết định lịch ôn tiếp theo như trước.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] p-4"><p className="text-xl font-black text-[#211A17] dark:text-white">{reviewedCount}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97]">thẻ đã ôn</p></div>
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] p-4"><p className="text-xl font-black text-[#E86F51]">100%</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97]">phiên hoàn tất</p></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button type="button" onClick={restartSession} className="chiu-btn chiu-btn-secondary px-5 inline-flex items-center justify-center gap-2"><RotateCcw size={16} /> Ôn lại</button>
            <button type="button" onClick={() => onNavigate?.('learn')} className="chiu-btn chiu-btn-primary px-5 inline-flex items-center justify-center gap-2">Tiếp tục học <ArrowRight size={16} /></button>
          </div>
        </div>
      ) : currentCard ? (
        <div className="space-y-5">
          <div className="relative [perspective:1200px]">
            <button type="button" onClick={handleFlip} disabled={isReviewing} aria-label={isFlipped ? 'Hiện mặt trước' : 'Lật thẻ để xem nghĩa'} className="chiu-focus-card w-full text-left [transform-style:preserve-3d] focus-visible:outline-none group">
              <div className={`chiu-flip w-full min-h-[430px] sm:min-h-[480px] bg-white dark:bg-[#241F1C] rounded-[2rem] p-5 sm:p-7 border border-[#E86F51]/15 shadow-[0_16px_45px_rgba(80,48,35,0.10)] flex flex-col justify-between transition-all duration-300 group-hover:-translate-y-0.5 ${isFlipped ? 'ring-2 ring-[#E86F51]/20' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">{currentCard.hskLevel}</span>
                  <span className="text-xs text-[#716761] dark:text-[#A89E97]">{isFlipped ? 'Mặt sau · nhấn để lật lại' : 'Nhấn để lật ↻'}</span>
                </div>

                <div className="my-auto py-5 space-y-4 animate-fade-in">
                  <div className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br from-[#FFF0EB] via-[#FFF8F4] to-[#FFE5DC] dark:from-[#342822] dark:via-[#2A2320] dark:to-[#3A2923] border border-[#E86F51]/10 flex items-center justify-center shadow-inner overflow-hidden" aria-label={`Hình minh họa: ${currentCard.meaningVi || currentCard.chinese}`}>
                    <img src={visualUrl} alt="" width="76" height="76" loading="lazy" className="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    <span className="text-6xl sm:text-7xl" aria-hidden="true">{visualEmoji}</span>
                  </div>

                  {!isFlipped ? (
                    <div className="text-center space-y-4">
                      <p className="font-chinese text-6xl sm:text-7xl font-black text-[#211A17] dark:text-white tracking-wider">{currentCard.chinese || currentCard.hanzi}</p>
                      <div className="flex justify-center"><AudioButton text={currentCard.chinese || currentCard.hanzi || ''} size="lg" label="Nghe phát âm" /></div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="font-chinese text-4xl font-black text-[#211A17] dark:text-white">{currentCard.chinese || currentCard.hanzi}</p>
                      <p className="text-2xl font-bold text-[#E86F51]">{currentCard.pinyin}</p>
                      <p className="text-lg font-extrabold text-[#211A17] dark:text-white">{currentCard.meaningVi}</p>
                      {currentCard.exampleSentence && <div className="p-3 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/15 text-xs text-[#716761] dark:text-[#A89E97] space-y-1 max-w-md mx-auto"><p className="font-chinese font-bold text-sm text-[#211A17] dark:text-white">{currentCard.exampleSentence}</p><p className="text-[#E86F51]">{currentCard.examplePinyin}</p><p>{currentCard.exampleTranslationVi}</p></div>}
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-[#9B9089] font-medium flex items-center justify-center gap-1.5"><ImageIcon size={12} /> Hình minh họa giúp tạo liên tưởng nhanh</div>
              </div>
            </button>
          </div>

          {lastRating && (
            <div className="chiu-feedback flex justify-center animate-fade-in" role="status" aria-live="polite">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${lastRating === 'again' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : lastRating === 'hard' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                {lastRating === 'again' ? '↻ Đã đánh dấu cần ôn lại' : lastRating === 'hard' ? '• Đã đánh dấu khó' : lastRating === 'good' ? '✓ Đã nhớ' : '⚡ Rất dễ'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {([
              ['again', 'Cần ôn', '↻', 'rose'],
              ['hard', 'Khó', '•', 'amber'],
              ['good', 'Đã nhớ', '✓', 'emerald'],
              ['easy', 'Rất dễ', '⚡', 'sky'],
            ] as const).map(([rating, label, icon, tone]) => (
              <button key={rating} type="button" disabled={isReviewing} onClick={() => handleRating(rating)} className={`chiu-tap min-h-12 rounded-2xl border text-xs sm:text-sm font-black transition-all active:scale-[0.98] ${tone === 'rose' ? 'border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100' : tone === 'amber' ? 'border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100' : tone === 'emerald' ? 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100' : 'border-sky-200 dark:border-sky-900/40 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100'}`}><span className="mr-1">{icon}</span>{label}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chiu-card p-8 text-center space-y-4">
          <Layers size={42} className="mx-auto text-[#E86F51]" />
          <h2 className="text-xl font-black text-[#211A17] dark:text-white">Chưa có flashcard</h2>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">Hãy lưu một vài từ mới rồi quay lại đây để bắt đầu Daily Review.</p>
          <button type="button" onClick={() => onNavigate?.('learn')} className="chiu-btn chiu-btn-primary px-5 inline-flex items-center gap-2">Học từ mới <ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
};
