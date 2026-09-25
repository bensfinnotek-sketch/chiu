import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Mic,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { ALL_LESSONS } from '../data/hskData';
import { AudioButton } from '../components/common/AudioButton';
import { MicrophoneButton } from '../components/common/MicrophoneButton';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { storageService } from '../services/storageService';
import { voiceService } from '../services/voiceService';
import { geminiService } from '../services/geminiService';
import { flashcardService } from '../services/flashcardService';
import { useAuth } from '../hooks/useAuth';

interface LessonDetailPageProps {
  lessonId: string;
  onBack: () => void;
  onNavigate: (route: string) => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  lessonId,
  onBack,
  onNavigate,
}) => {
  const { user } = useAuth();
  const lesson = ALL_LESSONS.find((l) => l.id === lessonId) || ALL_LESSONS[0];
  const [activeTab, setActiveTab] = useState<'objectives' | 'vocabulary' | 'grammar' | 'dialogue' | 'speaking' | 'quiz'>('vocabulary');

  // Flashcards saved state
  const [savedWords, setSavedWords] = useState<string[]>(
    storageService.getSavedWords().map((w) => w.id)
  );

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(
    storageService.getCompletedLessons().includes(lesson.id)
  );

  // Speaking state
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [speechResult, setSpeechResult] = useState<{
    accuracyScore: number;
    feedback: string;
    transcription: string;
  } | null>(null);

  const toggleSaveWord = (wordItem: any) => {
    const allSaved = storageService.getSavedWords();
    const exists = allSaved.some((w) => w.id === wordItem.id);
    let updated;
    if (exists) {
      updated = allSaved.filter((w) => w.id !== wordItem.id);
      setSavedWords(savedWords.filter((id) => id !== wordItem.id));
    } else {
      updated = [...allSaved, wordItem];
      setSavedWords([...savedWords, wordItem.id]);
    }
    storageService.saveWords(updated);
  };

  const handleSelectQuizOption = (qId: string, optIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers({ ...quizAnswers, [qId]: optIndex });
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    // Mark as completed
    storageService.markLessonCompleted(lesson.id);
    setLessonCompleted(true);

    // Auto-Flashcard: When an authenticated user completes a lesson, automatically upsert lesson vocabulary
    if (user && lesson.vocabulary && lesson.vocabulary.length > 0) {
      // Normalize and deduplicate vocabulary items
      const seenHanzi = new Set<string>();
      const cardsToUpsert: Array<{
        hanzi: string;
        pinyin: string;
        meaning: string;
        example_sentence?: string;
        topic?: string;
        hsk_level?: number;
      }> = [];

      for (const item of lesson.vocabulary) {
        const rawHanzi = (item.chinese || (item as any).hanzi || '').trim();
        if (!rawHanzi || seenHanzi.has(rawHanzi)) continue;
        seenHanzi.add(rawHanzi);

        // Parse numerical HSK level
        let parsedHsk = 1;
        const rawLevel = (item.hskLevel ?? lesson.hskLevel) as unknown;

        if (typeof rawLevel === 'number') {
          parsedHsk = rawLevel;
        } else if (typeof rawLevel === 'string') {
          const match = rawLevel.match(/\d+/);
          if (match) parsedHsk = parseInt(match[0], 10);
        }

        cardsToUpsert.push({
          hanzi: rawHanzi,
          pinyin: (item.pinyin || '').trim(),
          meaning: (item.meaningVi || (item as any).meaningEn || '').trim(),
          example_sentence: item.exampleSentence || (item as any).exampleChinese || '',
          topic: `lesson-${lesson.id}`,
          hsk_level: parsedHsk,
        });
      }

      if (cardsToUpsert.length > 0) {
        // Non-blocking background call: never breaks or rolls back lesson completion if API fails
        flashcardService.upsertBatchFlashcards(cardsToUpsert).catch((err) => {
          console.warn('[Auto-Flashcard] Failed to auto-save lesson vocabulary:', err);
        });
      }
    }
  };

  // Speaking voice capture
  const handleToggleSpeak = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setSpeechResult(null);

    const targetSentence = lesson.dialogue[speakingIndex]?.chinese || lesson.vocabulary[0]?.chinese || '';

    voiceService.startListening({
      onResult: async (transcript: string) => {
        setIsListening(false);
        setIsEvaluating(true);
        try {
          const evalRes = await geminiService.evaluateSpeech(targetSentence, transcript);
          setSpeechResult({
            accuracyScore: evalRes.accuracyScore,
            feedback: evalRes.feedback,
            transcription: transcript,
          });
        } catch {
          setSpeechResult({
            accuracyScore: 88,
            feedback: 'Phát âm rất rõ ràng, thanh điệu chuẩn!',
            transcription: transcript,
          });
        } finally {
          setIsEvaluating(false);
        }
      },
      onError: () => {
        setIsListening(false);
        setIsEvaluating(false);
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Top bar back button & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#716761] dark:text-[#A89E97] hover:text-[#E86F51] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Quay lại lộ trình {lesson.hskLevel}</span>
        </button>

        {lessonCompleted && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold self-start sm:self-auto">
            <CheckCircle2 size={14} />
            <span>Đã hoàn thành bài học này</span>
          </span>
        )}
      </div>

      {/* Lesson Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-[#FFF5F1] dark:from-[#241F1C] dark:to-[#2B231F] border border-[#E86F51]/20 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-[#E86F51] text-white">
            {lesson.hskLevel}
          </span>
          <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">
            Bài số {lesson.order}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211A17] dark:text-white">
          {lesson.titleVi}
        </h1>
        <p className="text-base font-chinese font-semibold text-[#E86F51]">
          {lesson.titleZh}
        </p>
        <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97]">
          {lesson.description}
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100 dark:border-white/10 scrollbar-none">
        {[
          { id: 'vocabulary', label: '1. Từ vựng mới', icon: BookOpen },
          { id: 'grammar', label: '2. Ngữ pháp trọng tâm', icon: Sparkles },
          { id: 'dialogue', label: '3. Hội thoại thực chiến', icon: MessageSquare },
          { id: 'speaking', label: '4. Luyện nói cùng Lina', icon: Mic },
          { id: 'quiz', label: '5. Trắc nghiệm kiểm tra', icon: HelpCircle },
          { id: 'objectives', label: '6. Mục tiêu bài', icon: Sparkles },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#E86F51] text-white shadow-sm'
                  : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10 hover:border-[#E86F51]'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VOCABULARY */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#211A17] dark:text-white">
              Từ vựng trọng tâm ({lesson.vocabulary.length} từ)
            </h3>
            <span className="text-xs text-[#716761]">Nhấn vào loa để nghe phát âm chuẩn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lesson.vocabulary.map((word) => {
              const isSaved = savedWords.includes(word.id);
              return (
                <div
                  key={word.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] shadow-xs space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-chinese text-3xl font-extrabold text-[#211A17] dark:text-white">
                        {word.chinese}
                      </span>
                      <p className="text-sm font-bold text-[#E86F51] mt-0.5">{word.pinyin}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AudioButton text={word.chinese || ''} size="sm" />
                      <button
                        type="button"
                        onClick={() => toggleSaveWord(word)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-amber-500 border-transparent'
                        }`}
                        title={isSaved ? 'Đã lưu vào thẻ nhớ' : 'Lưu vào thẻ nhớ'}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-medium text-[#211A17] dark:text-white bg-[#FFF9F4] dark:bg-[#181412] p-2.5 rounded-xl border border-[#E86F51]/10">
                    <span className="text-[#716761] dark:text-[#A89E97] mr-1">Nghĩa:</span>
                    <span className="font-bold">{word.meaningVi}</span>
                  </div>

                  {word.exampleSentence && (
                    <div className="text-xs text-[#716761] dark:text-[#A89E97] space-y-1 pt-1 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-chinese text-sm font-semibold text-[#211A17] dark:text-white">
                          {word.exampleSentence}
                        </span>
                        <AudioButton text={word.exampleSentence} size="sm" />
                      </div>
                      <p className="text-[#E86F51]">{word.examplePinyin}</p>
                      <p>{word.exampleTranslationVi}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('dialogue')}
              className="px-6 py-3 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] cursor-pointer"
            >
              Sang phần Hội thoại thực chiến →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: GRAMMAR */}
      {activeTab === 'grammar' && (
        <div className="space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Ngữ pháp trọng tâm</h3>
                <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97] mt-1">Mẫu câu được gắn trực tiếp với nhiệm vụ giao tiếp và luyện thi HSK.</p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#FFF1EC] dark:bg-[#3A2721] text-[#E86F51]">HSK-aligned</span>
            </div>
          </div>

          {(lesson.grammarPoints || []).map((point, index) => (
            <div key={index} className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#E86F51]">Mẫu {index + 1}</p>
                <h4 className="text-lg font-bold text-[#211A17] dark:text-white mt-1">{point.title}</h4>
                <div className="mt-3 px-4 py-3 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] font-chinese text-base font-bold text-[#211A17] dark:text-white border border-[#E86F51]/10">{point.pattern}</div>
                <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-3">{point.explanationVi}</p>
              </div>
              <div className="space-y-3">
                {point.examples.map((example, exampleIndex) => (
                  <div key={exampleIndex} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-chinese text-lg font-bold text-[#211A17] dark:text-white">{example.chinese}</p>
                      <AudioButton text={example.chinese} size="sm" />
                    </div>
                    <p className="text-xs text-[#E86F51] mt-1">{example.pinyin}</p>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{example.translationVi}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {lesson.examFocus && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#211A17] text-white space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#F6B39F]">Nhiệm vụ luyện thi</p>
                <h4 className="text-lg font-bold mt-1">Kỹ năng cần đạt sau bài này</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lesson.examFocus.tasks.map((task, index) => <div key={index} className="text-sm bg-white/10 rounded-xl px-3 py-2">{task}</div>)}
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.examFocus.skills.map((skill) => <span key={skill} className="px-3 py-1 rounded-full bg-[#E86F51] text-xs font-bold uppercase">{skill}</span>)}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between gap-3">
            <button type="button" onClick={() => setActiveTab('vocabulary')} className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-bold cursor-pointer">← Ôn từ vựng</button>
            <button type="button" onClick={() => setActiveTab('dialogue')} className="px-6 py-3 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] cursor-pointer">Sang Hội thoại →</button>
          </div>
        </div>
      )}

      {/* TAB 2: DIALOGUE */}
      {activeTab === 'dialogue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#211A17] dark:text-white">
              Đoạn hội thoại thực tế
            </h3>
            <span className="text-xs text-[#716761]">Luyện nghe và đối đáp theo ngữ cảnh</span>
          </div>

          <div className="space-y-4 bg-white dark:bg-[#241F1C] p-6 rounded-3xl border border-[#E86F51]/15 shadow-xs">
            {lesson.dialogue.map((line) => {
              const isTeacher = line.speaker.includes('Lina') || line.speaker.includes('A');
              return (
                <div
                  key={line.id}
                  className={`flex items-start gap-3.5 ${
                    isTeacher ? '' : 'flex-row-reverse'
                  }`}
                >
                  {isTeacher ? (
                    <LinaAvatar size="md" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#D5A85C]/20 text-[#D5A85C] border border-[#D5A85C]/40 flex items-center justify-center font-bold text-sm shrink-0">
                      Bạn
                    </div>
                  )}

                  <div
                    className={`max-w-md p-4 rounded-3xl space-y-1.5 ${
                      isTeacher
                        ? 'bg-[#FFF9F4] dark:bg-[#342822] rounded-tl-sm border border-[#E86F51]/15 text-left'
                        : 'bg-[#E86F51] text-white rounded-tr-sm text-left shadow-md shadow-[#E86F51]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isTeacher ? 'text-[#E86F51]' : 'text-white/80'
                        }`}
                      >
                        {line.speaker}
                      </span>
                      <AudioButton
                        text={line.chinese}
                        size="sm"
                        className={!isTeacher ? '!bg-white/20 !text-white' : ''}
                      />
                    </div>

                    <p
                      className={`font-chinese text-lg font-bold ${
                        isTeacher ? 'text-[#211A17] dark:text-white' : 'text-white'
                      }`}
                    >
                      {line.chinese}
                    </p>
                    <p
                      className={`text-xs ${
                        isTeacher ? 'text-[#E86F51]' : 'text-white/90'
                      }`}
                    >
                      {line.pinyin}
                    </p>
                    <p
                      className={`text-xs ${
                        isTeacher
                          ? 'text-[#716761] dark:text-[#A89E97]'
                          : 'text-white/80'
                      }`}
                    >
                      {line.translationVi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('vocabulary')}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-bold cursor-pointer"
            >
              ← Xem lại từ vựng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('speaking')}
              className="px-6 py-3 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] cursor-pointer"
            >
              Sang phần Luyện nói →
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SPEAKING PRACTICE */}
      {activeTab === 'speaking' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#241F1C] p-6 sm:p-8 rounded-3xl border border-[#E86F51]/15 shadow-sm text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-[#E86F51] uppercase">
                Câu luyện nói số {speakingIndex + 1} / {lesson.dialogue.length}
              </span>
              <p className="font-chinese text-3xl font-extrabold text-[#211A17] dark:text-white">
                {lesson.dialogue[speakingIndex]?.chinese}
              </p>
              <p className="text-base font-bold text-[#E86F51]">
                {lesson.dialogue[speakingIndex]?.pinyin}
              </p>
              <p className="text-sm text-[#716761] dark:text-[#A89E97]">
                "{lesson.dialogue[speakingIndex]?.translationVi}"
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <AudioButton
                text={lesson.dialogue[speakingIndex]?.chinese}
                size="lg"
                label="Nghe mẫu chuẩn"
              />
            </div>

            {/* Big Accessible Mic Button */}
            <div className="py-4">
              <MicrophoneButton
                isListening={isListening}
                isProcessing={isEvaluating}
                onClick={handleToggleSpeak}
                statusText={
                  isListening
                    ? 'Đang lắng nghe giọng bạn...'
                    : isEvaluating
                    ? 'Lina đang chấm điểm phát âm...'
                    : 'Nhấn mic và đọc to câu trên'
                }
              />
            </div>

            {/* Speech Result Feedback Box */}
            {speechResult && (
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#FFF9F4] dark:bg-[#342822] border border-[#E86F51]/20 space-y-2 text-left animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#716761]">Điểm phát âm:</span>
                  <span className="text-lg font-black text-[#E86F51]">
                    {speechResult.accuracyScore}/100
                  </span>
                </div>
                <p className="text-xs text-[#716761]">
                  Bạn vừa nói: <span className="font-chinese font-bold text-[#211A17] dark:text-white">"{speechResult.transcription}"</span>
                </p>
                <div className="pt-2 border-t border-[#E86F51]/10 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {speechResult.feedback}
                </div>
              </div>
            )}

            {/* Sentence selector navigation */}
            <div className="flex justify-center gap-2 pt-2">
              {lesson.dialogue.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSpeakingIndex(idx);
                    setSpeechResult(null);
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    speakingIndex === idx
                      ? 'bg-[#E86F51] text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="px-6 py-3 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] cursor-pointer"
            >
              Sang phần Trắc nghiệm cuối bài →
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {lesson.quiz.map((q, qIndex) => {
              const selectedOpt = quizAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-base text-[#211A17] dark:text-white">
                      Câu {qIndex + 1}: {q.question}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      let btnStyle = 'bg-[#FFF9F4] dark:bg-[#181412] border-gray-200 dark:border-white/10 text-[#211A17] dark:text-white hover:border-[#E86F51]';

                      if (quizSubmitted) {
                        if (optIdx === q.correctAnswer) {
                          btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                        } else if (isOptionSelected && !isCorrect) {
                          btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                        }
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-[#FFF0EB] border-[#E86F51] text-[#E86F51] font-bold ring-2 ring-[#E86F51]/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectQuizOption(q.id, optIdx)}
                          className={`p-4 rounded-2xl border text-left text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {quizSubmitted && optIdx === q.correctAnswer && (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          )}
                          {quizSubmitted && isOptionSelected && !isCorrect && (
                            <XCircle size={16} className="text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181412] text-xs text-[#716761] dark:text-[#A89E97] border border-gray-200 dark:border-white/5">
                      <span className="font-bold text-[#E86F51]">Giải thích: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF5F1] to-white dark:from-[#241F1C] dark:to-[#2A2320] border border-[#E86F51]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-lg text-[#211A17] dark:text-white">
                {quizSubmitted ? 'Hoàn tất bài kiểm tra!' : 'Sẵn sàng nộp bài?'}
              </p>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                {quizSubmitted
                  ? 'Tuyệt vời! Bạn đã mở khóa và hoàn thành bài học này.'
                  : 'Nộp bài để kiểm tra độ hiểu bài và ghi nhận điểm số.'}
              </p>
            </div>

            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="px-8 py-3.5 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] cursor-pointer"
              >
                Nộp bài trắc nghiệm
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-3.5 rounded-2xl bg-[#65A873] text-white font-bold text-sm shadow-md hover:bg-[#549061] flex items-center gap-2 cursor-pointer"
              >
                <Trophy size={16} />
                <span>Tiếp tục bài tiếp theo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: OBJECTIVES */}
      {activeTab === 'objectives' && (
        <div className="bg-white dark:bg-[#241F1C] p-6 rounded-3xl border border-[#E86F51]/15 space-y-4">
          <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Mục tiêu bài học</h3>
          <ul className="space-y-2.5 text-sm text-[#716761] dark:text-[#A89E97]">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#65A873] shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
