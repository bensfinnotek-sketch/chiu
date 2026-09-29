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
import { getAuthHeaders } from '../services/flashcardService';
import { buildPersonalizedLearningPlan, calculateLearningMomentum } from '../curriculum/learningDecisionEngine';

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
    setSelectedLevel(nextLevel);
  }, [profile?.hskLevel, initialLevel]);

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

  const personalizedPlan = React.useMemo(() => {
    const progressItems = Object.values(progressMap || {});
    const momentum = calculateLearningMomentum(progressItems);
    const recentCompletionRate = progressItems.length
      ? Math.round(progressItems.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / progressItems.length)
      : 50;
    const recentCompleted = progressItems
      .filter((item) => item.status === 'completed' && item.completedAt)
      .sort((a, b) => Date.parse(String(b.completedAt)) - Date.parse(String(a.completedAt)))[0];
    const recentOutcomeAgeDays = recentCompleted?.completedAt
      ? Math.max(0, Math.round((Date.now() - Date.parse(recentCompleted.completedAt)) / 86400000))
      : undefined;

    return buildPersonalizedLearningPlan({
      dailyMinutes: profile?.dailyMinutes || 15,
      learningGoal: profile?.learningGoal || 'general',
      decision: recommendations[0]?.metadata?.decision || 'learn_lesson',
      completionPercent: levelCompletion?.completionPercent || 0,
      vocabularyScore: levelCompletion?.vocabularyMastery || 0,
      grammarScore: levelCompletion?.grammarMastery || 0,
      quizScore: levelCompletion?.quizMastery || 0,
      diagnosticFocus: recommendations[0]?.metadata?.diagnosticFocus,
      momentumScore: momentum.score,
      recentCompletionRate,
      momentumTrend: momentum.trend,
      consistencyScore: momentum.consistency,
      recentOutcomeScore: recentCompleted?.score ?? undefined,
      recentOutcomeAgeDays,
    });
  }, [profile?.dailyMinutes, profile?.learningGoal, recommendations, levelCompletion, progressMap]);

  const learningSignals = React.useMemo(() => {
    const progressItems = Object.values(progressMap || {});
    const momentum = calculateLearningMomentum(progressItems);
    const recentCompletionRate = progressItems.length
      ? Math.round(progressItems.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / progressItems.length)
      : 50;
    const recentCompleted = progressItems
      .filter((item) => item.status === 'completed' && item.completedAt)
      .sort((a, b) => Date.parse(String(b.completedAt)) - Date.parse(String(a.completedAt)))[0];
    const recentOutcomeScore = recentCompleted?.score ?? null;
    const recentOutcomeAgeDays = recentCompleted?.completedAt
      ? Math.max(0, Math.round((Date.now() - Date.parse(recentCompleted.completedAt)) / 86400000))
      : null;

    return {
      momentum: Math.round(momentum.score),
      consistency: Math.round(momentum.consistency),
      completionRate: recentCompletionRate,
      recentOutcomeScore: recentOutcomeScore == null ? null : Math.round(Number(recentOutcomeScore)),
      recentOutcomeAgeDays,
      trend: momentum.trend,
    };
  }, [progressMap]);

  // Progress the learner's target HSK automatically only after the current
  // level is fully completed with the existing mastery thresholds.
  // HSK access remains open in the learning UI; subscription logic is preserved
  // elsewhere for future entitlement changes.
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
    const canAdvance = selectedLevel < 6;

    if (!profile || !completedLevel || !masteryReady || !canAdvance) return;
    if (currentProfileLevel !== selectedLevel) return;
    // Mastery, not lesson completion alone, controls automatic HSK progression.

    updateProfile({ hskLevel: selectedLevel + 1 }).catch((error) => {
      console.warn('Could not advance HSK profile:', error);
    });
  }, [
    profile,
    selectedLevel,
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in" aria-labelledby="curriculum-page-title">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E86F51]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} />
              Giáo trình chuẩn HSK 3.0
            </span>
          </div>
          <h1 id="curriculum-page-title" className="text-3xl font-black text-[#211A17] dark:text-white mt-1.5">
            Lộ trình học tập có cấu trúc
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">
            Chương trình HSK chuẩn quốc tế tích hợp ngữ âm, từ vựng, ngữ pháp và đàm thoại cùng trợ lý AI Lina.
          </p>
        </div>

        {/* Global Level Switcher Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none" role="tablist" aria-label="Chọn cấp độ HSK">
          {[1, 2, 3, 4, 5, 6].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const locked = false;
            return (
              <button
                key={lvl}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={locked ? `HSK ${lvl}, mở khóa bằng gói PRO` : `Chọn HSK ${lvl}`}
                onClick={() => {
                  setSelectedLevel(lvl as HSKLevelNumber);
                }}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E86F51] text-white shadow-md shadow-[#E86F51]/25 scale-102'
                    : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/15 hover:border-[#E86F51]'
                }`}

              >
                <span>HSK {lvl}{locked ? ' 🔒' : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {profile && (
        <section aria-labelledby="personalized-path-title" className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#E86F51] uppercase tracking-wider">Lộ trình riêng của bạn</p>
            <h3 id="personalized-path-title" className="text-lg font-black text-[#211A17] dark:text-white mt-1">
              HSK {Math.min(6, Math.max(1, Number(profile.hskLevel || 1)))} · Lộ trình cá nhân hóa
            </h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">
              Từ vựng đã lưu sẽ được Lina dùng để tạo bài học phù hợp với tài khoản này.
            </p>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={async () => {
              setIsGenerating(true);
              setGenerationError(null);
              try {
                const headers = await getAuthHeaders();
                const response = await fetch('/api/learning/personalized-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...headers },
                  body: JSON.stringify({
                    hskLevel: selectedLevel,
                    adaptiveProfile: {
                      difficulty: personalizedPlan.difficulty,
                      newWordsTarget: personalizedPlan.newWordsTarget,
                      quizIntensity: personalizedPlan.quizIntensity,
                      speakingPace: personalizedPlan.speakingPace,
                      focus: personalizedPlan.focus,
                    },
                    composerContext: {
                      diagnosticFocus: recommendations[0]?.metadata?.diagnosticFocus,
                      diagnosticLessonId: recommendations[0]?.metadata?.diagnosticLessonId,
                      diagnosticTargets: recommendations[0]?.metadata?.diagnosticTargets,
                    },
                  }),
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
        </section>
      )}

      {generationError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-200">
          {generationError}
        </div>
      )}

      {generatedLesson?.content && (
        <section aria-labelledby="generated-lesson-title" className="p-6 rounded-3xl bg-gradient-to-br from-[#FFF5F1] to-white dark:from-[#2A2320] dark:to-[#241F1C] border-2 border-[#E86F51]/20 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-[#E86F51] uppercase">Bài học cá nhân · HSK {generatedLesson.hsk_level}</span>
              {recommendations[0]?.metadata?.diagnosticTargets?.length > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51]">
                  Soạn theo AI-9
                </span>
              )}
            </div>
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
        </section>
      )}

      {/* Lina learning journey — presentation only; recommendation logic stays unchanged */}
      <section className="chiu-card p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">Hôm nay Lina đề xuất cho bạn</span>
            <h2 className="text-2xl font-black text-[#211A17] dark:text-white mt-1">Một mini learning journey</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">Các bước dưới đây chỉ thay đổi cách trình bày, không thay đổi quyết định của AI-9.</p>
          </div>
          <span className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">HSK {selectedLevel}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { n: 1, title: 'Ôn SRS', icon: '↻', tone: 'Cần làm' },
            { n: 2, title: 'Củng cố', icon: '◎', tone: 'Khuyến nghị' },
            { n: 3, title: 'Học bài mới', icon: '▤', tone: 'Tiếp theo' },
            { n: 4, title: 'Speaking', icon: '◉', tone: 'Luyện nói' },
          ].map((step) => (
            <div key={step.n} className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4 relative">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center font-black">{step.n}</span>
                <span className="text-lg text-[#E86F51]">{step.icon}</span>
              </div>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-4">{step.title}</p>
              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-white dark:bg-[#241F1C] text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">{step.tone}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI-9 diagnostic explanation — presentation only */}
      {recommendations[0]?.metadata && (
        <section className="chiu-card p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">AI-9 · Vì sao Lina chọn bước này?</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-1">Giải thích đề xuất hiện tại</h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1 max-w-2xl">Lina đang giải thích quyết định từ các tín hiệu học tập đã có, thay vì tạo thêm dữ liệu hay thay đổi learning engine.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-[10px] font-black">{recommendations[0].metadata.diagnosticConfidence ?? 0}% tin cậy</span>
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97] text-[10px] font-bold">{recommendations[0].metadata.diagnosticEvidenceCount ?? 0} tín hiệu</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Trọng tâm</p>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{recommendations[0].metadata.diagnosticFocus || 'balanced'}</p>
              <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Lina ưu tiên tín hiệu phù hợp với bước học tiếp theo.</p>
            </div>
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Bằng chứng</p>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{recommendations[0].metadata.diagnosticTargetLabels?.[0] || 'Theo dõi tín hiệu gần đây'}</p>
              <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{recommendations[0].metadata.diagnosticAgingNote || 'Tín hiệu sẽ được cập nhật khi bạn học thêm.'}</p>
            </div>
            <div className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lý do</p>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{recommendations[0].metadata.reason || 'Giữ nhịp học phù hợp với tiến độ hiện tại.'}</p>
              <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Đây là diễn giải của quyết định hiện tại, không phải điểm đánh giá người học.</p>
            </div>
          </div>
        </section>
      )}

      {/* AI-10 Personalized Learning Plan */}
      <section className="chiu-card p-5 sm:p-7" aria-labelledby="ai10-plan-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">AI-10 · Kế hoạch cá nhân hóa</span>
            <h2 id="ai10-plan-title" className="text-2xl font-black text-[#211A17] dark:text-white mt-1">
              {personalizedPlan.dailyMinutes} phút học hôm nay
            </h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">
              Trọng tâm: <span className="font-bold text-[#E86F51]">{personalizedPlan.focus}</span> · kế hoạch tự điều chỉnh theo tín hiệu chẩn đoán của AI-9.
            </p>
            <div className="flex flex-wrap gap-2 mt-3" aria-label="Tóm tắt mức thích ứng AI-10">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51]">Độ tải: {personalizedPlan.difficulty}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97]">+{personalizedPlan.newWordsTarget} từ mới</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97]">Quiz: {personalizedPlan.quizIntensity}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97]">Speaking: {personalizedPlan.speakingPace}</span>
            </div>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-2">{personalizedPlan.adaptationReason}</p>
          </div>
          <span className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">
            {recommendations[0]?.metadata?.decision === 'review_srs'
              ? 'Ưu tiên SRS'
              : recommendations[0]?.metadata?.decision === 'review_quiz'
                ? 'Ưu tiên củng cố'
                : recommendations[0]?.metadata?.decision === 'advance_hsk'
                  ? 'Sẵn sàng chuyển HSK'
                  : 'Tiếp tục tiến độ'}
          </span>
          {recommendations[0]?.metadata?.diagnosticFocus && (
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">
              Chẩn đoán: {recommendations[0].metadata.diagnosticFocus === 'vocabulary' ? 'Từ vựng' : recommendations[0].metadata.diagnosticFocus === 'grammar' ? 'Ngữ pháp' : recommendations[0].metadata.diagnosticFocus === 'quiz' ? 'Đánh giá quiz' : 'Cân bằng'}
            </span>
          )}
          {recommendations[0]?.metadata?.diagnosticTargets?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {recommendations[0]?.metadata?.diagnosticTargetLabels?.map((label) => (
                <span key={label} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97]">
                  Mục tiêu: {label}
                </span>
              ))}
              {recommendations[0]?.metadata?.diagnosticLessonId && (
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">
                  Bài đích: {lessons.find((lesson) => lesson.id === recommendations[0]?.metadata?.diagnosticLessonId)?.title || recommendations[0].metadata.diagnosticLessonId}
                </span>
              )}
            </div>
          )}
          {recommendations[0]?.metadata?.coachReason && (
            <div className="mt-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <p className="text-[11px] font-black text-[#E86F51] uppercase tracking-wider">AI Coach · Vì sao chọn bài này?</p>
              <p className="text-sm text-[#211A17] dark:text-white mt-1">{recommendations[0].metadata.coachReason}</p>
              {recommendations[0].metadata.coachGoal && (
                <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">
                  <span className="font-bold">Mục tiêu sau phiên:</span> {recommendations[0].metadata.coachGoal}
                </p>
              )}
              {recommendations[0].metadata.coachOutcome && (
                <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">
                  <span className="font-bold">Tiêu chí đạt:</span> {recommendations[0].metadata.coachOutcome}
                </p>
              )}
              {recommendations[0].metadata.coachCheckpoint && (
                <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">
                  <span className="font-bold">Mốc theo dõi:</span> {recommendations[0].metadata.coachCheckpoint}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" aria-label="Bốn nút điều chỉnh của AI-10">
          {[
            { label: 'Độ tải', value: personalizedPlan.difficulty, hint: 'Lina điều chỉnh lượng học theo nhịp và kết quả gần đây.' },
            { label: 'Từ mới', value: '+' + personalizedPlan.newWordsTarget, hint: 'Mục tiêu từ mới trong phiên hôm nay.' },
            { label: 'Quiz', value: personalizedPlan.quizIntensity, hint: 'Mức độ củng cố bằng kiểm tra ngắn.' },
            { label: 'Speaking', value: personalizedPlan.speakingPace, hint: 'Tốc độ phản xạ khi luyện nói cùng Lina.' },
          ].map((signal) => (
            <div key={signal.label} className="rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">{signal.label}</p>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{signal.value}</p>
              <p className="text-[11px] leading-relaxed text-[#716761] dark:text-[#A89E97] mt-1.5">{signal.hint}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4" aria-label="Tóm tắt kế hoạch AI-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">AI-10 · Cách Lina phân bổ thời gian</p>
              <p className="text-sm font-bold text-[#211A17] dark:text-white mt-1">{personalizedPlan.adaptationReason}</p>
            </div>
            <span className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">Tổng {personalizedPlan.dailyMinutes} phút · {personalizedPlan.steps.length} bước</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Các bước trong kế hoạch AI-10">
          {personalizedPlan.steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              aria-label={`Bước ${index + 1}: ${step.title}, ${step.minutes} phút`}
              onClick={() => {
                if (step.action === 'flashcards' && onNavigate) onNavigate('flashcards');
                else if (step.action === 'speaking' && onNavigate) onNavigate('speaking');
                else if (step.action === 'lesson' && recommendations[0]?.targetId && !recommendations[0].targetId.startsWith('level:')) {
                  onSelectLesson(recommendations[0].targetId);
                } else if (step.action === 'review' && recommendations[0]?.metadata?.diagnosticLessonId) {
                  onSelectLesson(recommendations[0].metadata.diagnosticLessonId);
                }
              }}
              className="text-left rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4 hover:border-[#E86F51]/30 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86F51]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#241F1C]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-9 h-9 rounded-xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center font-black">{index + 1}</span>
                <span className="text-xs font-black text-[#E86F51]">{step.minutes} phút</span>
              </div>
              <p className="text-sm font-black text-[#211A17] dark:text-white mt-3">{step.title}</p>
              <p className="text-xs leading-relaxed text-[#716761] dark:text-[#A89E97] mt-1.5">{step.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* AI-10 adaptation signals — presentation only; values reuse existing progress data */}
      <section className="chiu-card p-5 sm:p-7" aria-labelledby="ai10-signals-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">AI-10 · Tín hiệu thích ứng</span>
            <h2 id="ai10-signals-title" className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-1">Lina đang đọc nhịp học của bạn</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1 max-w-2xl">
              Bốn tín hiệu dưới đây giải thích dữ liệu đầu vào cho kế hoạch hôm nay. Chúng chỉ hiển thị dữ liệu đã có, không tạo thêm hồ sơ hay thay đổi learning engine.
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">Cập nhật theo tiến độ hiện tại</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Động lực', value: `${learningSignals.momentum}%`, hint: learningSignals.trend === 'rising' ? 'Đang tăng' : learningSignals.trend === 'falling' ? 'Đang giảm' : 'Ổn định' },
            { label: 'Tính đều đặn', value: `${learningSignals.consistency}%`, hint: 'Mức ổn định của các phiên học gần đây.' },
            { label: 'Hoàn thành gần đây', value: `${learningSignals.completionRate}%`, hint: 'Tiến độ trung bình của các mục đã theo dõi.' },
            { label: 'Kết quả gần nhất', value: learningSignals.recentOutcomeScore == null ? 'Chưa có' : `${learningSignals.recentOutcomeScore}%`, hint: learningSignals.recentOutcomeAgeDays == null ? 'Chưa có phiên hoàn tất gần đây.' : `${learningSignals.recentOutcomeAgeDays} ngày trước` },
          ].map((signal) => (
            <div key={signal.label} className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">{signal.label}</p>
                <span className="text-sm font-black text-[#211A17] dark:text-white">{signal.value}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#716761] dark:text-[#A89E97] mt-2">{signal.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Intelligence — presentation layer built from existing AI-9/AI-10 signals */}
      <section className="chiu-card p-5 sm:p-7" aria-labelledby="learning-intelligence-title">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">Lina Learning Intelligence</span>
            <h2 id="learning-intelligence-title" className="text-2xl font-black text-[#211A17] dark:text-white mt-1">Bản đồ năng lực hiện tại</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">Lina dùng các tín hiệu đã có để cho bạn thấy điểm mạnh, vùng cần củng cố và mốc tiếp theo — không tạo thêm hệ thống dữ liệu mới.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51]">AI-9 · {recommendations[0]?.metadata?.diagnosticConfidence ?? 0}% tin cậy</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 text-[#716761] dark:text-[#A89E97]">{recommendations[0]?.metadata?.diagnosticEvidenceCount ?? 0} tín hiệu chẩn đoán</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Từ vựng', value: levelCompletion?.vocabularyMastery || 0, icon: '文' },
            { label: 'Ngữ pháp', value: levelCompletion?.grammarMastery || 0, icon: '句' },
            { label: 'Quiz', value: levelCompletion?.quizMastery || 0, icon: '✓' },
            { label: 'Mastery', value: levelCompletion?.masteryScore || 0, icon: '★' },
          ].map((skill) => (
            <div key={skill.label} className="rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="w-9 h-9 rounded-xl bg-white dark:bg-[#241F1C] text-[#E86F51] flex items-center justify-center font-black">{skill.icon}</span>
                <span className="text-lg font-black text-[#211A17] dark:text-white">{Math.round(skill.value)}%</span>
              </div>
              <p className="text-xs font-black text-[#211A17] dark:text-white mt-3">{skill.label}</p>
              <div className="h-2 mt-2 rounded-full bg-white dark:bg-[#241F1C] overflow-hidden" role="progressbar" aria-label={`${skill.label}: ${Math.round(skill.value)}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, Math.max(0, skill.value)))}>
                <div className="h-full rounded-full bg-[#E86F51] transition-all" style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          <div className="rounded-2xl border border-[#65A873]/20 bg-[#F3FAF4] dark:bg-[#18241B] p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4F8B5C]">Điểm mạnh</p>
            <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{Math.max(levelCompletion?.vocabularyMastery || 0, levelCompletion?.grammarMastery || 0, levelCompletion?.quizMastery || 0) >= 80 ? "Bạn đã có ít nhất một trụ cột vững." : "Nền tảng đang hình thành; hãy ưu tiên nhịp học đều."}</p>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">{recommendations[0]?.metadata?.coachGoal || "Lina sẽ tiếp tục điều chỉnh trọng tâm theo dữ liệu mới."}</p>
          </div>
          <div className="rounded-2xl border border-[#E86F51]/15 bg-[#FFF9F4] dark:bg-[#181412] p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Vùng cần củng cố</p>
            <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{recommendations[0]?.metadata?.diagnosticTargetLabels?.[0] || ((levelCompletion?.weakVocabularyCount || 0) > (levelCompletion?.weakGrammarCount || 0) ? "Từ vựng cần ôn lại" : "Ngữ pháp cần ôn lại")}</p>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">{recommendations[0]?.metadata?.diagnosticAgingNote || "Lina sẽ ưu tiên tín hiệu có độ tin cậy và độ mới phù hợp."}</p>
          </div>
          <div className="rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#241F1C] p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Mốc tiếp theo</p>
            <p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{(levelCompletion?.completionPercent || 0) >= 100 && (levelCompletion?.masteryScore || 0) >= 80 && selectedLevel < 6 ? "Sẵn sàng kiểm tra HSK " + (selectedLevel + 1) : (levelCompletion?.completionPercent || 0) >= 70 ? "Củng cố để chạm mastery" : "Hoàn thành nền tảng cấp độ hiện tại"}</p>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5">Mốc này chỉ là diễn giải từ tiến độ hiện tại; quy tắc chuyển cấp vẫn giữ nguyên.</p>
          </div>
        </div>
      </section>
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

                setSelectedLevel(nextLevel);
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

            const completedCount = unitLessons.filter((lesson) => progressMap[lesson.id]?.status === 'completed').length;
            const inProgressCount = unitLessons.filter((lesson) => progressMap[lesson.id]?.status === 'in_progress').length;
            const unlockedCount = unitLessons.filter((lesson) => {
              if (!lesson.prerequisiteLessonId) return true;
              return progressMap[lesson.prerequisiteLessonId]?.status === 'completed';
            }).length;
            const unitPercent = unitLessons.length ? Math.round((completedCount / unitLessons.length) * 100) : 0;
            const unitState = completedCount === unitLessons.length && unitLessons.length > 0
              ? 'Hoàn thành'
              : inProgressCount > 0
                ? 'Đang học'
                : unlockedCount > 0
                  ? 'Sẵn sàng'
                  : 'Đang chờ';

            return (
              <div key={unit.id} className="space-y-4">
                {/* Unit Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#E86F51]/15">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-[#E86F51] tracking-wider uppercase">
                        Unit {unit.order} · {unit.titleZh}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${unitState === 'Hoàn thành' ? 'bg-[#65A873]/10 text-[#4F8B5C]' : unitState === 'Đang học' ? 'bg-[#E86F51]/10 text-[#E86F51]' : 'bg-[#F3E8DE] dark:bg-[#2F2520] text-[#716761] dark:text-[#B5AAA2]'}`}>
                        {unitState}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                      {unit.title}
                    </h3>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                      {unit.description}
                    </p>
                  </div>
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-[#716761] dark:text-[#A89E97] mb-1">
                      <span>{completedCount}/{unitLessons.length} bài hoàn thành · {inProgressCount} đang học</span>
                      <span>{unitPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-[#342822] overflow-hidden" role="progressbar" aria-label={`Tiến độ Unit ${unit.order}: ${unitPercent}% · ${unitState}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={unitPercent}>
                      <div className="h-full rounded-full bg-[#E86F51] transition-all" style={{ width: `${unitPercent}%` }} />
                    </div>
                  </div>
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
                        role={!isLocked ? 'button' : undefined}
                        tabIndex={!isLocked ? 0 : undefined}
                        aria-label={!isLocked ? `${lesson.title}. ${isCompleted ? 'Đã hoàn thành' : isInProgress ? `Đang học ${progress?.progressPercent || 0}%` : 'Sẵn sàng bắt đầu'}` : `${lesson.title}. Bài học đang khóa`}
                        onClick={() => !isLocked && onSelectLesson(lesson.id)}
                        onKeyDown={(event) => {
                          if (!isLocked && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            onSelectLesson(lesson.id);
                          }
                        }}
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
                        {!isLocked && (
                          <div className="space-y-2 pt-3 border-t border-[#E86F51]/10">
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">
                              <span>Tiến độ bài</span>
                              <span>{isCompleted ? 100 : Math.round(progress?.progressPercent || 0)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-[#342822] overflow-hidden" role="progressbar" aria-label={`Tiến độ ${lesson.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={isCompleted ? 100 : Math.round(progress?.progressPercent || 0)}>
                              <div className="h-full rounded-full bg-[#E86F51] transition-all" style={{ width: `${isCompleted ? 100 : Math.min(100, Math.max(0, progress?.progressPercent || 0))}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 text-xs text-[#716761] dark:text-[#A89E97]">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {lesson.estimatedMinutes} phút
                          </span>

                          <span className={`flex items-center gap-1 font-bold ${
                              isLocked
                                ? 'text-gray-400'
                                : 'text-[#E86F51] group-hover:translate-x-1 transition-transform'
                            }`}
                          >
                            <span>{isCompleted ? 'Ôn tập lại' : isInProgress ? 'Học tiếp' : 'Bắt đầu'}</span>
                            <ChevronRight size={14} />
                          </span>
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
    </main>
  );
};