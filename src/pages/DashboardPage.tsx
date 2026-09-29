import React from 'react';
import {
  Flame, BookOpen, Target, Clock, ArrowRight, Mic, MessageSquare,
  RotateCcw, Sparkles, CheckCircle2
} from 'lucide-react';
import { UserProfile, SupportedLanguage } from '../types';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDashboardData } from '../hooks/useDashboardData';

interface DashboardPageProps {
  user: UserProfile;
  onNavigate: (route: string, param?: string) => void;
  language: SupportedLanguage;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onNavigate }) => {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { progress, vocabularyCount } = useDashboardData();

  const displayName = profile?.displayName?.trim() || (profileLoading ? '...' : 'bạn');
  const streakDays = progress?.currentStreak ?? user.streakDays;
  const wordsLearned = progress?.wordsLearned ?? vocabularyCount;
  const minutesLearnedToday = progress?.totalStudyMinutes ?? user.minutesLearnedToday;
  const dailyGoal = Math.max(user.dailyMinutes, 1);
  const todayPercent = Math.min(100, Math.round((minutesLearnedToday / dailyGoal) * 100));

  const steps = [
    { title: 'Ôn SRS', label: 'Cần làm', icon: RotateCcw, action: () => onNavigate('review'), done: minutesLearnedToday >= 3 },
    { title: 'Củng cố', label: 'Khuyến nghị', icon: Target, action: () => onNavigate('learn'), done: false },
    { title: 'Học bài mới', label: 'Tiếp theo', icon: BookOpen, action: () => onNavigate('learn'), done: false },
    { title: 'Speaking', label: 'Luyện nói', icon: Mic, action: () => onNavigate('practice-speaking'), done: false },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in" aria-labelledby="dashboard-title">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-[#FFF8F4] to-[#FFEDE6] dark:from-[#241F1C] dark:via-[#2A2320] dark:to-[#322722] border border-[#E86F51]/15 shadow-sm p-6 sm:p-8 md:p-10">
        <div className="absolute -right-16 -top-20 w-52 h-52 rounded-full bg-[#E86F51]/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-7">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-bold">
              <Sparkles size={14} /> Lina đã chuẩn bị lộ trình hôm nay
            </div>
            <h1 id="dashboard-title" className="text-4xl sm:text-5xl font-black tracking-tight text-[#211A17] dark:text-white">
              你好, {displayName} 👋
            </h1>
            <p className="text-sm sm:text-base text-[#716761] dark:text-[#A89E97] max-w-xl">
              Học ít nhưng đều. Hôm nay Lina sẽ dẫn bạn qua vài bước ngắn để tiến gần mục tiêu tiếng Trung.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#181412]/70 text-xs font-bold text-[#716761] dark:text-[#C7BCB5] border border-[#E86F51]/10">
                HSK {user.chineseLevel}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#181412]/70 text-xs font-bold text-[#716761] dark:text-[#C7BCB5] border border-[#E86F51]/10">
                Mục tiêu {user.targetHsk}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-[#181412]/80 border border-[#E86F51]/10 shadow-sm">
            <LinaAvatar size="md" />
            <div>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Cô giáo AI</p>
              <p className="text-sm font-black text-[#211A17] dark:text-white">Lina đang online</p>
            </div>
            <button type="button" onClick={() => onNavigate('practice-conversation')} className="chiu-btn chiu-btn-primary px-3.5 text-xs ml-1">
              Chat ngay
            </button>
          </div>
        </div>
      </section>

      {/* Today's plan — primary content */}
      <section className="chiu-card p-5 sm:p-7 space-y-6" aria-labelledby="dashboard-today-plan-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">Kế hoạch học hôm nay</span>
            <h2 id="dashboard-today-plan-title" className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white mt-1">Lina đề xuất cho bạn</h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">Một vòng học ngắn, rõ ràng — bạn luôn biết bước tiếp theo.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="chiu-ring shrink-0" role="progressbar" aria-label={`Tiến độ học hôm nay ${todayPercent}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={todayPercent} style={{ '--value': todayPercent } as React.CSSProperties}>
              <span className="text-center"><strong className="block text-lg font-black text-[#211A17] dark:text-white">{todayPercent}%</strong><small className="text-[10px] text-[#716761] dark:text-[#A89E97]">hôm nay</small></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.title}
                type="button"
                onClick={step.action}
                aria-label={`${step.title} · ${step.done ? 'Đã xong' : step.label}`} className="chiu-step group text-left p-4 md:p-3 rounded-2xl md:rounded-none hover:bg-[#FFF9F4] dark:hover:bg-[#2A2320] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86F51] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#211A17] transition-colors"
              >
                <div className="flex md:flex-col items-center md:items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${step.done ? 'bg-[#EAF5EC] border-[#65A873]/20 text-[#65A873]' : index === 0 ? 'bg-[#E86F51] border-[#E86F51] text-white shadow-md shadow-[#E86F51]/20' : 'bg-[#FFF0EB] dark:bg-[#342822] border-[#E86F51]/10 text-[#E86F51]'}`}>
                    {step.done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="min-w-0 flex-1 md:pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#716761] dark:text-[#A89E97]">Bước {index + 1}</p>
                    <p className="text-sm font-black text-[#211A17] dark:text-white mt-0.5">{step.title}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${step.done ? 'bg-[#EAF5EC] text-[#65A873]' : index === 0 ? 'bg-[#FFF0EB] text-[#E86F51]' : 'bg-gray-100 dark:bg-white/10 text-[#716761] dark:text-[#A89E97]'}`}>{step.done ? 'Đã xong' : step.label}</span>
                  </div>
                  <ArrowRight size={15} className="text-[#B7AAA2] group-hover:text-[#E86F51] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Snapshot */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Tổng quan tiến độ học">
        {[
          { icon: Flame, value: `${streakDays} ngày`, label: 'Chuỗi hiện tại', note: 'Giữ nhịp mỗi ngày' },
          { icon: BookOpen, value: String(wordsLearned), label: 'Từ đã nắm', note: 'Từ vựng cá nhân' },
          { icon: Target, value: user.targetHsk, label: 'Mục tiêu', note: `Đang học ${user.chineseLevel}` },
          { icon: Clock, value: `${minutesLearnedToday} phút`, label: 'Hôm nay', note: `Mục tiêu ${dailyGoal} phút` },
        ].map(({ icon: Icon, value, label, note }) => (
          <div key={label} className="chiu-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center"><Icon size={20} /></div>
              <span className="text-[10px] font-bold text-[#716761] dark:text-[#A89E97] text-right">{note}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-4">{value}</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97] mt-0.5">{label}</p>
          </div>
        ))}
      </section>

      {/* Continue learning */}
      <section className="chiu-card overflow-hidden" aria-labelledby="dashboard-continue-title">
        <div className="p-5 sm:p-7 bg-gradient-to-r from-[#FFF8F4] to-white dark:from-[#2A2320] dark:to-[#241F1C]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E86F51]">
                <BookOpen size={14} /> Tiếp tục học
              </div>
              <h2 id="dashboard-continue-title" className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-2">HSK 1 · Lesson 5: Ordering Food at a Restaurant</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {['饭 · cơm', '水 · nước', '好吃 · ngon'].map((word) => (
                  <span key={word} className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181412] border border-[#E86F51]/10 text-xs font-bold font-chinese text-[#E86F51]">{word}</span>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-72 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97] mb-2">
                <span>3 / 8 phần</span><span className="text-[#E86F51]">42%</span>
              </div>
              <div className="chiu-progress" role="progressbar" aria-label="Tiến độ bài học hiện tại 42%" aria-valuemin={0} aria-valuemax={100} aria-valuenow={42}><span style={{ width: '42%' }} /></div>
              <button type="button" onClick={() => onNavigate('learn')} className="chiu-btn chiu-btn-primary w-full mt-3 px-4 text-sm flex items-center justify-center gap-2">
                Tiếp tục lộ trình <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lina Coach — daily coaching layer built from existing dashboard signals */}
      <section aria-live="polite" className="chiu-card p-5 sm:p-6 bg-gradient-to-br from-[#FFF4EE] via-white to-[#FFF9F4] dark:from-[#2A211D] dark:via-[#241F1C] dark:to-[#2A2320]">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <LinaAvatar size="md" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#E86F51]">Lina Coach · Hôm nay</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51]">Không đổi learning engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-1">
              {todayPercent < 50 ? 'Giữ nhịp nhẹ nhưng đều' : streakDays >= 7 ? 'Bạn đang giữ nhịp rất tốt' : 'Tiếp tục biến tiến bộ thành thói quen'}
            </h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1 max-w-2xl">
              {todayPercent < 50 ? `Bạn mới hoàn thành ${todayPercent}% mục tiêu hôm nay. Lina gợi ý một phiên học ngắn trước khi tăng tải.` : streakDays >= 7 ? `Chuỗi ${streakDays} ngày cho thấy bạn đang duy trì thói quen. Hãy dùng phần thời gian còn lại để luyện phản xạ.` : `Bạn đã học ${minutesLearnedToday} phút hôm nay. Một bước tiếp theo rõ ràng sẽ giúp buổi học không bị đứt quãng.`}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={() => onNavigate(todayPercent < 50 ? 'learn' : 'practice-speaking')} className="chiu-btn chiu-btn-primary px-4 text-xs inline-flex items-center gap-2">
                {todayPercent < 50 ? <BookOpen size={15} /> : <Mic size={15} />}
                {todayPercent < 50 ? 'Học một phiên ngắn' : 'Luyện phản xạ với Lina'}
              </button>
              <button type="button" onClick={() => onNavigate('review')} className="chiu-btn chiu-btn-secondary px-4 text-xs inline-flex items-center gap-2">
                <RotateCcw size={15} /> Ôn SRS
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Recommendation + speaking */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-4">
        <div className="rounded-[1.5rem] p-5 sm:p-6 bg-gradient-to-br from-[#E86F51] to-[#F5A28E] text-white shadow-lg shadow-[#E86F51]/15">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Sparkles size={20} /></div>
            <div>
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Lina recommendation</p>
              <h3 className="text-xl font-black mt-1">Luyện nói 5 phút với Lina</h3>
              <p className="text-sm text-white/85 mt-1">Ôn lại chủ đề vừa học và biến từ vựng mới thành phản xạ.</p>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate('practice-speaking')} className="chiu-btn mt-5 px-5 bg-white text-[#E86F51] hover:bg-white/90 text-sm inline-flex items-center gap-2">
            <Mic size={16} /> Luyện với Lina
          </button>
        </div>

        <button type="button" onClick={() => onNavigate('review')} aria-label="Mở Daily Review để ôn SRS" className="chiu-card p-5 sm:p-6 text-left group hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65A873] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#211A17] hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#65A873]/10 text-[#65A873] flex items-center justify-center"><RotateCcw size={20} /></div>
            <ArrowRight size={17} className="text-[#B7AAA2] group-hover:text-[#65A873]" />
          </div>
          <p className="text-xs font-black text-[#65A873] uppercase tracking-wider mt-4">Daily Review</p>
          <h3 className="text-lg font-black text-[#211A17] dark:text-white mt-1">Ôn đúng phần bạn đang yếu</h3>
          <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Flashcards cá nhân + SRS, không thay đổi learning engine.</p>
        </button>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#716761] dark:text-[#A89E97]">
        <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#65A873]" /> Dữ liệu học tập giữ nguyên</div>
        <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#65A873]" /> AI-9 không thay đổi logic</div>
        <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#65A873]" /> Routing & database giữ nguyên</div>
      </div>
    </main>
  );
};
