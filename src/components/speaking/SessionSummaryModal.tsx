import React from 'react';
import { Award, Clock, MessageSquare, BookOpen, CheckCircle, RotateCcw, Home, Sparkles, Star, Target, Lightbulb } from 'lucide-react';
import { AudioButton } from '../common/AudioButton';
import { LinaAvatar } from '../common/LinaAvatar';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPracticeAgain: () => void;
  onGoHome: () => void;
  stats: {
    durationMinutes: number;
    turnsCount: number;
    wordsLearned: Array<{ hanzi: string; pinyin: string; meaning: string }>;
    correctionsCount: number;
    topic: string;
    level: string;
    scores?: {
      clarity: number;
      grammar: number;
      vocabulary: number;
      naturalness: number;
    };
  };
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  onPracticeAgain,
  onGoHome,
  stats,
}) => {
  if (!isOpen) return null;

  const defaultScores = stats.scores || {
    clarity: 5,
    grammar: 4,
    vocabulary: 5,
    naturalness: 4,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" role="presentation">
      <div
        className="bg-[#FFF9F4] dark:bg-[#1E1916] text-[#211A17] dark:text-[#F7F2EE] w-full max-w-lg rounded-3xl shadow-2xl border border-[#F0E4D8] dark:border-[#382E28] overflow-hidden flex flex-col max-h-[min(90vh,720px)] md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lina-session-summary-title"
      >
        {/* Top Celebration Header */}
        <div className="bg-gradient-to-br from-[#E86F51] to-[#F5A28E] text-white p-6 sm:p-7 text-center relative overflow-hidden shrink-0">
          <div className="relative z-10 flex flex-col items-center">
            <LinaAvatar size="lg" className="border-4 border-white shadow-xl mb-3" />
            <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-1">
              {stats.topic} • {stats.level}
            </span>
            <h2 id="lina-session-summary-title" className="text-2xl sm:text-3xl font-bold tracking-tight">Buổi luyện nói tuyệt vời! 🎉</h2>
            <p className="text-white/90 text-sm mt-1 max-w-sm">
              Bạn đã hoàn thành phiên giao tiếp tiếng Trung trực tiếp cùng cô Lina.
            </p>
          </div>
        </div>

        {/* Scrollable Summary Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 chiu-content-auto" aria-label="Nội dung tóm tắt buổi luyện nói">
          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-[#28201B] p-3 rounded-2xl border border-[#EFE5DB] dark:border-[#3A2F28] text-center shadow-xs">
              <Clock className="w-5 h-5 text-[#E86F51] mx-auto mb-1 opacity-80" />
              <p className="text-xl font-bold text-[#211A17] dark:text-white">
                {Math.max(1, Math.round(stats.durationMinutes))}
                <span className="text-xs font-normal text-[#716761] dark:text-[#A89E97]"> phút</span>
              </p>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Thời lượng</p>
            </div>

            <div className="bg-white dark:bg-[#28201B] p-3 rounded-2xl border border-[#EFE5DB] dark:border-[#3A2F28] text-center shadow-xs">
              <MessageSquare className="w-5 h-5 text-[#D5A85C] mx-auto mb-1 opacity-80" />
              <p className="text-xl font-bold text-[#211A17] dark:text-white">
                {stats.turnsCount}
                <span className="text-xs font-normal text-[#716761] dark:text-[#A89E97]"> lượt</span>
              </p>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Lượt hội thoại</p>
            </div>

            <div className="bg-white dark:bg-[#28201B] p-3 rounded-2xl border border-[#EFE5DB] dark:border-[#3A2F28] text-center shadow-xs">
              <BookOpen className="w-5 h-5 text-[#65A873] mx-auto mb-1 opacity-80" />
              <p className="text-xl font-bold text-[#211A17] dark:text-white">
                {stats.wordsLearned.length}
                <span className="text-xs font-normal text-[#716761] dark:text-[#A89E97]"> từ</span>
              </p>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Từ vựng ghi nhận</p>
            </div>

            <div className="bg-white dark:bg-[#28201B] p-3 rounded-2xl border border-[#EFE5DB] dark:border-[#3A2F28] text-center shadow-xs">
              <CheckCircle className="w-5 h-5 text-[#4E88C7] mx-auto mb-1 opacity-80" />
              <p className="text-xl font-bold text-[#211A17] dark:text-white">
                {stats.correctionsCount}
                <span className="text-xs font-normal text-[#716761] dark:text-[#A89E97]"> điểm</span>
              </p>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Góp ý tự nhiên</p>
            </div>
          </div>

          {/* Honest Language Evaluation Scores */}
          <section className="bg-white dark:bg-[#28201B] p-4 rounded-2xl border border-[#EFE5DB] dark:border-[#3A2F28] space-y-3" aria-labelledby="language-expression-title">
            <div className="flex items-center justify-between">
              <h4 id="language-expression-title" className="text-xs font-bold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#E86F51]" />
                Đánh giá năng lực diễn đạt (Language Expression)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#716761] dark:text-[#A89E97]">Độ rõ ràng (Clarity)</span>
                  <span className="font-bold text-[#E86F51]">{defaultScores.clarity}/5</span>
                </div>
                <div className="flex gap-1" role="progressbar" aria-label="Clarity độ rõ ràng" aria-valuemin={0} aria-valuemax={5} aria-valuenow={defaultScores.clarity}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= defaultScores.clarity ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#716761] dark:text-[#A89E97]">Ngữ pháp (Grammar)</span>
                  <span className="font-bold text-[#E86F51]">{defaultScores.grammar}/5</span>
                </div>
                <div className="flex gap-1" role="progressbar" aria-label="Grammar ngữ pháp" aria-valuemin={0} aria-valuemax={5} aria-valuenow={defaultScores.grammar}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= defaultScores.grammar ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#716761] dark:text-[#A89E97]">Từ vựng (Vocabulary)</span>
                  <span className="font-bold text-[#E86F51]">{defaultScores.vocabulary}/5</span>
                </div>
                <div className="flex gap-1" role="progressbar" aria-label="Vocabulary từ vựng" aria-valuemin={0} aria-valuemax={5} aria-valuenow={defaultScores.vocabulary}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= defaultScores.vocabulary ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#716761] dark:text-[#A89E97]">Độ tự nhiên (Naturalness)</span>
                  <span className="font-bold text-[#E86F51]">{defaultScores.naturalness}/5</span>
                </div>
                <div className="flex gap-1" role="progressbar" aria-label="Naturalness độ tự nhiên" aria-valuemin={0} aria-valuemax={5} aria-valuenow={defaultScores.naturalness}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= defaultScores.naturalness ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#716761] dark:text-[#A89E97] italic pt-1 border-t border-[#F0E4D8] dark:border-[#382E28]">
              * Đánh giá trung thực dựa trên ngữ cảnh từ vựng và cấu trúc câu người học giao tiếp.
            </p>
          </section>

          {/* Lina Coach — session takeaway built from the existing speaking session signals */}
          <div className="rounded-2xl border border-[#F0D8CC] dark:border-[#4A352C] bg-gradient-to-br from-[#FFF4EE] to-white dark:from-[#2C211C] dark:to-[#28201B] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center shrink-0"><LinaAvatar size="sm" /></div>
              <div className="min-w-0"><div className="flex items-center gap-2"><h4 className="text-sm font-bold">Lina Coach</h4><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">Tóm tắt buổi học</span></div><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-0.5">Một bước nhỏ để biến cuộc trò chuyện vừa rồi thành tiến bộ cho lần luyện tiếp theo.</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-white/80 dark:bg-[#211A17]/60 border border-[#EFE1D8] dark:border-[#3A2E27] p-3"><div className="flex items-center gap-2 mb-1.5"><Star size={14} className="text-[#D5A85C]" /><span className="text-xs font-semibold">Điểm mạnh hôm nay</span></div><p className="text-xs leading-relaxed text-[#554A44] dark:text-[#C5B9B0]">{Math.max(defaultScores.clarity, defaultScores.vocabulary) >= 4 ? 'Bạn đang truyền đạt ý khá rõ và dùng từ phù hợp với chủ đề.' : 'Bạn đã duy trì được lượt hội thoại và chủ động diễn đạt ý tưởng.'}</p></div>
              <div className="rounded-xl bg-white/80 dark:bg-[#211A17]/60 border border-[#EFE1D8] dark:border-[#3A2E27] p-3"><div className="flex items-center gap-2 mb-1.5"><Target size={14} className="text-[#E86F51]" /><span className="text-xs font-semibold">Trọng tâm tiếp theo</span></div><p className="text-xs leading-relaxed text-[#554A44] dark:text-[#C5B9B0]">{defaultScores.grammar <= Math.min(defaultScores.clarity, defaultScores.vocabulary) ? 'Ưu tiên ngữ pháp: nói lại 2–3 câu với cấu trúc tự nhiên hơn.' : defaultScores.naturalness <= 3 ? 'Ưu tiên độ tự nhiên: luyện trả lời ngắn, liền mạch và ít ngập ngừng hơn.' : 'Tiếp tục mở rộng từ vựng và dùng chúng trong câu hoàn chỉnh.'}</p></div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#FFF9F4] dark:bg-[#241C18] border border-[#F1E4D9] dark:border-[#3A2D26] p-3"><Lightbulb size={15} className="text-[#E86F51] mt-0.5 shrink-0" /><p className="text-xs leading-relaxed text-[#554A44] dark:text-[#C5B9B0]"><span className="font-semibold text-[#211A17] dark:text-[#F7F2EE]">Bài tập 60 giây:</span> chọn 1 từ mới ở trên, đặt một câu bằng tiếng Trung và nói lại 2 lần — lần hai cố gắng tự nhiên hơn lần đầu.</p></div>
          </div>

          {/* New Vocabulary Section */}
          {stats.wordsLearned.length > 0 && (
            <section className="space-y-2.5" aria-labelledby="new-vocabulary-title">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#716761] dark:text-[#A89E97]">
                <span id="new-vocabulary-title">Từ vựng mới trong bài ({stats.wordsLearned.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stats.wordsLearned.slice(0, 6).map((word, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#28201B] border border-[#EFE5DB] dark:border-[#3A2F28] flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-base text-[#211A17] dark:text-white">
                          {word.hanzi}
                        </span>
                        <span className="text-xs text-[#E86F51]">{word.pinyin}</span>
                      </div>
                      <p className="text-xs text-[#716761] dark:text-[#A89E97] line-clamp-1">{word.meaning}</p>
                    </div>
                    <AudioButton text={word.hanzi} size="sm" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F8EFE7] dark:bg-[#261F1B] border-t border-[#F0E4D8] dark:border-[#382E28] flex flex-col sm:flex-row gap-2.5 sm:justify-between shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E0D1C4] dark:border-[#3E332C] hover:bg-white dark:hover:bg-[#2D241F] text-sm font-medium transition-colors cursor-pointer"
          >
            <Home size={16} />
            Về Trang chủ
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E0D1C4] dark:border-[#3E332C] hover:bg-white dark:hover:bg-[#2D241F] text-sm font-medium transition-colors cursor-pointer"
            >
              Xem lại hội thoại
            </button>
            <button
              type="button"
              onClick={onPracticeAgain}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#D55F42] text-white text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              Luyện chủ đề mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
