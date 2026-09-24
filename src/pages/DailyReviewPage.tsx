import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { AudioButton } from '../components/common/AudioButton';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { flashcardService, Flashcard } from '../services/flashcardService';
import { useAuth } from '../hooks/useAuth';
import { getProgressRepository } from '../services/repositories/repositoryFactory';
import { getLessonProgressRepository } from '../curriculum/lessonProgressRepository';
import { calculateSrsSchedule } from '../services/flashcardSrs';
import { useUserProfile } from '../hooks/useUserProfile';
import { getDailyReviewPriority } from '../curriculum/dailyReviewRanking';

export const DailyReviewPage: React.FC<{ onComplete: () => void; onNavigate?: (route: string) => void }> = ({
  onComplete,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lessonProgressRepository = useMemo(() => getLessonProgressRepository(user?.id || null), [user?.id]);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      flashcardService.getFlashcards(),
      lessonProgressRepository.getSkillProgress(user.id),
      lessonProgressRepository.getVocabularyProgress(user.id),
    ])
      .then(([allCards, skills, vocabularyProgress]) => {
        const vocabularyScores: Record<number, number> = {};
        skills.filter((skill) => skill.skill === 'vocabulary').forEach((skill) => {
          vocabularyScores[skill.level] = skill.score;
        });
        const masteryByVocabularyId = new Map(
          vocabularyProgress.map((item) => [item.vocabularyId, item.masteryScore])
        );
        if (!mounted) return;

        // SRS controls eligibility for every card: unscheduled cards are new;
        // scheduled cards return only when their next_review_at has arrived.
        const now = Date.now();
        const reviewable = allCards
          .filter((card) => {
            if (!card.next_review_at) return true;
            const dueAt = Date.parse(card.next_review_at);
            return Number.isFinite(dueAt) && dueAt <= now;
          })
          .sort((a, b) => {
            const priority = (card: Flashcard) => {
              const hsk = Number(card.hsk_level || 0);
              const masteryScore = card.hanzi
                ? vocabularyProgress.find((item) => item.vocabularyId === card.hanzi)?.masteryScore
                : undefined;
              return getDailyReviewPriority({
                nextReviewAt: card.next_review_at,
                status: card.status,
                hskLevel: hsk,
                masteryScore,
                incorrectCount: card.srs_incorrect_count,
                repetitions: card.srs_repetitions,
                createdAt: card.created_at,
                now,
                currentHskLevel: profile?.hskLevel ? Number(profile.hskLevel) : null,
                currentHskVocabularyScore: hsk >= 1 && hsk <= 6 ? (vocabularyScores[hsk] ?? 50) : null,
              });
            };
            return priority(b).score - priority(a).score || a.created_at.localeCompare(b.created_at);
          })
          .slice(0, 10);


        setCards(reviewable);
      })
      .catch((error) => {
        if (mounted) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải flashcards.');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, lessonProgressRepository, profile]);

  const current = cards[step] || null;

  const options = useMemo(() => {
    if (!current) return [];

    const distractors = cards
      .filter((card) => card.id !== current.id && card.meaning !== current.meaning)
      .map((card) => card.meaning)
      .filter(Boolean)
      .slice(0, 3);

    return [...distractors, current.meaning].sort(() => Math.random() - 0.5);
  }, [current, cards]);

  const handleSelectOption = async (index: number) => {
    if (!current || selectedAnswer !== null) return;

    setSelectedAnswer(index);
    const correct = options[index] === current.meaning;

    if (correct) setScore((value) => value + 1);

    try {
      if (user && current.id) {
        const schedule = calculateSrsSchedule(current, correct ? 'correct' : 'incorrect');
        await flashcardService.updateFlashcard(current.id, {
          status: schedule.status,
          review_count: schedule.reviewCount,
          srs_repetitions: schedule.repetitions,
          srs_correct_count: schedule.correctCount,
          srs_incorrect_count: schedule.incorrectCount,
          last_reviewed_at: schedule.lastReviewedAt,
          next_review_at: schedule.nextReviewAt,
        });

        // Feed the same answer evidence into curriculum vocabulary mastery and
        // the HSK vocabulary skill profile when this card maps to a curriculum word.
        await lessonProgressRepository.recordVocabularyReview(
          user.id,
          current.hanzi,
          current.hsk_level && current.hsk_level >= 1 && current.hsk_level <= 6
            ? current.hsk_level as 1 | 2 | 3 | 4 | 5 | 6
            : undefined,
          correct
        );
      }
    } catch (error) {
      console.warn('Could not update daily review card:', error);
    }

    window.setTimeout(() => {
      setSelectedAnswer(null);
      if (step < cards.length - 1) {
        setStep((value) => value + 1);
      } else {
        setIsDone(true);
        if (user) {
          getProgressRepository(user).recordStudyActivity(user.id, {
            type: 'flashcards',
            durationMinutes: Math.max(1, Math.ceil(cards.length * 1.5)),
            // A review session is study activity, not proof that every reviewed word was newly learned.
          }).catch((error) => console.warn('Could not record review activity:', error));
        }
      }
    }, 500);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-8 text-center border border-[#E86F51]/15 shadow-xl space-y-5">
          <RotateCcw size={40} className="mx-auto text-[#E86F51]" />
          <h1 className="text-2xl font-extrabold text-[#211A17] dark:text-white">Ôn tập cá nhân</h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Đăng nhập để ôn lại chính những từ bạn đã lưu và đồng bộ kết quả học tập.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('login')}
            className="px-5 py-3 rounded-2xl bg-[#E86F51] text-white text-sm font-bold inline-flex items-center gap-2"
          >
            <LogIn size={16} /> Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-sm text-[#716761]">
        Lina đang chuẩn bị bộ ôn tập cá nhân của bạn…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm text-red-800 dark:text-red-200">
          Không thể tải bộ ôn tập. {loadError}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-8 text-center border border-[#E86F51]/15 shadow-xl space-y-5">
          <RotateCcw size={40} className="mx-auto text-[#E86F51]" />
          <h1 className="text-2xl font-extrabold text-[#211A17] dark:text-white">Chưa có thẻ cần ôn</h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Hãy học một bài HSK hoặc trò chuyện với Lina để tạo thêm flashcards cá nhân.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('learn')}
            className="px-5 py-3 rounded-2xl bg-[#E86F51] text-white text-sm font-bold"
          >
            Tiếp tục học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-[#E86F51] text-xs font-bold inline-flex items-center gap-1.5">
          <RotateCcw size={14} /> Ôn tập 10 phút hàng ngày
        </span>
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">Ôn đúng những gì bạn đang yếu</h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Bộ ôn tập lấy trực tiếp từ flashcards cá nhân của bạn.
        </p>
      </div>

      {!isDone && current ? (
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-xl space-y-6">
          <div className="flex justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97]">
            <span>Câu {step + 1} / {cards.length}</span>
            <span className="text-[#E86F51]">{Math.round(score)} điểm</span>
          </div>

          <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E86F51] transition-all duration-300"
              style={{ width: `${((step + 1) / cards.length) * 100}%` }}
            />
          </div>

          <div className="text-center space-y-4 py-4">
            <span className="px-3 py-1 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">
              {current.hsk_level ? `HSK ${current.hsk_level}` : 'Flashcard'}
            </span>
            <p className="font-chinese text-5xl sm:text-6xl font-black text-[#211A17] dark:text-white">{current.hanzi}</p>
            <p className="text-sm font-bold text-[#E86F51]">{current.pinyin}</p>
            <AudioButton text={current.hanzi} size="md" />
            <p className="text-base font-bold text-[#211A17] dark:text-white pt-2">Từ này có nghĩa là gì?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option, index) => {
              const isCorrect = option === current.meaning;
              const isSelected = selectedAnswer === index;
              const reveal = selectedAnswer !== null;

              return (
                <button
                  key={`${current.id}-${option}`}
                  type="button"
                  disabled={reveal}
                  onClick={() => handleSelectOption(index)}
                  className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all ${
                    reveal && isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                      : reveal && isSelected
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700'
                        : 'border-[#E86F51]/15 bg-[#FFF9F4] dark:bg-[#181412] hover:border-[#E86F51]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {reveal && isCorrect && <CheckCircle2 size={16} />}
                    {reveal && isSelected && !isCorrect && <XCircle size={16} />}
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-8 sm:p-10 border border-[#E86F51]/20 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#65A873] flex items-center justify-center mx-auto">
            <Trophy size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#211A17] dark:text-white">Hoàn thành phiên ôn tập</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97]">
              Bạn đã ôn {cards.length} từ và đạt <span className="font-bold text-[#E86F51]">{Math.round((score / Math.max(cards.length, 1)) * 100)} / 100 điểm</span>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/15 flex items-center gap-3 text-left">
            <LinaAvatar size="md" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-[#211A17] dark:text-white">Lina:</p>
              <p className="text-[#716761] dark:text-[#A89E97]">
                Phiên ôn tập này đã cập nhật trạng thái các thẻ và tiến độ học của bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="w-full py-4 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] transition-all"
          >
            Quay lại trang chính
          </button>
        </div>
      )}
    </div>
  );
};
