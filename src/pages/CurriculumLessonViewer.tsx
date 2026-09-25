import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Star,
  Check,
  X,
  Send,
} from 'lucide-react';
import { useLesson } from '../hooks/useCurriculum';
import { QuizAnswer, QuizAttempt, QuizQuestion, DialogueLine } from '../types/curriculum';
import { LinaChatModal } from '../components/LinaChatModal';
import { voiceService } from '../services/voiceService';

interface CurriculumLessonViewerProps {
  lessonId: string;
  onBack: () => void;
  onNavigateToSpeaking?: (topic: string) => void;
  onNavigate?: (route: string, param?: string) => void;
}

export const CurriculumLessonViewer: React.FC<CurriculumLessonViewerProps> = ({
  lessonId,
  onBack,
  onNavigateToSpeaking,
  onNavigate,
}) => {
  const {
    lesson,
    sections,
    vocabulary,
    grammar,
    quizQuestions,
    userProgress,
    isLoading,
    saveSectionProgress,
    completeQuiz,
  } = useLesson(lessonId);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isLinaModalOpen, setIsLinaModalOpen] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(null);
  const [learningLoopResult, setLearningLoopResult] = useState<Awaited<ReturnType<typeof completeQuiz>>>(null);
  const [quizPersistenceError, setQuizPersistenceError] = useState<string | null>(null);

  if (isLoading || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-[#E86F51] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">Đang tải nội dung bài học...</p>
      </div>
    );
  }

  const currentSection = sections[activeSectionIndex] || sections[0];
  const requiredSectionCount = sections.filter((section) => section.isRequired).length;
  const progressPercent = Math.round(
    ((sections.slice(0, activeSectionIndex + 1).filter((section) =>
      requiredSectionCount > 0 ? section.isRequired : true
    ).length) /
      Math.max(requiredSectionCount || sections.length, 1)) *
      100
  );

  const handleNextSection = () => {
    if (activeSectionIndex < sections.length - 1) {
      const nextIdx = activeSectionIndex + 1;
      setActiveSectionIndex(nextIdx);
      const completedThroughIndex = Math.max(0, nextIdx - 1);
      const completedRequiredCount = sections
        .slice(0, completedThroughIndex + 1)
        .filter((section) => (requiredSectionCount > 0 ? section.isRequired : true))
        .length;
      const completionPercent = Math.round(
        (completedRequiredCount / Math.max(requiredSectionCount || sections.length, 1)) * 100
      );
      if (completionPercent > 0) {
        saveSectionProgress(sections[completedThroughIndex].id, completionPercent);
      }
    }
  };

  const handlePrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  const playAudio = (text: string) => {
    voiceService.speakText(text);
  };

  // Quiz evaluation
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
      const correct = Array.isArray(q.correctAnswer)
        ? JSON.stringify(answer) === JSON.stringify(q.correctAnswer)
        : answer === q.correctAnswer;
      return {
        questionId: q.id,
        answer,
        isCorrect: correct,
        pointsEarned: correct ? q.points : 0,
      };
    });

    const totalPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const score = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : Math.round((correctCount / quizQuestions.length) * 100);

    const attempt: QuizAttempt = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `quiz-${lesson.id}-${Date.now()}`,
      userId: userProgress?.userId || 'guest_user',
      lessonId: lesson.id,
      score,
      totalPoints,
      earnedPoints,
      correctAnswers: correctCount,
      totalQuestions: quizQuestions.length,
      passed: score >= lesson.passingScore,
      answers,
      startedAt,
      completedAt,
    };

    setQuizScore(score);
    setQuizSubmitted(true);
    setQuizPersistenceError(null);

    try {
      const result = await completeQuiz(attempt);
      setLearningLoopResult(result);
    } catch (error) {
      console.error('Failed to persist quiz learning loop:', error);
      setQuizPersistenceError('Kết quả đã được chấm trên màn hình, nhưng chưa đồng bộ được tiến độ. Hãy thử lại sau.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E86F51]/15">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-[#716761] dark:text-[#A89E97] hover:text-[#E86F51] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Quay lại Lộ trình</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Ask Lina Floating Helper button */}
          <button
            type="button"
            onClick={() => setIsLinaModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold flex items-center gap-1.5 hover:bg-[#E86F51] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>Hỏi Lina về bài này</span>
          </button>
        </div>
      </div>

      {/* Lesson Title & Progress tracker */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-black uppercase text-[#E86F51] tracking-wider">
              HSK {lesson.levelNumber} · Bài {lesson.order}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white">
              {lesson.title} · <span className="text-[#E86F51]">{lesson.titleZh}</span>
            </h1>
          </div>
          <div className="text-xs font-bold text-[#716761] dark:text-[#A89E97] sm:text-right">
            Bước {activeSectionIndex + 1} / {sections.length} ({progressPercent}%)
          </div>
        </div>

        {/* Linear Step Indicator */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E86F51] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Section Tabs Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sections.map((sec, idx) => {
            const isActive = idx === activeSectionIndex;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  // Navigation alone does not mark a section complete.
                  // Completion is recorded only when the learner advances past it.
                  setActiveSectionIndex(idx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E86F51] text-white shadow-sm'
                    : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10 hover:border-[#E86F51]/40'
                }`}
              >
                {sec.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm min-h-[420px] flex flex-col justify-between space-y-6">
        {/* Intro / Objectives */}
        {currentSection.type === 'intro' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]">
                Tổng quan mục tiêu bài học
              </span>
              <h2 className="text-xl font-black text-[#211A17] dark:text-white">
                Chào mừng bạn đến với bài học: {lesson.title}
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                {lesson.description}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-[#2A2320] border border-[#E86F51]/20 space-y-3">
              <h3 className="text-sm font-bold text-[#211A17] dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#65A873]" />
                Bạn sẽ đạt được sau bài học này:
              </h3>
              <ul className="space-y-2 text-sm text-[#716761] dark:text-[#A89E97]">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E86F51] mt-2 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Vocabulary Section */}
        {currentSection.type === 'vocabulary' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                  Từ vựng trọng tâm HSK {lesson.levelNumber}
                </h3>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                  Nhấn vào biểu tượng loa để nghe phát âm chuẩn giọng Bắc Kinh.
                </p>
              </div>
              <span className="text-xs font-bold text-[#E86F51]">
                {vocabulary.length} từ mới
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vocabulary.map((vocab) => (
                <div
                  key={vocab.id}
                  className="p-4 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] hover:border-[#E86F51] transition-all flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#211A17] dark:text-white">
                          {vocab.hanzi}
                        </span>
                        <span className="text-sm font-medium text-[#E86F51]">
                          {vocab.pinyin}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#716761] dark:text-[#A89E97] mt-1">
                        {vocab.meaningVi}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => playAudio(vocab.hanzi)}
                      className="p-2 rounded-xl bg-orange-50 dark:bg-[#342822] text-[#E86F51] hover:bg-[#E86F51] hover:text-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {vocab.exampleSentence && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-[#716761] dark:text-[#A89E97]">
                      <p className="font-semibold text-[#211A17] dark:text-gray-200">
                        {vocab.exampleSentence}
                      </p>
                      <p className="text-[#E86F51]">{vocab.examplePinyin}</p>
                      <p className="italic">{vocab.exampleTranslation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grammar Section */}
        {currentSection.type === 'grammar' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black text-[#211A17] dark:text-white">
              Cấu trúc ngữ pháp trọng điểm
            </h3>

            <div className="space-y-4">
              {grammar.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl border border-[#E86F51]/20 bg-[#FFFDFB] dark:bg-[#1E1917] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#211A17] dark:text-white">
                      {g.title}
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                      {g.pattern}
                    </span>
                  </div>

                  <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                    {g.explanationVi}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2 pt-2 border-t border-[#E86F51]/10">
                    <span className="text-xs font-bold text-[#E86F51] uppercase tracking-wider">
                      Ví dụ minh họa:
                    </span>
                    {g.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#211A17] dark:text-white">
                            {ex.chinese}
                          </p>
                          <p className="text-[#E86F51]">{ex.pinyin}</p>
                          <p className="text-[#716761] dark:text-[#A89E97]">
                            {ex.translationVi}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => playAudio(ex.chinese)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#E86F51] cursor-pointer"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialogue Section */}
        {currentSection.type === 'dialogue' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                Hội thoại ngữ cảnh thực tế
              </h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Nghe và đọc theo cuộc đối thoại giữa Lina 老师 và học viên.
              </p>
            </div>

            <div className="space-y-3">
              {(currentSection.content?.lines || []).map((line: DialogueLine) => (
                <div
                  key={line.id}
                  className="p-4 rounded-2xl bg-[#FFFDFB] dark:bg-[#1E1917] border border-[#E86F51]/15 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#E86F51] uppercase">
                      {line.speaker}
                    </span>
                    <p className="text-lg font-bold text-[#211A17] dark:text-white">
                      {line.chinese}
                    </p>
                    <p className="text-xs font-semibold text-[#E86F51]">
                      {line.pinyin}
                    </p>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                      {line.translationVi}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => playAudio(line.chinese)}
                    className="p-2 rounded-xl bg-orange-50 dark:bg-[#342822] text-[#E86F51] hover:bg-[#E86F51] hover:text-white transition-all cursor-pointer shrink-0 mt-1"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speaking Practice Section */}
        {currentSection.type === 'speaking' && (
          <div className="space-y-6 animate-fade-in text-center py-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#E86F51] flex items-center justify-center mx-auto">
              <MessageSquare size={32} />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                Luyện nói cùng Lina AI
              </h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">
                Áp dụng ngay từ vựng và mẫu câu vừa học vào một phiên giao tiếp đàm thoại ngắn cùng gia sư AI Lina.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsLinaModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-[#E86F51] hover:bg-[#D35B3E] text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles size={16} />
                <span>Trò chuyện trực tiếp với Lina</span>
              </button>
              {onNavigateToSpeaking && (
                <button
                  type="button"
                  onClick={() => onNavigateToSpeaking(lesson.title)}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/30 text-sm font-bold text-[#E86F51] hover:bg-[#FFF0EB] cursor-pointer transition-all"
                >
                  Phòng Luyện Nói Chuyên Sâu
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {currentSection.type === 'quiz' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#E86F51]/15">
              <div>
                <h3 className="text-xl font-black text-[#211A17] dark:text-white">
                  Kiểm tra vượt ải (Vượt qua ≥ {lesson.passingScore}%)
                </h3>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                  Trả lời các câu hỏi trắc nghiệm và điền từ để mở khóa bài học kế tiếp.
                </p>
              </div>
              {quizSubmitted && (
                <span
                  className={`text-sm font-black px-3.5 py-1 rounded-xl ${
                    quizScore >= lesson.passingScore
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  Điểm số: {quizScore}%
                </span>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {quizQuestions.map((q, qIdx) => {
                const userChoice = selectedAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl border border-[#E86F51]/15 bg-white dark:bg-[#1E1917] space-y-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#E86F51]">
                        Câu {qIdx + 1}:
                      </span>
                      <h4 className="text-base font-bold text-[#211A17] dark:text-white">
                        {q.question}
                      </h4>
                      {q.questionPinyin && (
                        <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                          {q.questionPinyin}
                        </p>
                      )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options?.map((opt) => {
                        const isSelected = userChoice === opt.id;
                        let optStyle =
                          'border-gray-200 dark:border-gray-800 hover:border-[#E86F51]/50';

                        if (isSelected) {
                          optStyle = 'border-[#E86F51] bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]';
                        }
                        if (quizSubmitted) {
                          if (opt.id === q.correctAnswer) {
                            optStyle =
                              'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold';
                          } else if (isSelected && opt.id !== q.correctAnswer) {
                            optStyle =
                              'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
                          }
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => handleAnswerSelect(q.id, opt.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${optStyle}`}
                          >
                            <span>{opt.text}</span>
                            {quizSubmitted && opt.id === q.correctAnswer && (
                              <Check size={16} className="text-green-600 shrink-0" />
                            )}
                            {quizSubmitted && isSelected && opt.id !== q.correctAnswer && (
                              <X size={16} className="text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation if submitted */}
                    {quizSubmitted && q.explanation && (
                      <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-[#2A2320] text-xs text-[#716761] dark:text-[#A89E97]">
                        <strong className="text-[#E86F51]">Giải thích: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="p-5 rounded-2xl border border-[#E86F51]/15 bg-[#FFF9F4] dark:bg-[#2A2320] space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quizScore >= lesson.passingScore ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                    {quizScore >= lesson.passingScore ? <CheckCircle2 size={20} /> : <RotateCcw size={20} />}
                  </div>
                  <div>
                    <h4 className="font-black text-[#211A17] dark:text-white">
                      {quizScore >= lesson.passingScore ? 'Đã cập nhật vòng học tập' : 'Kết quả đã được ghi nhận'}
                    </h4>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">
                      {quizScore >= lesson.passingScore
                        ? 'Kết quả quiz đã cập nhật kỹ năng, từ vựng, flashcards và gợi ý học tiếp.'
                        : 'Các câu trả lời đã được dùng để cập nhật từ vựng và ngữ pháp; hãy ôn lại bài để vượt qua.'}
                    </p>
                  </div>
                </div>

                {learningLoopResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10">
                      <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Flashcards</p>
                      <p className="font-black text-[#E86F51]">{learningLoopResult.flashcardsSaved}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10">
                      <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Kỹ năng</p>
                      <p className="font-black text-[#E86F51]">+{learningLoopResult.skillDelta}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E1917] border border-[#E86F51]/10">
                      <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Tiến độ HSK</p>
                      <p className="font-black text-[#E86F51]">{learningLoopResult.levelCompletion.completionPercent}%</p>
                    </div>
                  </div>
                )}

                {learningLoopResult?.recommendations?.[0] && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E86F51]/10">
                    <div>
                      <p className="text-xs font-bold text-[#E86F51]">Bước tiếp theo</p>
                      <p className="text-sm font-black text-[#211A17] dark:text-white">
                        {learningLoopResult.recommendations[0].title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = learningLoopResult.recommendations[0];
                        if (next.targetId === 'flashcards') {
                          onNavigate?.('flashcards');
                          return;
                        }
                        if (next.targetId.startsWith('level:')) {
                          onNavigate?.('learn', next.targetId);
                          return;
                        }
                        // Grammar review is a level-level action, not a lesson id.
                        // Keep the learner inside the curriculum instead of opening
                        // a non-existent "grammar" lesson.
                        if (next.type === 'review_grammar' || next.targetId === 'grammar') {
                          onNavigate?.('learn', 'level:' + lesson.levelNumber);
                          return;
                        }
                        onNavigate?.('learn-detail', next.targetId);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#D35B3E] text-white text-xs font-bold transition-all"
                    >
                      {learningLoopResult.recommendations[0].actionText}
                    </button>
                  </div>
                )}

                {quizPersistenceError && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {quizPersistenceError}
                  </p>
                )}
              </div>
            )}

            {/* Quiz Action button */}
            <div className="pt-4 flex justify-end gap-3">
              {!quizSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                  className="px-6 py-3 rounded-2xl bg-[#E86F51] hover:bg-[#D35B3E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 transition-all cursor-pointer"
                >
                  Nộp bài và chấm điểm
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuizSubmitted(false);
                    setSelectedAnswers({});
                    setQuizScore(0);
                    setQuizStartedAt(null);
                    setLearningLoopResult(null);
                    setQuizPersistenceError(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl border border-[#E86F51] text-[#E86F51] text-xs font-bold hover:bg-[#FFF0EB] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Làm lại bài kiểm tra</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary Section */}
        {currentSection.type === 'summary' && (
          <div className="space-y-6 animate-fade-in text-center py-6">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 text-[#65A873] flex items-center justify-center mx-auto shadow-inner">
              <Award size={40} />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-2xl font-black text-[#211A17] dark:text-white">
                Chúc mừng bạn đã hoàn thành bài học!
              </h3>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                Bạn đã nắm vững từ vựng, ngữ pháp và đối thoại của bài <strong>{lesson.title}</strong>. Tiến độ đã được lưu vào hồ sơ cá nhân.
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-2xl bg-[#E86F51] hover:bg-[#D35B3E] text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 cursor-pointer transition-all flex items-center gap-2"
              >
                <span>Về trang Lộ trình bài học</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#E86F51]/15">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={activeSectionIndex === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#716761] dark:text-[#A89E97] hover:text-[#E86F51] disabled:opacity-40 disabled:hover:text-inherit transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Phần trước</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeSectionIndex >= sections.length - 1) {
                if (lesson.completionRule === 'all_required_sections') {
                  saveSectionProgress(sections[activeSectionIndex].id, 100);
                }
                return;
              }
              handleNextSection();
            }}
            disabled={
              activeSectionIndex >= sections.length - 1 &&
              lesson.completionRule !== 'all_required_sections'
            }
            className="px-5 py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#D35B3E] disabled:opacity-40 disabled:hover:bg-[#E86F51] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>{activeSectionIndex >= sections.length - 1 ? 'Hoàn thành bài học' : 'Phần tiếp theo'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lina AI Context-Aware Floating Chat Modal */}
      {isLinaModalOpen && (
        <LinaChatModal
          isOpen={isLinaModalOpen}
          onClose={() => setIsLinaModalOpen(false)}
          lessonContext={{
            lessonTitle: lesson.title,
            level: `HSK ${lesson.levelNumber}`,
            vocabulary: vocabulary.map((v) => `${v.hanzi} (${v.pinyin}): ${v.meaningVi}`),
          }}
        />
      )}
    </div>
  );
};
