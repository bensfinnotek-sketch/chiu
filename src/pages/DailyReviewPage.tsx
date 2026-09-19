import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  Volume2,
  Mic,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { AudioButton } from '../components/common/AudioButton';
import { MicrophoneButton } from '../components/common/MicrophoneButton';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { voiceService } from '../services/voiceService';

export const DailyReviewPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  const reviewItems = [
    {
      type: 'vocab',
      title: 'Nhớ lại nghĩa của từ',
      chinese: '谢谢',
      pinyin: 'xièxie',
      question: '"谢谢" có nghĩa là gì?',
      options: ['Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Không có chi'],
      correct: 1,
    },
    {
      type: 'listening',
      title: 'Luyện nghe phản xạ',
      chinese: '我不喝咖啡，我想喝茶。',
      pinyin: 'Wǒ bù hē kāfēi, wǒ xiǎng hē chá.',
      question: 'Người nói muốn uống gì?',
      options: ['Cà phê', 'Trà', 'Nước ngọt', 'Bia'],
      correct: 1,
    },
    {
      type: 'vocab',
      title: 'Chọn phiên âm đúng',
      chinese: '中国',
      question: 'Phiên âm của từ "中国" (Trung Quốc) là gì?',
      options: ['zhōng guó', 'zhōng wén', 'běi jīng', 'shàng hǎi'],
      correct: 0,
    },
    {
      type: 'speaking',
      title: 'Luyện nói câu giao tiếp',
      chinese: '明天见！',
      pinyin: 'Míngtiān jiàn!',
      translationVi: 'Ngày mai gặp lại nhé!',
      options: [],
      correct: 0,
    },
  ];

  const current = reviewItems[step];

  const handleSelectOption = (idx: number) => {
    if (idx === current.correct) {
      setScore((s) => s + 25);
    }
    advanceStep();
  };

  const advanceStep = () => {
    if (step < reviewItems.length - 1) {
      setStep(step + 1);
      setSpokenText('');
    } else {
      setIsDone(true);
    }
  };

  const handleSpeak = () => {
    if (micActive) {
      voiceService.stopListening();
      setMicActive(false);
      return;
    }
    setMicActive(true);
    voiceService.startListening({
      onResult: (transcript: string) => {
        setMicActive(false);
        setSpokenText(transcript);
        setScore((s) => s + 25);
        setTimeout(() => advanceStep(), 1200);
      },
      onError: () => {
        setMicActive(false);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-[#E86F51] text-xs font-bold inline-flex items-center gap-1.5">
          <RotateCcw size={14} />
          <span>Ôn tập 10 phút hàng ngày</span>
        </span>
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Duy trì phản xạ ngôn ngữ
        </h1>
      </div>

      {!isDone ? (
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-xl space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97]">
              <span>Câu hỏi {step + 1} / {reviewItems.length}</span>
              <span className="text-[#E86F51]">{score} điểm</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E86F51] transition-all duration-300"
                style={{ width: `${((step + 1) / reviewItems.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-center space-y-3 py-2">
            <span className="text-xs font-bold text-[#E86F51] uppercase">{current.title}</span>
            <p className="font-chinese text-4xl sm:text-5xl font-black text-[#211A17] dark:text-white">
              {current.chinese}
            </p>
            {current.pinyin && (
              <p className="text-sm font-bold text-[#E86F51]">{current.pinyin}</p>
            )}
            <div className="flex justify-center">
              <AudioButton text={current.chinese} size="md" />
            </div>
            {current.question && (
              <p className="text-base font-bold text-[#211A17] dark:text-white pt-2">
                {current.question}
              </p>
            )}
          </div>

          {current.type !== 'speaking' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectOption(i)}
                  className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/15 text-sm font-bold text-[#211A17] dark:text-white hover:border-[#E86F51] hover:bg-[#FFF0EB] transition-all cursor-pointer text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <p className="text-xs text-[#716761]">
                Nghĩa: "{current.translationVi}"
              </p>
              <MicrophoneButton
                isListening={micActive}
                onClick={handleSpeak}
                statusText={micActive ? 'Đang nghe... hãy đọc câu trên' : 'Nhấn mic để nói'}
              />
              {spokenText && (
                <p className="text-xs text-emerald-600 font-bold animate-fade-in">
                  Bạn đã đọc: "{spokenText}" ✓
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-8 sm:p-10 border border-[#E86F51]/20 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#65A873] flex items-center justify-center mx-auto">
            <Trophy size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#211A17] dark:text-white">
              Xuất sắc! Hoàn thành ôn tập hôm nay
            </h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97]">
              Bạn đã đạt <span className="font-bold text-[#E86F51]">{score} / 100 điểm</span> và duy trì chuỗi Streak 7 ngày thành công!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412] border border-[#E86F51]/15 flex items-center gap-3 text-left">
            <LinaAvatar size="md" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-[#211A17] dark:text-white">Lời khen từ Lina:</p>
              <p className="text-[#716761] dark:text-[#A89E97]">
                "Tiến bộ rất rõ rệt qua từng ngày! Hãy giữ thói quen luyện tập 10 phút này nhé."
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="w-full py-4 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] transition-all cursor-pointer"
          >
            Quay lại trang chính
          </button>
        </div>
      )}
    </div>
  );
};
