import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  Clock,
  Target,
  BookOpen,
  Award,
  Compass,
  Briefcase,
  Plane,
  HeartHandshake,
  Loader2,
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { LearningGoal } from '../types/user';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { profile, updateProfile } = useUserProfile();
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [hskLevel, setHskLevel] = useState<number>(profile?.hskLevel || 1);
  const [goal, setGoal] = useState<LearningGoal>(profile?.learningGoal || 'conversation');
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile?.dailyMinutes || 15);
  const [showPinyin, setShowPinyin] = useState<boolean>(profile?.showPinyin ?? true);
  const [showTranslation, setShowTranslation] = useState<boolean>(profile?.showTranslation ?? true);
  const [speechSpeed, setSpeechSpeed] = useState<number>(profile?.speechSpeed || 1.0);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        hskLevel,
        learningGoal: goal,
        dailyMinutes,
        showPinyin,
        showTranslation,
        speechSpeed,
        onboardingCompleted: true,
      });
      onComplete();
    } catch (e) {
      console.warn('Error saving onboarding:', e);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const goals = [
    {
      id: 'conversation' as LearningGoal,
      title: 'Giao tiếp đời sống',
      desc: 'Tự tin nói chuyện hàng ngày với người bản xứ và AI Lina',
      icon: HeartHandshake,
    },
    {
      id: 'travel' as LearningGoal,
      title: 'Du lịch & Khám phá',
      desc: 'Hỏi đường, gọi món ăn, mua sắm và đi lại tại Trung Quốc',
      icon: Plane,
    },
    {
      id: 'work' as LearningGoal,
      title: 'Công việc & Thương mại',
      desc: 'Đàm phán với đối tác, viết email, phỏng vấn xin việc',
      icon: Briefcase,
    },
    {
      id: 'exam' as LearningGoal,
      title: 'Luyện thi HSK / HSKK',
      desc: 'Nắm vững từ vựng và ngữ pháp chuẩn khung Hán ngữ quốc tế',
      icon: Award,
    },
    {
      id: 'culture' as LearningGoal,
      title: 'Văn hóa & Phim ảnh',
      desc: 'Xem phim không cần vietsub, nghe nhạc Hoa, đọc tiểu thuyết',
      icon: Compass,
    },
    {
      id: 'general' as LearningGoal,
      title: 'Học vì sở thích',
      desc: 'Mở rộng vốn hiểu biết ngôn ngữ mới mỗi ngày',
      icon: BookOpen,
    },
  ];

  const timeOptions = [
    { mins: 5, label: '5 phút / ngày', desc: 'Nhẹ nhàng duy trì thói quen' },
    { mins: 10, label: '10 phút / ngày', desc: 'Tiến độ đều đặn mỗi sáng' },
    { mins: 15, label: '15 phút / ngày', desc: 'Lý tưởng nhất (Khuyên dùng)', badge: 'Phổ biến' },
    { mins: 30, label: '30 phút / ngày', desc: 'Tiến bộ nhanh vượt bậc' },
    { mins: 45, label: '45+ phút / ngày', desc: 'Chinh phục tiếng Trung cấp tốc' },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-[#201A17] rounded-3xl p-6 sm:p-10 border border-[#E86F51]/15 shadow-xl space-y-8 animate-fade-in">
        {/* Step Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#8C8078] mb-2">
            <span>Bước {step} / 5</span>
            <span className="text-[#E86F51]">
              {step === 1 && 'Trình độ hiện tại'}
              {step === 2 && 'Mục tiêu học tập'}
              {step === 3 && 'Thời gian mỗi ngày'}
              {step === 4 && 'Tùy chỉnh hỗ trợ'}
              {step === 5 && 'Hoàn tất lộ trình'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#FAF4EF] dark:bg-[#2E241E] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E86F51] to-[#F5A28E] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: HSK LEVEL */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white">
                Trình độ tiếng Trung hiện tại của bạn?
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97]">
                Lina sẽ điều chỉnh vốn từ và tốc độ nói phù hợp nhất với bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { lvl: 1, label: 'HSK 1 - Nhập môn', desc: 'Chưa biết gì hoặc mới học phát âm Pinyin' },
                { lvl: 2, label: 'HSK 2 - Sơ cấp', desc: 'Giao tiếp câu đơn giản, biết khoảng 300 từ' },
                { lvl: 3, label: 'HSK 3 - Trung cấp', desc: 'Nói được câu dài, biết khoảng 600 từ' },
                { lvl: 4, label: 'HSK 4 - Khá', desc: 'Thảo luận nhiều chủ đề, biết 1200 từ' },
                { lvl: 5, label: 'HSK 5 - Cao cấp', desc: 'Xem tin tức, thuyết trình tự nhiên' },
                { lvl: 6, label: 'HSK 6 - Thành thạo', desc: 'Giao tiếp trôi chảy như người bản xứ' },
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setHskLevel(item.lvl)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    hskLevel === item.lvl
                      ? 'border-[#E86F51] bg-[#FFF0EB] dark:bg-[#342620] shadow-sm'
                      : 'border-[#EDE4DB] dark:border-[#382E27] hover:border-[#E86F51]/50 bg-white dark:bg-[#261E1A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${hskLevel === item.lvl ? 'text-[#E86F51]' : 'text-[#211A17] dark:text-white'}`}>
                      {item.label}
                    </p>
                    {hskLevel === item.lvl && <CheckCircle2 size={18} className="text-[#E86F51]" />}
                  </div>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: LEARNING GOALS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white">
                Mục tiêu học chính của bạn là gì?
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97]">
                AI Lina sẽ gợi ý các tình huống thực chiến đúng sở thích của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-[#E86F51] bg-[#FFF0EB] dark:bg-[#342620] shadow-sm'
                        : 'border-[#EDE4DB] dark:border-[#382E27] hover:border-[#E86F51]/50 bg-white dark:bg-[#261E1A]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#E86F51] text-white' : 'bg-[#FAF4EF] dark:bg-[#342B25] text-[#E86F51]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-[#E86F51]' : 'text-[#211A17] dark:text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: DAILY MINUTES */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white">
                Bạn muốn dành bao nhiêu thời gian mỗi ngày?
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97]">
                Chỉ 10–15 phút mỗi ngày cũng tạo nên sự khác biệt sau 30 ngày!
              </p>
            </div>

            <div className="space-y-3">
              {timeOptions.map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setDailyMinutes(opt.mins)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    dailyMinutes === opt.mins
                      ? 'border-[#E86F51] bg-[#FFF0EB] dark:bg-[#342620] shadow-sm'
                      : 'border-[#EDE4DB] dark:border-[#382E27] hover:border-[#E86F51]/50 bg-white dark:bg-[#261E1A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock
                      size={20}
                      className={dailyMinutes === opt.mins ? 'text-[#E86F51]' : 'text-[#8C8078]'}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${dailyMinutes === opt.mins ? 'text-[#E86F51]' : 'text-[#211A17] dark:text-white'}`}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E86F51] text-white uppercase">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  {dailyMinutes === opt.mins && <CheckCircle2 size={20} className="text-[#E86F51]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: PREFERENCES */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white">
                Tùy chỉnh hiển thị & Giọng đọc
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97]">
                Bạn luôn có thể thay đổi lại các mục này trong phần Cài đặt.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF6F2] dark:bg-[#29201B] flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#211A17] dark:text-white">Hiển thị Pinyin (Phiên âm)</p>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                    Giúp bạn dễ đọc chữ Hán hơn khi mới bắt đầu
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showPinyin}
                  onChange={(e) => setShowPinyin(e.target.checked)}
                  className="w-5 h-5 accent-[#E86F51] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F2] dark:bg-[#29201B] flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#211A17] dark:text-white">Hiển thị Bản dịch nghĩa</p>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                    Bản dịch tiếng Việt bên dưới mỗi câu thoại
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="w-5 h-5 accent-[#E86F51] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F2] dark:bg-[#29201B] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#211A17] dark:text-white">Tốc độ nói của Lina</p>
                  <span className="text-xs font-bold text-[#E86F51]">{speechSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={speechSpeed}
                  onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#E86F51] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#8C8078]">
                  <span>0.75x (Chậm rãi)</span>
                  <span>1.0x (Tự nhiên)</span>
                  <span>1.25x (Nhanh)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRMATION & SUMMARY */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#211A17] dark:text-white">
                Lộ trình học đã sẵn sàng! 🚀
              </h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] max-w-md mx-auto">
                HanziAI đã thiết lập kế hoạch học cá nhân hóa cho bạn.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFF9F5] dark:bg-[#2B211C] border border-[#E86F51]/20 text-left space-y-3">
              <div className="flex justify-between text-xs py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-[#716761] dark:text-[#A89E97]">Trình độ:</span>
                <span className="font-bold text-[#211A17] dark:text-white">HSK {hskLevel}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-[#716761] dark:text-[#A89E97]">Mục tiêu:</span>
                <span className="font-bold text-[#211A17] dark:text-white">
                  {goals.find((g) => g.id === goal)?.title}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-[#716761] dark:text-[#A89E97]">Mục tiêu thời gian:</span>
                <span className="font-bold text-[#211A17] dark:text-white">{dailyMinutes} phút mỗi ngày</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-[#716761] dark:text-[#A89E97]">Giáo viên AI:</span>
                <span className="font-bold text-[#E86F51]">Lina (Phát âm chuẩn Bắc Kinh)</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EDE4DB] dark:border-[#382E27]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#716761] dark:text-[#A89E97] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-2xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Vào học ngay</span>
                  <Sparkles size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
