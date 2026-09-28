import React, { useState } from 'react';
import {
  ArrowLeft, Volume2, Sparkles, CheckCircle2, MessageSquare,
  ChevronRight, ChevronLeft, RotateCcw, Check, X, Mic,
} from 'lucide-react';
import { useLesson } from '../hooks/useCurriculum';
import { QuizAnswer, QuizAttempt, DialogueLine } from '../types/curriculum';
import { LinaChatModal } from '../components/LinaChatModal';
import { voiceService } from '../services/voiceService';

interface CurriculumLessonViewerProps {
  lessonId: string;
  onBack: () => void;
  onNavigateToSpeaking?: (topic: string) => void;
  onNavigate?: (route: string, param?: string) => void;
}

export const CurriculumLessonViewer: React.FC<CurriculumLessonViewerProps> = ({ lessonId, onBack, onNavigateToSpeaking, onNavigate }) => {
  const { lesson, sections, vocabulary, grammar, quizQuestions, userProgress, isLoading, saveSectionProgress, completeQuiz } = useLesson(lessonId);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isLinaModalOpen, setIsLinaModalOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(null);
  const [learningLoopResult, setLearningLoopResult] = useState<Awaited<ReturnType<typeof completeQuiz>>>(null);
  const [quizPersistenceError, setQuizPersistenceError] = useState<string | null>(null);
  const [revealedGrammarPractice, setRevealedGrammarPractice] = useState<Record<string, boolean>>({});
  const [revealedVocabularyPractice, setRevealedVocabularyPractice] = useState<Record<string, boolean>>({});
  const [revealedDialoguePractice, setRevealedDialoguePractice] = useState<Record<string, boolean>>({});
  const [revealedSpeakingPrompt, setRevealedSpeakingPrompt] = useState(false);
  const [reviewedQuizItems, setReviewedQuizItems] = useState<Record<string, boolean>>({});
  const [completedWrapUpSteps, setCompletedWrapUpSteps] = useState<Record<string, boolean>>({});
  const [speakingPracticeComplete, setSpeakingPracticeComplete] = useState(false);

  if (isLoading || !lesson) return <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4"><div className="w-8 h-8 border-3 border-[#E86F51] border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-sm text-[#716761] dark:text-[#A89E97]">Đang tải nội dung bài học...</p></div>;

  const currentSection = sections[activeSectionIndex] || sections[0];
  const progressPercent = Math.round(((activeSectionIndex + 1) / Math.max(sections.length, 1)) * 100);
  const isLastSection = activeSectionIndex >= sections.length - 1;
  const answeredQuizCount = quizQuestions.filter((q) => Boolean(selectedAnswers[q.id])).length;
  const quizCorrectCount = quizQuestions.filter((q) => {
    const answer = selectedAnswers[q.id];
    return Array.isArray(q.correctAnswer) ? JSON.stringify(answer) === JSON.stringify(q.correctAnswer) : answer === q.correctAnswer;
  }).length;
  const missedQuizQuestions = quizQuestions.filter((q) => {
    const answer = selectedAnswers[q.id];
    return Array.isArray(q.correctAnswer) ? JSON.stringify(answer) !== JSON.stringify(q.correctAnswer) : answer !== q.correctAnswer;
  });
  const reviewedMissedCount = missedQuizQuestions.filter((q) => reviewedQuizItems[q.id]).length;
  const quizRecoveryComplete = !quizSubmitted || missedQuizQuestions.length === 0 || reviewedMissedCount === missedQuizQuestions.length;
  const wrapUpComplete = ['recall', 'speak', 'review'].every((step) => !!completedWrapUpSteps[step]);
  const recallPracticeComplete = vocabulary.slice(0, 3).length > 0 && vocabulary.slice(0, 3).every((vocab) => revealedVocabularyPractice['recall-' + vocab.id]);
  const masteryCompletionPercent = Math.round(([
    quizSubmitted && quizScore >= lesson.passingScore,
    quizSubmitted && quizRecoveryComplete,
    completedWrapUpSteps.recall,
    completedWrapUpSteps.speak,
    completedWrapUpSteps.review,
  ].filter(Boolean).length / 5) * 100);
  const masteryStatus = masteryCompletionPercent >= 100 ? 'Khóa vòng học ✓' : masteryCompletionPercent >= 60 ? 'Đang hình thành' : 'Cần củng cố';
  const masteryCheckpointLabel = !quizSubmitted
    ? 'Quiz chưa hoàn tất'
    : quizScore >= lesson.passingScore
      ? quizRecoveryComplete ? 'Quiz + Recovery đã khóa' : 'Quiz đạt · còn Recovery'
      : quizRecoveryComplete ? 'Quiz chưa đạt · đã ôn điểm sai' : 'Quiz chưa đạt · còn điểm sai';
  const masteryJourney = [
    { id: 'quiz', label: 'Quiz', done: quizSubmitted && quizScore >= lesson.passingScore },
    { id: 'recovery', label: 'Recovery', done: quizRecoveryComplete },
    { id: 'recall', label: 'Recall', done: !!completedWrapUpSteps.recall },
    { id: 'speak', label: 'Speak', done: !!completedWrapUpSteps.speak },
    { id: 'review', label: 'Review', done: !!completedWrapUpSteps.review },
  ];
  const masteryNextStep = !quizSubmitted
    ? 'Hoàn tất Quiz để tạo tín hiệu mastery.'
    : !quizRecoveryComplete
      ? 'Ôn hết các điểm sai trước khi khóa vòng học.'
      : !completedWrapUpSteps.recall
        ? 'Gọi lại từ vựng một lần nữa để tăng độ nhớ.'
        : !completedWrapUpSteps.speak
          ? 'Nói lại kiến thức bằng Speaking 60 giây.'
          : !completedWrapUpSteps.review
            ? 'Chọn bước Review để Lina nối sang phần tiếp theo.'
            : learningLoopResult?.recommendations?.[0]?.title || 'Sẵn sàng chuyển sang bước học tiếp theo.';
  const masteryNextReason = !quizSubmitted
    ? 'Chưa có kết quả Quiz nên Lina chưa có đủ tín hiệu để chốt vòng học.'
    : !quizRecoveryComplete
      ? `Lina đang bám ${missedQuizQuestions.length - reviewedMissedCount} điểm sai chưa được ôn.`
      : !completedWrapUpSteps.recall
        ? 'Recall giúp kéo kiến thức từ trí nhớ chủ động trước khi chuyển sang phản xạ.'
        : !completedWrapUpSteps.speak
          ? 'Speaking chuyển kiến thức vừa học thành phản xạ sử dụng.'
          : !completedWrapUpSteps.review
            ? 'Review dùng recommendation hiện tại để nối sang bước học phù hợp.'
            : 'Các checkpoint đã hoàn tất; Lina có thể nối sang recommendation tiếp theo.';
  const masteryNextAction = !quizSubmitted
    ? 'Làm Quiz'
    : !quizRecoveryComplete
      ? 'Ôn điểm sai'
      : !completedWrapUpSteps.recall
        ? 'Recall'
        : !completedWrapUpSteps.speak
          ? 'Speaking'
          : !completedWrapUpSteps.review
            ? 'Review'
            : 'Đi tiếp';

  const navigateToRecommendation = () => {
    const next = learningLoopResult?.recommendations?.[0];
    if (next?.targetId === 'flashcards') {
      onNavigate?.('flashcards');
      return true;
    }
    if (next?.targetId?.startsWith('level:')) {
      onNavigate?.('learn', next.targetId);
      return true;
    }
    if (next?.targetId) {
      onNavigate?.('learn-detail', next.targetId);
      return true;
    }
    return false;
  };

  const completeWrapUpStep = (stepId: 'recall' | 'speak' | 'review') => {
    setCompletedWrapUpSteps((current) => ({ ...current, [stepId]: true }));
  };

  const handleMasteryNextAction = () => {
    if (!quizSubmitted) {
      const quizIndex = sections.findIndex((section) => section.type === 'quiz');
      if (quizIndex >= 0) goToSection(quizIndex);
      return;
    }
    if (!quizRecoveryComplete) {
      const quizIndex = sections.findIndex((section) => section.type === 'quiz');
      if (quizIndex >= 0) goToSection(quizIndex);
      return;
    }
    if (!completedWrapUpSteps.recall) {
      const vocabularyIndex = sections.findIndex((section) => section.type === 'vocabulary');
      if (vocabularyIndex >= 0) goToSection(vocabularyIndex);
      return;
    }
    if (!completedWrapUpSteps.speak) {
      if (onNavigateToSpeaking) onNavigateToSpeaking(lesson.title);
      else setIsLinaModalOpen(true);
      return;
    }
    if (!completedWrapUpSteps.review) {
      if (!navigateToRecommendation()) {
        const grammarIndex = sections.findIndex((section) => section.type === 'grammar');
        if (grammarIndex >= 0) goToSection(grammarIndex);
      }
      return;
    }
    if (!navigateToRecommendation()) onBack();
  };

  const goToSection = (idx: number) => {
    const safeIndex = Math.max(0, Math.min(idx, sections.length - 1));
    setActiveSectionIndex(safeIndex);
    saveSectionProgress(sections[safeIndex].id, Math.round(((safeIndex + 1) / Math.max(sections.length, 1)) * 100));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const playAudio = (text: string) => voiceService.speakText(text);
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    if (quizSubmitted) return;
    setQuizPersistenceError(null);
    setQuizStartedAt((startedAt) => startedAt || new Date().toISOString());
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };
  const handleSubmitQuiz = async () => {
    if (quizSubmitted || quizQuestions.length === 0) return;
    const completedAt = new Date().toISOString();
    const startedAt = quizStartedAt || completedAt;
    const answers: QuizAnswer[] = quizQuestions.map((q) => {
      const answer = selectedAnswers[q.id];
      const correct = Array.isArray(q.correctAnswer) ? JSON.stringify(answer) === JSON.stringify(q.correctAnswer) : answer === q.correctAnswer;
      return { questionId: q.id, answer, isCorrect: correct, pointsEarned: correct ? q.points : 0 };
    });
    const totalPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : Math.round((correctCount / quizQuestions.length) * 100);
    const attempt: QuizAttempt = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `quiz-${lesson.id}-${Date.now()}`,
      userId: userProgress?.userId || 'guest_user', lessonId: lesson.id, score, totalPoints, earnedPoints,
      correctAnswers: correctCount, totalQuestions: quizQuestions.length, passed: score >= lesson.passingScore,
      answers, startedAt, completedAt,
    };
    setQuizScore(score); setQuizSubmitted(true); setQuizPersistenceError(null);
    try { setLearningLoopResult(await completeQuiz(attempt)); }
    catch (error) { console.error('Failed to persist quiz learning loop:', error); setQuizPersistenceError('Kết quả đã được chấm trên màn hình, nhưng chưa đồng bộ được tiến độ. Hãy thử lại sau.'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E86F51]/15">
        <button type="button" onClick={onBack} className="chiu-btn min-h-[44px] flex items-center gap-2 px-3 text-sm font-bold text-[#716761] dark:text-[#A89E97] hover:text-[#E86F51]"><ArrowLeft size={18} /><span>Quay lại Lộ trình</span></button>
        <button type="button" onClick={() => setIsLinaModalOpen(true)} className="chiu-btn chiu-btn-secondary px-3.5 text-xs flex items-center gap-1.5"><Sparkles size={14} /><span className="hidden sm:inline">Hỏi Lina về bài này</span><span className="sm:hidden">Hỏi Lina</span></button>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Tiến trình bài học">
        {['Mission', 'Speaking', 'Review'].map((label, index) => <div key={label} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${index === 0 ? 'bg-[#FFF0EB] dark:bg-[#342822] border-[#E86F51]/20 text-[#E86F51]' : 'bg-white dark:bg-[#241F1C] border-[#E86F51]/10 text-[#8A7F78]'}`}><span className="w-6 h-6 rounded-lg bg-current/10 flex items-center justify-center text-[10px] font-black">{index + 1}</span><span className="text-[10px] sm:text-xs font-black truncate">{label}</span></div>)}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><span className="text-xs font-black uppercase text-[#E86F51] tracking-wider">HSK {lesson.levelNumber} · Bài {lesson.order}</span><h1 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white">{lesson.title} · <span className="text-[#E86F51]">{lesson.titleZh}</span></h1></div><div className="text-xs font-bold text-[#716761] dark:text-[#A89E97] sm:text-right">Bước {activeSectionIndex + 1} / {sections.length} · {progressPercent}%</div></div>
        <div className="chiu-progress" aria-label={`Tiến độ bài học ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">{sections.map((sec, idx) => { const isActive = idx === activeSectionIndex; const isDone = idx < activeSectionIndex; return <button key={sec.id} type="button" onClick={() => goToSection(idx)} className={`min-h-[44px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${isActive ? 'bg-[#E86F51] text-white shadow-sm' : isDone ? 'bg-[#EAF5EC] dark:bg-green-950/30 text-[#65A873]' : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10 hover:border-[#E86F51]/40'}`}>{isDone && <CheckCircle2 size={13} />}{sec.title}</button>; })}</div>
      </div>

      <div className="p-5 sm:p-8 rounded-[2rem] bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-[0_16px_45px_rgba(80,48,35,0.08)] min-h-[420px] flex flex-col justify-between space-y-6">
        {currentSection.type === 'intro' && <div className="space-y-6 animate-fade-in"><div className="space-y-2"><span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]">Tổng quan mục tiêu bài học</span><h2 className="text-xl font-black text-[#211A17] dark:text-white">Chào mừng bạn đến với bài học: {lesson.title}</h2><p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">{lesson.description}</p></div><div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-[#2A2320] border border-[#E86F51]/20 space-y-3"><h3 className="text-sm font-bold text-[#211A17] dark:text-white flex items-center gap-2"><CheckCircle2 size={16} className="text-[#65A873]" />Bạn sẽ đạt được sau bài học này:</h3><ul className="space-y-2 text-sm text-[#716761] dark:text-[#A89E97]">{lesson.objectives.map((obj, i) => <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E86F51] mt-2 shrink-0" /><span>{obj}</span></li>)}</ul></div></div>}

        {currentSection.type === 'vocabulary' && <><div className="space-y-6 animate-fade-in"><div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-black text-[#211A17] dark:text-white">Từ vựng trọng tâm HSK {lesson.levelNumber}</h3><p className="text-xs text-[#716761] dark:text-[#A89E97]">Nhấn vào biểu tượng loa để nghe phát âm chuẩn giọng Bắc Kinh.</p></div><span className="text-xs font-bold text-[#E86F51] whitespace-nowrap">{vocabulary.length} từ mới</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{vocabulary.map((vocab) => <div key={vocab.id} className="p-4 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] hover:border-[#E86F51] transition-all flex flex-col justify-between gap-3 shadow-xs"><div className="flex items-start justify-between"><div><div className="flex items-baseline gap-2"><span className="text-2xl font-black text-[#211A17] dark:text-white">{vocab.hanzi}</span><span className="text-sm font-medium text-[#E86F51]">{vocab.pinyin}</span></div><p className="text-sm font-semibold text-[#716761] dark:text-[#A89E97] mt-1">{vocab.meaningVi}</p></div><button type="button" onClick={() => playAudio(vocab.hanzi)} className="chiu-btn min-h-[44px] min-w-[44px] p-2 rounded-xl bg-orange-50 dark:bg-[#342822] text-[#E86F51] hover:bg-[#E86F51] hover:text-white" title="Nghe phát âm" aria-label={`Nghe phát âm ${vocab.hanzi}`}><Volume2 size={16} /></button></div>{vocab.exampleSentence && <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-[#716761] dark:text-[#A89E97]"><p className="font-semibold text-[#211A17] dark:text-gray-200">{vocab.exampleSentence}</p><p className="text-[#E86F51]">{vocab.examplePinyin}</p><p className="italic">{vocab.exampleTranslation}</p></div>}</div>)}</div></div>
          <div className="p-5 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] space-y-4">
            <div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Lina Recall · phản xạ 30 giây</span><h4 className="text-lg font-black text-[#211A17] dark:text-white mt-1">Gọi từ vựng từ trí nhớ</h4><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Che nghĩa và ví dụ, tự nhớ từ trước rồi mới mở gợi ý. Đây là bước chuyển từ “nhìn thấy” sang “tự gọi lại”.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vocabulary.slice(0, 3).map((vocab) => { const key = 'recall-' + vocab.id; return <div key={vocab.id} className="p-4 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10 space-y-3"><div className="flex items-center justify-between gap-2"><p className="text-lg font-black text-[#211A17] dark:text-white">{vocab.hanzi}</p><button type="button" onClick={() => playAudio(vocab.hanzi)} className="chiu-btn min-h-[40px] min-w-[40px] p-2 rounded-lg bg-orange-50 dark:bg-[#342822] text-[#E86F51]" aria-label={"Nghe phát âm " + vocab.hanzi}><Volume2 size={15} /></button></div><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Bạn nhớ nghĩa tiếng Việt và tự đặt một câu chưa?</p><button type="button" onClick={() => setRevealedVocabularyPractice((prev) => ({ ...prev, [key]: !prev[key] }))} className="chiu-btn chiu-btn-secondary min-h-[40px] w-full text-xs">{revealedVocabularyPractice[key] ? 'Ẩn gợi ý' : 'Mở gợi ý'}</button>{revealedVocabularyPractice[key] && <div className="p-3 rounded-lg bg-white dark:bg-[#1E1917] border border-[#E86F51]/10 space-y-1"><p className="text-xs font-bold text-[#211A17] dark:text-white">{vocab.meaningVi}</p>{vocab.exampleSentence && <><p className="text-[11px] font-bold text-[#211A17] dark:text-white">{vocab.exampleSentence}</p><p className="text-[11px] text-[#E86F51]">{vocab.examplePinyin}</p><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{vocab.exampleTranslation}</p></>}</div>}</div>; })}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-[10px] text-[#716761] dark:text-[#A89E97]">Chỉ xác nhận sau khi đã tự gọi lại và nói lại từng từ.</p>
              <button type="button" disabled={!recallPracticeComplete || completedWrapUpSteps.recall} onClick={() => completeWrapUpStep('recall')} className="chiu-btn chiu-btn-secondary min-h-[40px] px-4 text-[10px] disabled:opacity-45 disabled:cursor-not-allowed">
                {completedWrapUpSteps.recall ? 'Recall đã khóa ✓' : 'Xác nhận hoàn tất Recall'}
              </button>
            </div>
          </div>
        </>}

        {currentSection.type === 'grammar' && <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-black text-[#211A17] dark:text-white">Cấu trúc ngữ pháp trọng điểm</h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Lina không chỉ cho bạn biết cấu trúc — phần luyện sâu giúp nhận ra lỗi và dùng đúng trong ngữ cảnh.</p>
          </div>
          <div className="space-y-4">
            {grammar.map((g) => (
              <div key={g.id} className="p-5 rounded-2xl border border-[#E86F51]/20 bg-[#FFFDFB] dark:bg-[#1E1917] space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-bold text-[#211A17] dark:text-white">{g.title}</h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">{g.pattern}</span>
                </div>
                <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">{g.explanationVi}</p>
                <div className="space-y-2 pt-2 border-t border-[#E86F51]/10">
                  <span className="text-xs font-bold text-[#E86F51] uppercase tracking-wider">Ví dụ minh họa:</span>
                  {g.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 flex items-center justify-between text-xs">
                      <div><p className="font-bold text-[#211A17] dark:text-white">{ex.chinese}</p><p className="text-[#E86F51]">{ex.pinyin}</p><p className="text-[#716761] dark:text-[#A89E97]">{ex.translationVi}</p></div>
                      <button type="button" onClick={() => playAudio(ex.chinese)} className="chiu-btn min-h-[44px] min-w-[44px] p-1.5 rounded-lg text-gray-400 hover:text-[#E86F51]" aria-label={`Nghe ví dụ ${ex.chinese}`}><Volume2 size={15} /></button>
                    </div>
                  ))}
                </div>
                {g.commonMistakes?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Lỗi hay gặp</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                      {g.commonMistakes.map((mistake, i) => <li key={i}>• {mistake}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] space-y-4">
            <div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Lina Drill · phản xạ 30 giây</span><h4 className="text-lg font-black text-[#211A17] dark:text-white mt-1">Đừng chỉ đọc — hãy tự tạo câu</h4><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Đọc gợi ý, tự nói hoặc viết một câu mới trước khi mở đáp án mẫu.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grammar.slice(0, 2).map((g) => { const key = 'drill-' + g.id; const example = g.examples[0]; return <div key={g.id} className="p-4 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10 space-y-3"><div><p className="text-xs font-black text-[#211A17] dark:text-white">{g.title}</p><p className="text-[11px] font-bold text-[#E86F51] mt-1">{g.pattern}</p></div><p className="text-xs text-[#716761] dark:text-[#A89E97]">Gợi ý: thay một thành phần trong mẫu câu này bằng thông tin của bạn.</p><button type="button" onClick={() => setRevealedGrammarPractice((prev) => ({ ...prev, [key]: !prev[key] }))} className="chiu-btn chiu-btn-secondary min-h-[40px] w-full text-xs">{revealedGrammarPractice[key] ? 'Ẩn đáp án mẫu' : 'Xem đáp án mẫu'}</button>{revealedGrammarPractice[key] && <div className="p-3 rounded-lg bg-white dark:bg-[#1E1917] border border-[#E86F51]/10"><p className="text-xs font-bold text-[#211A17] dark:text-white">{example.chinese}</p><p className="text-[11px] text-[#E86F51]">{example.pinyin}</p><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{example.translationVi}</p></div>}</div>; })}
            </div>
          </div>
          {Array.isArray(currentSection.content?.deepPractice) && currentSection.content.deepPractice.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#FFF5F1] dark:bg-[#2A2320] border-2 border-[#E86F51]/15 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Deep Practice · HSK {lesson.levelNumber}</span>
                <h4 className="text-lg font-black text-[#211A17] dark:text-white mt-1">Luyện sâu điểm ngữ pháp của bài</h4>
                <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Tập trung vào cấu trúc riêng của bài trước khi sang quiz tổng hợp.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSection.content.deepPractice.map((g: any) => (
                  <div key={g.id} className="p-4 rounded-xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10">
                    <p className="text-sm font-black text-[#211A17] dark:text-white">{g.title}</p>
                    <p className="text-xs font-bold text-[#E86F51] mt-1">{g.pattern}</p>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-2">{g.explanationVi}</p>
                    {g.commonMistakes?.[0] && <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2">⚠ {g.commonMistakes[0]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>}

        {currentSection.type === 'dialogue' && <div className="space-y-6 animate-fade-in"><div><h3 className="text-xl font-black text-[#211A17] dark:text-white">Hội thoại ngữ cảnh thực tế</h3><p className="text-xs text-[#716761] dark:text-[#A89E97]">Nghe và đọc theo cuộc đối thoại giữa Lina 老师 và học viên.</p></div> <div className="space-y-3">{(currentSection.content?.lines || []).map((line: DialogueLine) => <div key={line.id} className="p-4 rounded-2xl bg-[#FFFDFB] dark:bg-[#1E1917] border border-[#E86F51]/15 flex items-start justify-between gap-3"><div className="space-y-1"><span className="text-xs font-black text-[#E86F51] uppercase">{line.speaker}</span><p className="text-lg font-bold text-[#211A17] dark:text-white">{line.chinese}</p><p className="text-xs font-semibold text-[#E86F51]">{line.pinyin}</p><p className="text-xs text-[#716761] dark:text-[#A89E97]">{line.translationVi}</p></div><button type="button" onClick={() => playAudio(line.chinese)} className="chiu-btn min-h-[44px] min-w-[44px] p-2 rounded-xl bg-orange-50 dark:bg-[#342822] text-[#E86F51] shrink-0 mt-1" aria-label={'Nghe ' + line.speaker}><Volume2 size={16} /></button></div>)}</div> <div className="p-5 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] space-y-4"><div><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Lina Role-play · 60 giây</span><h4 className="text-lg font-black text-[#211A17] dark:text-white mt-1">Đổi vai và nói lại hội thoại</h4><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Chọn một câu, tự nói lại theo vai của bạn trước khi mở gợi ý.</p></div><div className="space-y-2">{(currentSection.content?.lines || []).slice(0, 3).map((line: DialogueLine, index: number) => { const key = 'roleplay-' + line.id; return <div key={line.id} className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Câu {index + 1} · {line.speaker}</p><p className="text-xs font-bold text-[#211A17] dark:text-white">{revealedDialoguePractice[key] ? line.chinese : '••• Hãy tự nói lại câu này •••'}</p>{revealedDialoguePractice[key] && <><p className="text-[11px] text-[#E86F51]">{line.pinyin}</p><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{line.translationVi}</p></>}</div><button type="button" onClick={() => setRevealedDialoguePractice((prev) => ({ ...prev, [key]: !prev[key] }))} className="chiu-btn chiu-btn-secondary min-h-[40px] px-3 text-[11px] shrink-0">{revealedDialoguePractice[key] ? 'Ẩn gợi ý' : 'Mở gợi ý'}</button></div>; })}</div></div> </div>}

        {currentSection.type === 'speaking' && <div className="space-y-6 animate-fade-in text-center py-4"><div className="relative mx-auto w-24 h-24 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] flex items-center justify-center shadow-lg shadow-[#E86F51]/10"><div className="absolute inset-0 rounded-full border border-[#E86F51]/20 animate-pulse" /><Mic size={38} /></div><div className="max-w-md mx-auto space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Bước tiếp theo · Speaking</span><h3 className="text-xl font-black text-[#211A17] dark:text-white">Luyện nói cùng Lina AI</h3><p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">Áp dụng ngay từ vựng và mẫu câu vừa học vào một phiên giao tiếp đàm thoại ngắn cùng gia sư AI Lina.</p></div><div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10 max-w-xl mx-auto text-left space-y-3"><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina Speaking Prompt · 60 giây</p><p className="text-sm font-black text-[#211A17] dark:text-white">Hãy nói 3 câu về chủ đề “{lesson.title}”.</p><p className="text-xs text-[#716761] dark:text-[#A89E97]">Cố gắng dùng ít nhất một từ vựng và một cấu trúc ngữ pháp vừa học.</p><button type="button" onClick={() => setRevealedSpeakingPrompt((value) => !value)} className="chiu-btn chiu-btn-secondary min-h-[40px] w-full text-xs">{revealedSpeakingPrompt ? 'Ẩn gợi ý' : 'Mở gợi ý từ vựng & cấu trúc'}</button>{revealedSpeakingPrompt && <div className="p-3 rounded-xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10"><p className="text-[11px] font-bold text-[#211A17] dark:text-white">Từ gợi ý: {vocabulary.slice(0, 3).map((item) => item.hanzi).join(' · ')}</p><p className="text-[11px] text-[#E86F51] mt-1">Mẫu câu: {grammar.slice(0, 2).map((item) => item.pattern).join(' · ')}</p></div>}</div><div className="flex flex-col sm:flex-row justify-center gap-3"><button type="button" onClick={() => setIsLinaModalOpen(true)} className="chiu-btn chiu-btn-primary px-6 text-sm flex items-center justify-center gap-2"><Sparkles size={16} />Trò chuyện với Lina</button>{onNavigateToSpeaking && <button type="button" onClick={() => onNavigateToSpeaking(lesson.title)} className="chiu-btn chiu-btn-secondary px-5 text-sm">Phòng Luyện Nói Chuyên Sâu</button>}</div><div className="max-w-xl mx-auto w-full p-4 rounded-2xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Checkpoint Speaking</p><p className="text-xs font-bold text-[#211A17] dark:text-white mt-1">{speakingPracticeComplete ? 'Speaking 60 giây đã được xác nhận.' : 'Chỉ xác nhận sau khi bạn đã nói đủ 60 giây.'}</p></div><button type="button" disabled={speakingPracticeComplete} onClick={() => { setSpeakingPracticeComplete(true); completeWrapUpStep('speak'); }} className="chiu-btn chiu-btn-secondary min-h-[40px] px-4 text-[10px] shrink-0 disabled:opacity-45 disabled:cursor-not-allowed">{speakingPracticeComplete ? 'Speaking đã khóa ✓' : 'Xác nhận hoàn tất Speaking'}</button></div></div>}

        {currentSection.type === 'summary' && <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2 py-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E86F51]">Lina Wrap-up · chốt bài</span><h3 className="text-2xl font-black text-[#211A17] dark:text-white">Biến bài học thành thói quen</h3><p className="text-sm text-[#716761] dark:text-[#A89E97] max-w-xl mx-auto">Bạn vừa đi qua nội dung của bài. Lina gợi ý một hành động ngắn để kiến thức tiếp tục được sử dụng sau khi rời màn hình này.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'recall', label: '1 · Recall', title: 'Nhớ lại 3 từ', text: 'Tự nói 3 từ vựng vừa học mà không nhìn danh sách.' },
              { id: 'speak', label: '2 · Speak', title: 'Nói 1 câu', text: 'Dùng một mẫu ngữ pháp của bài để nói về chính bạn.' },
              { id: 'review', label: '3 · Review', title: 'Giữ nhịp ôn', text: 'Nếu có điểm chưa chắc, quay lại Flashcards hoặc recommendation tiếp theo.' },
            ].map((step) => <button key={step.id} type="button" onClick={() => {
                if (step.id === 'recall') {
                  const vocabularyIndex = sections.findIndex((section) => section.type === 'vocabulary');
                  if (vocabularyIndex >= 0) goToSection(vocabularyIndex);
                } else if (step.id === 'speak') {
                  if (completedWrapUpSteps.speak) return;
                  if (onNavigateToSpeaking) onNavigateToSpeaking(lesson.title);
                  else setIsLinaModalOpen(true);
                } else if (step.id === 'review') {
                  completeWrapUpStep('review');
                  if (!navigateToRecommendation()) {
                    const grammarIndex = sections.findIndex((section) => section.type === 'grammar');
                    if (grammarIndex >= 0) goToSection(grammarIndex);
                  }
                }
              }} className="text-left p-4 rounded-2xl border border-[#E86F51]/15 bg-[#FFF9F4] dark:bg-[#241F1C] hover:border-[#E86F51]/40 transition-colors"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">{step.label}</p><span className="text-[10px] font-black text-[#E86F51]">{completedWrapUpSteps[step.id] ? 'Đã khóa ✓' : 'Chạm để hoàn tất'}</span></div><p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{step.title}</p><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{step.text}</p></button>)}
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina Mastery · sau bài</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-0.5">{wrapUpComplete ? 'Vòng học đã khép kín' : 'Bạn đang ở bước củng cố cuối'}</p></div>
              <span className="text-[10px] font-black text-[#E86F51]">{Object.values(completedWrapUpSteps).filter(Boolean).length}/3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                ['Recall', 'Gọi lại từ vựng', completedWrapUpSteps.recall],
                ['Speak', 'Đưa kiến thức vào phản xạ', completedWrapUpSteps.speak],
                ['Review', 'Chọn bước ôn tiếp theo', completedWrapUpSteps.review],
              ].map(([label, textValue, done]) => <div key={label as string} className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-black text-[#E86F51]">{label as string}</p><p className="text-[11px] font-bold text-[#211A17] dark:text-white mt-1">{textValue as string}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">{done ? 'Đã hoàn tất ✓' : 'Chưa hoàn tất'}</p></div>)}
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina Learning Loop</p><p className="text-xs font-black text-[#211A17] dark:text-white mt-1">{masteryCheckpointLabel}</p></div>
                <span className="text-[10px] font-black text-[#E86F51]">{masteryJourney.filter((step) => step.done).length}/5</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Tiến trình vòng học">
                {masteryJourney.map((step) => <button key={step.id} type="button" onClick={() => {
                  if (step.id === 'quiz' || step.id === 'recovery') { const quizIndex = sections.findIndex((section) => section.type === 'quiz'); if (quizIndex >= 0) goToSection(quizIndex); }
                  else if (step.id === 'recall') { const vocabularyIndex = sections.findIndex((section) => section.type === 'vocabulary'); if (vocabularyIndex >= 0) goToSection(vocabularyIndex); }
                  else if (step.id === 'speak') { if (completedWrapUpSteps.speak) return; if (onNavigateToSpeaking) onNavigateToSpeaking(lesson.title); else setIsLinaModalOpen(true); }
                  else handleMasteryNextAction();
                }} className={`min-h-[40px] rounded-lg text-[9px] font-black border transition-all ${step.done ? 'bg-[#EAF5EC] dark:bg-green-950/30 border-[#65A873]/30 text-[#65A873]' : 'bg-white dark:bg-[#1E1917] border-[#E86F51]/10 text-[#8A7F78] hover:border-[#E86F51]/40'}`} aria-label={`${step.label}: ${step.done ? 'đã hoàn tất' : 'chưa hoàn tất'}`}>{step.done ? '✓ ' : ''}{step.label}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-black text-[#E86F51]">Kết quả vừa đạt</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{quizSubmitted ? `Quiz ${quizScore}%` : 'Chưa có kết quả quiz'}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">{quizSubmitted ? (quizScore >= lesson.passingScore ? 'Đã đạt mục tiêu bài học.' : 'Nên củng cố trước khi thử lại.') : 'Hoàn tất quiz để Lina đọc tín hiệu mastery.'}</p></div>
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-black text-[#E86F51]">Bước Lina nối tiếp</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{learningLoopResult?.recommendations?.[0]?.label || 'Chờ tín hiệu học tập'}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">Dựa trên kết quả và tín hiệu học tập hiện có.</p></div>
            <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black text-[#E86F51]">Quiz recovery</p><p className="text-[11px] font-bold text-[#211A17] dark:text-white mt-1">{quizSubmitted && missedQuizQuestions.length ? `${reviewedMissedCount}/${missedQuizQuestions.length} điểm sai đã ôn` : 'Không còn điểm sai cần xử lý'}</p></div><span className={`text-[10px] font-black ${quizRecoveryComplete ? 'text-[#65A873]' : 'text-[#E86F51]'}`}>{quizRecoveryComplete ? 'Đã khóa ✓' : 'Cần ôn thêm'}</span></div>
            <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black text-[#E86F51]">Mastery signal</p><span className={`text-[10px] font-black ${masteryCompletionPercent >= 100 ? 'text-[#65A873]' : 'text-[#E86F51]'}`}>{masteryStatus}</span></div><div className="mt-2 h-2 rounded-full bg-[#E86F51]/10 overflow-hidden"><div className="h-full rounded-full bg-[#E86F51] transition-all" style={{ width: `${masteryCompletionPercent}%` }} /></div><p className="text-[11px] font-bold text-[#211A17] dark:text-white mt-1">{masteryCompletionPercent}% vòng học đã được khóa</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">{quizSubmitted ? `Quiz ${quizScore}% · Recovery ${reviewedMissedCount}/${missedQuizQuestions.length}` : 'Hoàn tất quiz để tạo tín hiệu mastery.'}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">Tín hiệu này chỉ phản ánh kết quả trong bài hiện tại, không thay đổi learning engine.</p><div className="mt-3 pt-3 border-t border-[#E86F51]/10"><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina next best action</p><p className="text-xs font-black text-[#211A17] dark:text-white mt-1">{masteryNextStep}</p><p className="text-[10px] text-[#716761] dark:text-[#A89E97] mt-1">{masteryNextReason}</p><button type="button" onClick={handleMasteryNextAction} className="chiu-btn chiu-btn-secondary inline-flex mt-2 min-h-[36px] px-3 py-1.5 rounded-lg text-[10px] font-black text-[#E86F51]" aria-label={`Lina: ${masteryNextAction}`}>{masteryNextAction} <ChevronRight size={13} /></button></div></div>
            </div>
            </div>
            <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Lina dùng các tín hiệu vừa hoàn tất để giữ mạch học: củng cố → phản xạ → ôn/tiến bước tiếp theo.</p>
          <div className="p-5 rounded-2xl bg-[#FFF5F1] dark:bg-[#2A2320] border-2 border-[#E86F51]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina đề xuất</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-1">Khóa bài bằng Speaking 60 giây</p><p className="text-[11px] font-bold text-[#E86F51] mt-2">{wrapUpComplete ? "Bạn đã hoàn tất vòng học — Lina có thể nối sang bước tiếp theo." : `Đã hoàn tất ${Object.values(completedWrapUpSteps).filter(Boolean).length}/3 checkpoint`}</p><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Không cần nói hoàn hảo — mục tiêu là dùng lại kiến thức vừa học.</p></div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button type="button" onClick={() => { if (onNavigateToSpeaking) onNavigateToSpeaking(lesson.title); else setIsLinaModalOpen(true); }} className="chiu-btn chiu-btn-primary min-h-[44px] px-5 text-xs flex items-center justify-center gap-2"><Mic size={15} />Luyện với Lina</button>
              {wrapUpComplete && learningLoopResult?.recommendations?.[0] && <button type="button" onClick={() => navigateToRecommendation()} className="chiu-btn chiu-btn-secondary min-h-[44px] px-4 text-xs flex items-center justify-center gap-2"><ChevronRight size={15} />Đi tiếp</button>}
            </div>
          </div>
        </div>}

        {currentSection.type === 'quiz' && <div className="space-y-6 animate-fade-in"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E86F51]/15"><div><span className="text-xs font-black uppercase tracking-wider text-[#E86F51]">Final Mission</span><h3 className="text-xl font-black text-[#211A17] dark:text-white mt-1">Kiểm tra vượt ải</h3><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Đạt ≥ {lesson.passingScore}% để hoàn thành bài.</p></div><span className={`text-sm font-black px-3.5 py-1.5 rounded-xl ${quizSubmitted ? (quizScore >= lesson.passingScore ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300') : 'bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]'}`}>{quizSubmitted ? `Điểm ${quizScore}%` : `${answeredQuizCount}/${quizQuestions.length}`}</span></div><div className="chiu-progress"><span style={{ width: `${quizQuestions.length ? (answeredQuizCount / quizQuestions.length) * 100 : 0}%` }} /></div><div className="space-y-5">{quizQuestions.map((q, qIdx) => { const userChoice = selectedAnswers[q.id]; return <div key={q.id} className="p-5 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] space-y-4"><div className="space-y-1"><span className="text-xs font-bold text-[#E86F51]">Câu {qIdx + 1}</span><h4 className="text-base font-bold text-[#211A17] dark:text-white">{q.question}</h4>{q.questionPinyin && <p className="text-xs text-[#716761] dark:text-[#A89E97]">{q.questionPinyin}</p>}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{q.options?.map((opt) => { const isSelected = userChoice === opt.id; let optStyle = 'border-gray-200 dark:border-gray-800 hover:border-[#E86F51]/50'; if (isSelected) optStyle = 'border-[#E86F51] bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]'; if (quizSubmitted) { if (opt.id === q.correctAnswer) optStyle = 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold'; else if (isSelected && opt.id !== q.correctAnswer) optStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'; } return <button key={opt.id} type="button" disabled={quizSubmitted} onClick={() => handleAnswerSelect(q.id, opt.id)} className={`min-h-[48px] p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${optStyle}`} aria-pressed={isSelected}><span>{opt.text}</span>{quizSubmitted && opt.id === q.correctAnswer && <Check size={16} className="text-green-600 shrink-0" />}{quizSubmitted && isSelected && opt.id !== q.correctAnswer && <X size={16} className="text-red-600 shrink-0" />}</button>; })}</div>{quizSubmitted && q.explanation && <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-[#2A2320] text-xs text-[#716761] dark:text-[#A89E97]"><strong className="text-[#E86F51]">Giải thích: </strong>{q.explanation}</div>}</div>; })}</div>{!quizSubmitted && <button type="button" disabled={answeredQuizCount !== quizQuestions.length || quizQuestions.length === 0} onClick={handleSubmitQuiz} className="chiu-btn chiu-btn-primary w-full sm:w-auto px-6 flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"><CheckCircle2 size={17} />Nộp bài & xem kết quả</button>}{quizSubmitted && <div className="p-5 rounded-2xl border border-[#E86F51]/15 bg-[#FFF9F4] dark:bg-[#2A2320] space-y-4"><div className="flex items-start gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quizScore >= lesson.passingScore ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{quizScore >= lesson.passingScore ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}</div><div><h4 className="font-black text-[#211A17] dark:text-white">{quizScore >= lesson.passingScore ? 'Hoàn thành Mission 🎉' : 'Kết quả đã được ghi nhận'}</h4><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{quizScore >= lesson.passingScore ? 'Bạn đã hoàn thành vòng học. Hãy chuyển sang Speaking hoặc xem Review để củng cố.' : 'Các câu trả lời đã được dùng để cập nhật từ vựng và ngữ pháp; hãy ôn lại bài để vượt qua.'}</p></div></div>{learningLoopResult && <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{[['Flashcards', learningLoopResult.flashcardsSaved], ['Kỹ năng', `+${learningLoopResult.skillDelta}`], ['Tiến độ HSK', `${learningLoopResult.levelCompletion.completionPercent}%`]].map(([label,value]) => <div key={label} className="p-3 rounded-xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10"><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{label}</p><p className="font-black text-[#E86F51]">{value}</p></div>)}</div>}{learningLoopResult?.recommendations?.[0] && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E86F51]/10"><div><p className="text-xs font-bold text-[#E86F51]">Bước tiếp theo</p><p className="text-sm font-black text-[#211A17] dark:text-white">{learningLoopResult.recommendations[0].title}</p></div><button type="button" onClick={() => navigateToRecommendation()} className="chiu-btn chiu-btn-primary px-4 text-xs">{learningLoopResult.recommendations[0].actionText}</button></div>}{quizSubmitted && <div className="rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] p-4 space-y-3"><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] flex items-center justify-center shrink-0"><Sparkles size={16} /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina Debrief · sau quiz</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-0.5">{quizScore >= lesson.passingScore ? 'Bạn đã vượt qua bài — giờ là lúc biến kiến thức thành phản xạ.' : 'Lina phát hiện một vài điểm cần củng cố trước khi bạn thử lại.'}</p></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">Đã làm đúng</p><p className="text-lg font-black text-[#65A873] mt-0.5">{quizCorrectCount}/{quizQuestions.length}</p></div><div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">Cần xem lại</p><p className="text-lg font-black text-[#E86F51] mt-0.5">{quizQuestions.length - quizCorrectCount}</p></div><div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/10"><p className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97]">Mục tiêu</p><p className="text-sm font-black text-[#211A17] dark:text-white mt-1">{lesson.passingScore}%+</p></div></div>{(() => { const missed = quizQuestions.filter((q) => { const answer = selectedAnswers[q.id]; return Array.isArray(q.correctAnswer) ? JSON.stringify(answer) !== JSON.stringify(q.correctAnswer) : answer !== q.correctAnswer; }).slice(0, 3); if (!missed.length) return <p className="text-xs text-[#716761] dark:text-[#A89E97]">Không có câu sai — hãy thử nói lại 1–2 câu trong phần Speaking để khóa phản xạ.</p>; return <div className="space-y-2"><p className="text-xs font-black text-[#211A17] dark:text-white">Lina chọn 3 điểm để ôn lại</p>{missed.map((q, index) => <div key={q.id} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40"><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold text-amber-900 dark:text-amber-200">#{index + 1} · {q.question}</p><button type="button" onClick={() => setReviewedQuizItems((current) => ({ ...current, [q.id]: !current[q.id] }))} className="chiu-btn chiu-btn-secondary min-h-[34px] px-2.5 text-[10px] shrink-0">{reviewedQuizItems[q.id] ? 'Đã ôn ✓' : 'Đánh dấu đã ôn'}</button></div>{q.explanation && <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">{q.explanation}</p>}<p className="text-[11px] text-[#716761] dark:text-[#A89E97] mt-1">Gợi ý: xem lại cấu trúc/từ vựng của câu này rồi thử nói một câu mới bằng chính mẫu vừa học.</p></div>)}</div>; })()}</div>}
{quizSubmitted && <div className="rounded-2xl border-2 border-[#E86F51]/15 bg-[#FFF5F1] dark:bg-[#2A2320] p-4 sm:p-5 space-y-4"><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-[#E86F51] text-white flex items-center justify-center shrink-0"><Sparkles size={16} /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Lina Checkpoint · 60 giây</p><h4 className="text-sm font-black text-[#211A17] dark:text-white mt-0.5">{quizScore >= lesson.passingScore ? 'Khóa kiến thức bằng một phản xạ ngắn' : 'Củng cố ngay điểm vừa sai'}</h4><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{quizScore >= lesson.passingScore ? 'Nói một câu dùng mẫu câu hoặc từ vựng vừa học, rồi chuyển sang Speaking nếu muốn luyện sâu hơn.' : 'Chọn một câu bạn vừa làm sai, tự nói lại theo cấu trúc đúng và kiểm tra lại trong bài.'}</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><button type="button" onClick={() => { if (onNavigateToSpeaking) onNavigateToSpeaking(lesson.title); else setIsLinaModalOpen(true); }} className="chiu-btn chiu-btn-primary min-h-[44px] px-4 text-xs flex items-center justify-center gap-2"><Mic size={15} />Thử ngay với Lina</button><button type="button" onClick={() => { const first = learningLoopResult?.recommendations?.[0]; if (first?.targetId === 'flashcards') { onNavigate?.('flashcards'); return; } if (first?.targetId?.startsWith('level:')) { onNavigate?.('learn', first.targetId); return; } if (first?.targetId) { onNavigate?.('learn-detail', first.targetId); return; } const grammarIndex = sections.findIndex((section) => section.type === 'grammar'); if (grammarIndex >= 0) goToSection(grammarIndex); }} className="chiu-btn chiu-btn-secondary min-h-[44px] px-4 text-xs flex items-center justify-center gap-2"><RotateCcw size={15} />Ôn lại trọng tâm</button></div></div>}
{quizPersistenceError && <p className="text-xs text-amber-700 dark:text-amber-300">{quizPersistenceError}</p>}
{quizSubmitted && <button type="button" onClick={() => { const summaryIndex = sections.findIndex((section) => section.type === 'summary'); if (summaryIndex >= 0) goToSection(summaryIndex); }} className="chiu-btn chiu-btn-primary w-full sm:w-auto min-h-[44px] px-5 text-xs flex items-center justify-center gap-2"><Sparkles size={15} />Tiếp tục với Lina Mastery <ChevronRight size={15} /></button>}</div>}</div>}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E86F51]/10"><button type="button" onClick={() => activeSectionIndex > 0 && goToSection(activeSectionIndex - 1)} disabled={activeSectionIndex === 0} className="chiu-btn chiu-btn-secondary px-4 text-xs flex items-center gap-1.5 disabled:opacity-35"><ChevronLeft size={15} />Trước</button><span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-[#A89E97]">{currentSection.title}</span>{!isLastSection ? <button type="button" onClick={() => goToSection(activeSectionIndex + 1)} className="chiu-btn chiu-btn-primary px-5 text-xs flex items-center gap-1.5">Bước tiếp theo <ChevronRight size={15} /></button> : <button type="button" onClick={onBack} className="chiu-btn chiu-btn-primary px-5 text-xs flex items-center gap-1.5"><CheckCircle2 size={15} />Về lộ trình</button>}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-2.5 bg-white/90 dark:bg-[#181412]/90 backdrop-blur-md border-t border-[#E86F51]/10 md:hidden" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}><div className="max-w-4xl mx-auto flex items-center gap-2"><button type="button" onClick={() => activeSectionIndex > 0 && goToSection(activeSectionIndex - 1)} disabled={activeSectionIndex === 0} className="chiu-btn chiu-btn-secondary flex-1 px-3 text-xs disabled:opacity-35"><ChevronLeft size={15} className="mx-auto" /></button>{currentSection.type === 'speaking' && onNavigateToSpeaking ? <button type="button" onClick={() => onNavigateToSpeaking(lesson.title)} className="chiu-btn chiu-btn-primary flex-[3] px-3 text-xs flex items-center justify-center gap-1.5"><Mic size={15} />Luyện với Lina</button> : !isLastSection ? <button type="button" onClick={() => goToSection(activeSectionIndex + 1)} className="chiu-btn chiu-btn-primary flex-[3] px-3 text-xs">Bước tiếp theo <ChevronRight size={15} /></button> : <button type="button" onClick={onBack} className="chiu-btn chiu-btn-primary flex-[3] px-3 text-xs">Hoàn thành <CheckCircle2 size={15} /></button>}</div></div>

      <LinaChatModal isOpen={isLinaModalOpen} onClose={() => setIsLinaModalOpen(false)} lessonContext={{ lessonTitle: lesson.title, level: `HSK ${lesson.levelNumber}`, vocabulary: vocabulary.map((item) => item.hanzi) }} />
    </div>
  );
};
