import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Award, ArrowLeft } from 'lucide-react';
import { HSK_TEST_QUESTIONS, HSK_LEVELS } from '../data/hskTestData';
import { AudioButton } from '../components/common/AudioButton';
import { flashcardService } from '../services/flashcardService';

export const HskTestPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [targetLevel, setTargetLevel] = useState<(typeof HSK_LEVELS)[number]>('HSK 3');
  const testQuestions = HSK_TEST_QUESTIONS.filter((q) => q.level === targetLevel);
  const targetIndex = HSK_LEVELS.indexOf(targetLevel);
  const [savedMistakes, setSavedMistakes] = useState(false);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setIsSubmitted(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  const handleSelect = (qId: string, optIdx: number) => {
    if (!isSubmitted) setAnswers({ ...answers, [qId]: optIdx });
  };
  const handleLevelChange = (level: (typeof HSK_LEVELS)[number]) => {
    setTargetLevel(level);
    setAnswers({});
    setIsSubmitted(false);
    setSavedMistakes(false);
    setTimeLeft(600);
  };

  let correctCount = 0;
  testQuestions.forEach((q) => { if (answers[q.id] === q.correctIndex) correctCount++; });
  const scorePercent = testQuestions.length ? Math.round((correctCount / testQuestions.length) * 100) : 0;
  const skillStats = (['listening','reading','vocabulary','grammar'] as const).map((skill) => {
    const items = testQuestions.filter(q => q.category === skill);
    const correct = items.filter(q => answers[q.id] === q.correctIndex).length;
    return { skill, correct, total: items.length, percent: items.length ? Math.round(correct/items.length*100) : 0 };
  });
  const getAdaptiveLevel = () =>
    scorePercent < 60 && targetIndex > 0
      ? HSK_LEVELS[targetIndex - 1]
      : scorePercent >= 85 && targetIndex < HSK_LEVELS.length - 1
        ? HSK_LEVELS[targetIndex + 1]
        : targetLevel;
  const adaptiveLevel = getAdaptiveLevel();

  const saveMistakesToReview = async () => {
    const mistakes = testQuestions.filter(q => answers[q.id] !== q.correctIndex);
    if (!mistakes.length) return;
    try {
      await flashcardService.upsertBatchFlashcards(mistakes.map(q => ({
        hanzi: q.audioPrompt || q.question,
        pinyin: q.pinyin || '',
        meaning: `HSK ${q.level.replace('HSK ', '')} · ${q.explanation}`,
        topic: `hsk-mistake:${q.category}`,
        hsk_level: Number(q.level.replace('HSK ', '')) || 1,
      })));
      setSavedMistakes(true);
    } catch { setSavedMistakes(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716761] hover:text-[#E86F51] transition-colors cursor-pointer"><ArrowLeft size={16}/><span>Quay lại danh mục công cụ</span></button>
      <div className="p-6 rounded-3xl bg-gradient-to-r from-white to-[#FFF5F1] dark:from-[#241F1C] dark:to-[#2B231F] border border-[#E86F51]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-xl bg-[#E86F51] text-white">HSK Diagnostic Test</span>
          <h1 className="text-2xl font-extrabold text-[#211A17] dark:text-white mt-1">Đề thi đánh giá năng lực Hán ngữ</h1>
          <p className="text-xs text-[#716761] dark:text-[#A89E97]">Bài test tự chọn theo đúng HSK mục tiêu, gồm Nghe, Đọc, Từ vựng và Ngữ pháp</p>
          <div className="flex flex-wrap gap-2 mt-3">{HSK_LEVELS.map(level => <button key={level} type="button" onClick={() => handleLevelChange(level)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${targetLevel===level ? 'bg-[#E86F51] text-white' : 'bg-white dark:bg-[#181412] border border-[#E86F51]/15 text-[#716761]'}`}>{level}</button>)}</div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/20 shadow-xs font-mono font-bold text-sm text-[#E86F51]"><Clock size={16}/><span>{formatTime(timeLeft)}</span></div>
      </div>

      {isSubmitted && <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border-2 border-[#E86F51]/30 shadow-xl text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><Award size={32}/></div>
        <div><h2 className="text-2xl font-extrabold text-[#211A17] dark:text-white">Kết quả đánh giá: {scorePercent}% ({correctCount}/{testQuestions.length} câu đúng)</h2><p className="text-sm font-bold text-[#E86F51] mt-1">Đề luyện thích ứng tiếp theo: {getRecommendedLevel()}</p></div>
        <p className="text-xs text-[#716761] max-w-lg mx-auto">
          Phân tích chẩn đoán theo kỹ năng sẽ giúp bạn chọn nội dung ôn tập tiếp theo. Bài vừa làm là <strong>{targetLevel}</strong>; bài kế tiếp được điều chỉnh dựa trên kết quả hiện tại.
        </p>
        {adaptiveLevel !== targetLevel && (
          <button
            type="button"
            onClick={() => { setTargetLevel(adaptiveLevel); setAnswers({}); setIsSubmitted(false); setSavedMistakes(false); setTimeLeft(600); }}
            className="px-5 py-2.5 rounded-xl bg-[#211A17] text-white text-xs font-bold hover:opacity-90"
          >
            Làm ngay {adaptiveLevel}
          </button>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">{skillStats.map(s => <div key={s.skill} className="p-3 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] text-left"><div className="text-[10px] uppercase font-bold text-[#716761]">{s.skill}</div><div className="text-lg font-extrabold text-[#E86F51]">{s.percent}%</div><div className="text-[10px] text-[#716761]">{s.correct}/{s.total} đúng</div></div>)}</div>
        <button type="button" onClick={saveMistakesToReview} disabled={savedMistakes} className={`px-5 py-2.5 rounded-xl text-xs font-bold ${savedMistakes ? 'bg-emerald-50 text-emerald-700' : 'bg-[#E86F51] text-white'}`}>{savedMistakes ? '✓ Đã đưa câu sai vào ôn tập' : 'Đưa câu sai vào ôn tập thông minh'}</button>
      </div>}

      <div className="space-y-4">{testQuestions.map((q, qIndex) => {
        const selected = answers[q.id]; const isCorrect = selected === q.correctIndex;
        return <div key={q.id} className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-lg bg-[#FFF0EB] text-[#E86F51]">Câu {qIndex + 1} · {q.category} ({q.level})</span></div>
          <div className="space-y-1"><p className="font-chinese text-xl font-bold text-[#211A17] dark:text-white">{q.question}</p>{q.pinyin && <p className="text-xs font-medium text-[#E86F51]">{q.pinyin}</p>}{q.audioPrompt && <div className="pt-1"><AudioButton text={q.audioPrompt} size="sm" label="Nghe audio đề bài" /></div>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">{q.options.map((opt, optIdx) => {
            const isOptSelected = selected === optIdx; let style='bg-[#FFF9F4] dark:bg-[#181412] border-gray-200 dark:border-white/10 hover:border-[#E86F51]';
            if (isSubmitted) { if (optIdx === q.correctIndex) style='bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 font-bold text-emerald-800 dark:text-emerald-200'; else if (isOptSelected && !isCorrect) style='bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200'; }
            else if (isOptSelected) style='bg-[#FFF0EB] border-[#E86F51] text-[#E86F51] font-bold ring-2 ring-[#E86F51]/20';
            return <button key={optIdx} type="button" onClick={() => handleSelect(q.id,optIdx)} className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer flex items-center justify-between ${style}`}><span>{opt}</span>{isSubmitted && optIdx===q.correctIndex && <CheckCircle2 size={16} className="text-emerald-600 shrink-0"/>}{isSubmitted && isOptSelected && !isCorrect && <XCircle size={16} className="text-rose-600 shrink-0"/>}</button>;
          })}</div>
          {isSubmitted && <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181412] text-xs text-[#716761] dark:text-[#A89E97] border border-gray-100 dark:border-white/5"><span className="font-bold text-[#E86F51]">Giải thích: </span>{q.explanation}</div>}
        </div>;
      })}</div>
      {!isSubmitted && <div className="flex justify-end pt-2"><button type="button" onClick={() => setIsSubmitted(true)} className="px-8 py-3.5 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] transition-all cursor-pointer">Nộp bài chấm điểm</button></div>}
    </div>
  );
};
