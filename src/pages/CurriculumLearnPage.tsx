import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  ChevronRight,
  Sparkles,
  Trophy,
  ArrowRight,
  Search,
  Filter,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { HSKLevelNumber } from '../types/curriculum';
import { useCurriculum } from '../hooks/useCurriculum';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSubscription } from '../hooks/useSubscription';
import { getAuthHeaders } from '../services/flashcardService';

interface CurriculumLearnPageProps {
  initialLevel?: HSKLevelNumber;
  onSelectLesson: (lessonId: string) => void;
  onNavigate?: (route: string, param?: string) => void;
}

export const CurriculumLearnPage: React.FC<CurriculumLearnPageProps> = ({
  initialLevel,
  onSelectLesson,
  onNavigate,
}) => {
  const { profile, updateProfile } = useUserProfile();
  const { isPremium } = useSubscription();
  const [selectedLevel, setSelectedLevel] = useState<HSKLevelNumber>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedLesson, setGeneratedLesson] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSavingGeneratedVocabulary, setIsSavingGeneratedVocabulary] = useState(false);
  const [generatedVocabularySaved, setGeneratedVocabularySaved] = useState(false);

  React.useEffect(() => {
    const profileLevel = Math.min(6, Math.max(1, Number(profile?.hskLevel || 1))) as HSKLevelNumber;
    const requestedLevel = initialLevel
      ? Math.min(6, Math.max(1, Number(initialLevel))) as HSKLevelNumber
      : null;
    const nextLevel = requestedLevel ?? profileLevel;
    setSelectedLevel(isPremium ? nextLevel : Math.min(nextLevel, 2) as HSKLevelNumber);
  }, [profile?.hskLevel, isPremium, initialLevel]);

  const {
    levels,
    units,
    lessons,
    progressMap,
    levelCompletion,
    recommendations,
    isLoading,
  } = useCurriculum(selectedLevel);

  const activeLevelInfo = levels.find((l) => l.level === selectedLevel) || levels[0];

  // Progress the learner's target HSK automatically only after the current
  // level is fully completed with a passing average. Free accounts stop at
  // HSK 2; premium accounts can progress through HSK 6.
  React.useEffect(() => {
    const currentProfileLevel = Number(profile?.hskLevel || 1);
    const completedLevel = levelCompletion?.completionPercent === 100;
    const masteryReady =
      (levelCompletion?.masteryScore || 0) >= 80 &&
      (levelCompletion?.vocabularyMastery || 0) >= 70 &&
      (levelCompletion?.grammarMastery || 0) >= 70 &&
      ((levelCompletion?.quizMastery || 0) >= 80 || (levelCompletion?.quizMastery || 0) === 0) &&
      (levelCompletion?.weakVocabularyCount || 0) <= 5 &&
      (levelCompletion?.weakGrammarCount || 0) <= 2;
    const canAdvance = selectedLevel < 6 && (isPremium || selectedLevel < 2);

    if (!profile || !completedLevel || !masteryReady || !canAdvance) return;
    if (currentProfileLevel !== selectedLevel) return;
    // Mastery, not lesson completion alone, controls automatic HSK progression.

    updateProfile({ hskLevel: selectedLevel + 1 }).catch((error) => {
      console.warn('Could not advance HSK profile:', error);
    });
  }, [
    profile,
    selectedLevel,
    isPremium,
    levelCompletion?.completionPercent,
    levelCompletion?.averageQuizScore,
    updateProfile,
  ]);

  // Search filter
  const filteredLessons = lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.titleZh.includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E86F51]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} />
              Giáo trình chuẩn HSK 3.0
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#211A17] dark:text-white mt-1.5">
            Lộ trình học tập có cấu trúc
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">
            Chương trình HSK chuẩn quốc tế tích hợp ngữ âm, từ vựng, ngữ pháp và đàm thoại cùng trợ lý AI Lina.
          </p>
        </div>

        {/* Global Level Switcher Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const locked = !isPremium && lvl >= 3;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  if (locked) {
                    onNavigate?.('pricing');
                    return;
                  }
                  setSelectedLevel(lvl as HSKLevelNumber);
                }}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E86F51] text-white shadow-md shadow-[#E86F51]/25 scale-102'
                    : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/15 hover:border-[#E86F51]'
                }`}
                title={locked ? 'HSK 3–6 dành cho tài khoản PRO' : undefined}
              >
                <span>HSK {lvl}{locked ? ' 🔒' : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!isPremium && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
          Tài khoản Free học theo lộ trình HSK 1–2. Nâng cấp PRO để mở HSK 3–6 và lộ trình cá nhân hóa đầy đủ.
        </div>
      )}

      {profile && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#E86F51] uppercase tracking-wider">Lộ trình riêng của bạn</p>
            <h3 className="text-lg font-black text-[#211A17] dark:text-white mt-1">
              HSK {Math.min(6, Math.max(1, Number(profile.hskLevel || 1)))} · {isPremium ? 'PRO cá nhân hóa' : 'Free'}
            </h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">
              Từ vựng đã lưu sẽ được Lina dùng để tạo bài học phù hợp với tài khoản này.
            </p>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={async () => {
              if (!isPremium && selectedLevel >= 3) {
                onNavigate?.('pricing');
                return;
              }
              setIsGenerating(true);
              setGenerationError(null);
              try {
                const headers = await getAuthHeaders();
                const response = await fetch('/api/learning/personalized-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...headers },
                  body: JSON.stringify({ hskLevel: selectedLevel }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || 'Không thể tạo bài học cá nhân.');
                setGeneratedLesson(data.lesson);
              } catch (error: any) {
                setGenerationError(error?.message || 'Không thể tạo bài học cá nhân.');
              } finally {
                setIsGenerating(false);
              }
            }}
            className="px-5 py-3 rounded-2xl bg-[#E86F51] text-white text-sm font-bold hover:bg-[#D35B3E] transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Lina đang soạn bài…' : 'Tạo bài học cá nhân'}
          </button>
        </div>
      )}

      {generationError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-200">
          {generationError}
        </div>
      )}

      {generatedLesson?.content && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFF5F1] to-white dark:from-[#2A2320] dark:to-[#241F1C] border-2 border-[#E86F51]/20 space-y-4">
          <div>
            <span className="text-xs font-black text-[#E86F51] uppercase">Bài học cá nhân · HSK {generatedLesson.hsk_level}</span>
            <h3 className="text-2xl font-black text-[#211A17] dark:text-white mt-1">
              {generatedLesson.content.title || generatedLesson.title}
            </h3>
            {generatedLesson.content.titleZh && (
              <p className="font-chinese text-[#E86F51] font-bold mt-1">{generatedLesson.content.titleZh}</p>
            )}
          </div>
          {Array.isArray(generatedLesson.content.objectives) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {generatedLesson.content.objectives.map((item: string, index: number) => (
                <div key={index} className="p-3 rounded-2xl bg-white/80 dark:bg-[#181412] text-xs text-[#716761] dark:text-[#A89E97]">
                  {item}
                </div>
              ))}
            </div>
          )}
          {Array.isArray(generatedLesson.content.vocabulary) && generatedLesson.content.vocabulary.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-[#211A17] dark:text-white">Từ vựng trọng tâm</h4>
                <button
                  type="button"
                  disabled={isSavingGeneratedVocabulary || generatedVocabularySaved}
                  onClick={async () => {
                    setIsSavingGeneratedVocabulary(true);
                    try {
                      const cards = generatedLesson.content.vocabulary
                        .filter((item: any) => item?.hanzi)
                        .slice(0, 20)
                        .map((item: any) => ({
                          hanzi: String(item.hanzi).trim(),
                          pinyin: String(item.pinyin || '').trim(),
                          meaning: String(item.meaning || item.meaningVi || '').trim(),
                          example_sentence: item.example_sentence || item.exampleSentence || '',
                          topic: 'personalized-lesson',
                          hsk_level: Number(generatedLesson.hsk_level || selectedLevel),
                        }));
                      await (await import('../services/flashcardService')).flashcardService.upsertBatchFlashcards(cards);
                      setGeneratedVocabularySaved(true);
                    } catch (error: any) {
                      setGenerationError(error?.message || 'Không thể lưu từ vựng vào flashcards.');
                    } finally {
                      setIsSavingGeneratedVocabulary(false);
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-[#E86F51]/20 text-[#E86F51] text-xs font-bold hover:bg-[#FFF5F1] disabled:opacity-50"
                >
                  {generatedVocabularySaved ? '✓ Đã lưu flashcards' : isSavingGeneratedVocabulary ? 'Đang lưu…' : 'Lưu vào flashcards'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedLesson.content.vocabulary.slice(0, 8).map((item: any, index: number) => (
                  <div key={index} className="p-3 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/10">
                    <div className="font-chinese font-bold">{item.hanzi} · {item.pinyin}</div>
                    <div className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{item.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(generatedLesson.content.dialogue) && generatedLesson.content.dialogue.length > 0 && (
            <div>
              <h4 className="font-bold text-[#211A17] dark:text-white mb-2">Hội thoại</h4>
              <div className="space-y-2">
                {generatedLesson.content.dialogue.slice(0, 6).map((line: any, index: number) => (
                  <div key={index} className="p-3 rounded-2xl bg-white dark:bg-[#181412] text-sm">
                    <span className="font-bold">{line.speaker}: </span>
                    <span className="font-chinese">{line.chinese}</span>
                    <span className="text-xs text-[#716761] dark:text-[#A89E97]"> · {line.translation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommended Next Action / In-progress Widget */}
      {recommendations.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF5F1] via-white to-[#FFF9F4] dark:from-[#2A2320] dark:via-[#241F1C] dark:to-[#1E1917] border-2 border-[#E86F51]/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="text-xs font-black text-[#E86F51] tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              Gợi ý tiếp theo dành cho bạn
            </span>
            <h3 className="text-xl font-black text-[#211A17] dark:text-white">
              {recommendations[0].title}
            </h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              {recommendations[0].description}
            </p>
            {recommendations[0].metadata?.decision && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#181412] border border-[#E86F51]/15 text-[10px] font-bold text-[#E86F51]">
                  {recommendations[0].metadata.decision === 'review_srs'
                    ? 'Bước 1 · Ôn SRS'
                    : recommendations[0].metadata.decision === 'review_quiz'
                      ? 'Bước 2 · Củng cố quiz/ngữ pháp'
                      : recommendations[0].metadata.decision === 'learn_lesson'
                        ? 'Bước 3 · Học bài mới'
                        : 'Bước 4 · Chuyển HSK'}
                </span>
                {recommendations[0].metadata.reason && (
                  <span className="text-[10px] text-[#716761] dark:text-[#A89E97]">
                    {recommendations[0].metadata.reason}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const targetId = recommendations[0].targetId;

              if (targetId === 'flashcards' && onNavigate) {
                onNavigate('flashcards');
                return;
              }

              if (targetId.startsWith('level:')) {
                const nextLevel = Number(targetId.slice('level:'.length)) as HSKLevelNumber;
                if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > 6) return;

                // Free users should be sent to the upgrade screen rather than
                // changing the UI into a locked level.
                if (!isPremium && nextLevel >= 3) {
                  onNavigate?.('pricing');
                  return;
                }

                setSelectedLevel(nextLevel);
                setSearchQuery('');
                return;
              }

              // Grammar review is handled at the curriculum level. Returning
              // to the current level keeps the learner in a valid route and
              // lets the recommendation refresh after review.
              if (recommendations[0].type === 'review_grammar' || targetId === 'grammar') {
                setSelectedLevel(selectedLevel);
                setSearchQuery('');
                return;
              }

              onSelectLesson(targetId);
            }}
            className="px-6 py-3.5 rounded-2xl bg-[#E86F51] hover:bg-[#D35B3E] text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-center"
          >
            <span>{recommendations[0].actionText}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Level Completion Overview Card */}
      {activeLevelInfo && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]">
                  {activeLevelInfo.nameZh}
                </span>
                <span className="text-xs text-[#716761] dark:text-[#A89E97]">
                  Ước tính ~{activeLevelInfo.estimatedHours} giờ học
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white mt-1">
                {activeLevelInfo.title} · {activeLevelInfo.descriptionVi}
              </h2>
            </div>

            {/* Completion metrics */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">Tiến độ cấp độ</p>
                <p className="text-2xl font-black text-[#E86F51]">
                  {levelCompletion?.completionPercent || 0}%
                </p>
              </div>
              <div className="w-24 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E86F51] rounded-full transition-all duration-500"
                  style={{ width: `${levelCompletion?.completionPercent || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Objectives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[#E86F51]/10">
            {activeLevelInfo.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#716761] dark:text-[#A89E97]">
                <CheckCircle2 size={14} className="text-[#65A873] shrink-0 mt-0.5" />
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài học, Hán tự, chủ đề..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 text-sm text-[#211A17] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E86F51]"
          />
        </div>

        <div className="text-xs text-[#716761] dark:text-[#A89E97] self-end sm:self-center">
          Hiển thị <strong>{filteredLessons.length}</strong> bài học trong HSK {selectedLevel}
        </div>
      </div>

      {/* Curriculum Units & Lessons Structure */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-[#E86F51] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">Đang tải cấu trúc bài học HSK...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {units.map((unit) => {
            const unitLessons = filteredLessons.filter((l) => l.unitId === unit.id);
            if (unitLessons.length === 0 && searchQuery) return null;

            return (
              <div key={unit.id} className="space-y-4">
                {/* Unit Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E86F51]/15">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-[#E86F51] tracking-wider uppercase">
                      Unit {unit.order} · {unit.titleZh}
                    </span>
                    <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                      {unit.title}
                    </h3>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                      {unit.description}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#342822] text-[#716761] dark:text-[#A89E97] font-semibold">
                    {unitLessons.length} bài
                  </span>
                </div>

                {/* Lessons Grid in Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitLessons.map((lesson) => {
                    const progress = progressMap[lesson.id];
                    const isCompleted = progress?.status === 'completed';
                    const isInProgress = progress?.status === 'in_progress';

                    // Determine lock status: unlocked if first lesson or if prerequisite completed
                    let isLocked = false;
                    if (lesson.prerequisiteLessonId) {
                      const prereq = progressMap[lesson.prerequisiteLessonId];
                      isLocked = !prereq || prereq.status !== 'completed';
                    }

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => !isLocked && onSelectLesson(lesson.id)}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                          isLocked
                            ? 'bg-gray-50/70 dark:bg-[#1C1816]/70 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed'
                            : 'bg-white dark:bg-[#241F1C] border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg cursor-pointer group'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]">
                              Bài {lesson.order} · {lesson.titleZh}
                            </span>
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-[#65A873]">
                                <CheckCircle2 size={16} />
                                Đã xong ({progress?.score || 100}%)
                              </span>
                            ) : isInProgress ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-[#E86F51]">
                                Đang học ({progress?.progressPercent || 0}%)
                              </span>
                            ) : isLocked ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                <Lock size={14} />
                                Khóa
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">
                                Sẵn sàng
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-[#211A17] dark:text-white group-hover:text-[#E86F51] transition-colors">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#E86F51]/10 text-xs text-[#716761] dark:text-[#A89E97]">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {lesson.estimatedMinutes} phút
                          </span>

                          <button
                            type="button"
                            disabled={isLocked}
                            className={`flex items-center gap-1 font-bold ${
                              isLocked
                                ? 'text-gray-400'
                                : 'text-[#E86F51] group-hover:translate-x-1 transition-transform'
                            }`}
                          >
                            <span>{isCompleted ? 'Ôn tập lại' : isInProgress ? 'Học tiếp' : 'Bắt đầu'}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
