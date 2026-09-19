import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { HSK_TEST_QUESTIONS } from '../data/hskTestData';
import { AudioButton } from '../components/common/AudioButton';

export const HskTestPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (qId: string, optIdx: number) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [qId]: optIdx });
  };

  // Calculate score
  let correctCount = 0;
  HSK_TEST_QUESTIONS.forEach((q) => {
    if (answers[q.id] === q.correctIndex) {
      correctCount++;
    }
  });
  const scorePercent = Math.round((correctCount / HSK_TEST_QUESTIONS.length) * 100);

  const getRecommendedLevel = () => {
    if (scorePercent >= 85) return 'HSK 3';
    if (scorePercent >= 60) return 'HSK 2';
    return 'HSK 1';
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

      {/* Top Test Banner with Timer */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-white to-[#FFF5F1] dark:from-[#241F1C] dark:to-[#2B231F] border border-[#E86F51]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-xl bg-[#E86F51] text-white">
            HSK Diagnostic Test
          </span>
          <h1 className="text-2xl font-extrabold text-[#211A17] dark:text-white mt-1">
            Đề thi đánh giá năng lực Hán ngữ
          </h1>
          <p className="text-xs text-[#716761] dark:text-[#A89E97]">
            Bao gồm 8 câu hỏi chuẩn hóa: Nghe hiểu, Đọc hiểu, Từ vựng và Ngữ pháp
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/20 shadow-xs font-mono font-bold text-sm text-[#E86F51]">
          <Clock size={16} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Result Report Card when submitted */}
      {isSubmitted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border-2 border-[#E86F51]/30 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Award size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#211A17] dark:text-white">
              Kết quả đánh giá: {scorePercent}% ({correctCount}/{HSK_TEST_QUESTIONS.length} câu đúng)
            </h2>
            <p className="text-sm font-bold text-[#E86F51] mt-1">
              Trình độ đề xuất phù hợp nhất với bạn: {getRecommendedLevel()}
            </p>
          </div>
          <p className="text-xs text-[#716761] max-w-lg mx-auto">
            Dựa trên kết quả bài thi thử, chúng tôi khuyên bạn nên bắt đầu với các bài học thuộc cấp độ{' '}
            <strong>{getRecommendedLevel()}</strong> để củng cố nền tảng vững chắc nhất!
          </p>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {HSK_TEST_QUESTIONS.map((q, qIndex) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-lg bg-[#FFF0EB] text-[#E86F51]">
                  Câu {qIndex + 1} · {q.category} ({q.level})
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-chinese text-xl font-bold text-[#211A17] dark:text-white">
                  {q.question}
                </p>
                {q.pinyin && <p className="text-xs font-medium text-[#E86F51]">{q.pinyin}</p>}
                {q.audioPrompt && (
                  <div className="pt-1">
                    <AudioButton text={q.audioPrompt} size="sm" label="Nghe audio đề bài" />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {q.options.map((opt, optIdx) => {
                  const isOptSelected = selected === optIdx;
                  let style =
                    'bg-[#FFF9F4] dark:bg-[#181412] border-gray-200 dark:border-white/10 hover:border-[#E86F51]';

                  if (isSubmitted) {
                    if (optIdx === q.correctIndex) {
                      style = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 font-bold text-emerald-800 dark:text-emerald-200';
                    } else if (isOptSelected && !isCorrect) {
                      style = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200';
                    }
                  } else if (isOptSelected) {
                    style = 'bg-[#FFF0EB] border-[#E86F51] text-[#E86F51] font-bold ring-2 ring-[#E86F51]/20';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer flex items-center justify-between ${style}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && optIdx === q.correctIndex && (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      )}
                      {isSubmitted && isOptSelected && !isCorrect && (
                        <XCircle size={16} className="text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isSubmitted && (
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181412] text-xs text-[#716761] dark:text-[#A89E97] border border-gray-100 dark:border-white/5">
                  <span className="font-bold text-[#E86F51]">Giải thích: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsSubmitted(true)}
            className="px-8 py-3.5 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] transition-all cursor-pointer"
          >
            Nộp bài chấm điểm
          </button>
        </div>
      )}
    </div>
  );
};
