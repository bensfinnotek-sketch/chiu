import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3,
  Flame, MessageCircle, Mic2, RefreshCw, Sparkles, Target, TrendingUp,
} from 'lucide-react';

type Goal = 'conversation' | 'travel' | 'work' | 'exam' | 'culture' | 'general';

interface StudyPlan {
  goal: Goal;
  currentLevel: number;
  targetLevel: number;
  dailyMinutes: number;
  daysPerWeek: number;
  durationWeeks: number;
  createdAt: string;
}

interface WeekPlan {
  week: number;
  title: string;
  focus: string;
  tasks: string[];
  minutes: number;
}

const STORAGE_KEY = 'chiu_personal_study_plan';

const goalOptions: Array<{ id: Goal; title: string; description: string; icon: React.ElementType }> = [
  { id: 'conversation', title: 'Giao tiếp đời sống', description: 'Nói tự nhiên, phản xạ và xử lý tình huống hằng ngày.', icon: MessageCircle },
  { id: 'travel', title: 'Du lịch', description: 'Hỏi đường, đặt phòng, ăn uống và giao tiếp khi đi Trung Quốc.', icon: Target },
  { id: 'work', title: 'Công việc', description: 'Email, họp, trao đổi và từ vựng môi trường làm việc.', icon: TrendingUp },
  { id: 'exam', title: 'HSK / HSKK', description: 'Theo mục tiêu cấp độ và củng cố kỹ năng theo kỳ thi.', icon: BookOpen },
  { id: 'culture', title: 'Văn hóa & phim ảnh', description: 'Nghe hiểu, từ lóng và cách diễn đạt trong đời sống thật.', icon: Sparkles },
  { id: 'general', title: 'Học vì sở thích', description: 'Tiến bộ cân bằng, nhẹ nhàng và duy trì thói quen.', icon: Brain },
];

const goalLabels: Record<Goal, string> = {
  conversation: 'Giao tiếp đời sống',
  travel: 'Du lịch',
  work: 'Công việc',
  exam: 'HSK / HSKK',
  culture: 'Văn hóa & phim ảnh',
  general: 'Học vì sở thích',
};

function buildWeeks(plan: StudyPlan): WeekPlan[] {
  const total = plan.durationWeeks;
  return Array.from({ length: total }, (_, index) => {
    const week = index + 1;
    let title = 'Xây nền từ vựng + mẫu câu';
    if (week <= 2) title = 'Khởi động & tạo nhịp';
    else if (week > Math.ceil(total * 0.7)) title = 'Ứng dụng thực tế';
    if (week > Math.ceil(total * 0.9)) title = 'Tổng ôn & kiểm tra';

    let focus = 'Từ vựng + nghe + nói cân bằng';
    if (plan.goal === 'conversation') focus = 'Hội thoại + speaking với Lina';
    if (plan.goal === 'travel') focus = 'Tình huống du lịch + phản xạ';
    if (plan.goal === 'work') focus = 'Từ vựng công việc + hội thoại';
    if (plan.goal === 'exam') focus = 'Từ vựng, ngữ pháp + mini test';
    if (plan.goal === 'culture') focus = 'Nghe hiểu + cách nói tự nhiên';

    const level = Math.min(plan.targetLevel, plan.currentLevel + Math.floor((week - 1) / 3));
    return {
      week,
      title,
      focus,
      minutes: plan.dailyMinutes,
      tasks: [
        'Học bài HSK ' + level + ' phù hợp tiến độ',
        'Ôn SRS các từ đang yếu và 5–10 từ mới',
        week % 2 === 0 ? 'Luyện nghe + nói 5–10 phút với Lina' : 'Luyện đặt câu và trả lời nhanh với Lina',
        week % 3 === 0 ? 'Mini check: tự kiểm tra từ vựng + mẫu câu' : 'Ôn cuối buổi và đánh dấu phần chưa chắc',
      ],
    };
  });
}

export const StudyPlanPage: React.FC = () => {
  const [goal, setGoal] = useState<Goal>('conversation');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(3);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [saved, setSaved] = useState(false);\n  const [adaptiveDays, setAdaptiveDays] = useState<Record<string, AdaptiveDay>>({});\n  const [speakingProgress, setSpeakingProgress] = useState(() => progressService.getProgress());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPlan(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (!plan) return;
    setGoal(plan.goal);
    setCurrentLevel(plan.currentLevel);
    setTargetLevel(plan.targetLevel);
    setDailyMinutes(plan.dailyMinutes);
    setDaysPerWeek(plan.daysPerWeek);
    setDurationWeeks(plan.durationWeeks);
  }, [plan]);

  const weeks = useMemo(() => (plan ? buildWeeks(plan) : []), [plan]);
  const activeWeekData = weeks.find((item) => item.week === activeWeek) || weeks[0];
  const weeklyMinutes = (plan?.dailyMinutes || dailyMinutes) * (plan?.daysPerWeek || daysPerWeek);
  const estimatedHours = plan ? Math.round((weeklyMinutes * plan.durationWeeks) / 60) : 0;\n  const completedPlanDays = Object.values(adaptiveDays).filter((day) => day.completed).length;\n  const recentPlanDays = Object.values(adaptiveDays).slice(-7);\n  const recentCompletionRate = recentPlanDays.length ? (recentPlanDays.filter((day) => day.completed).length / recentPlanDays.length) * 100 : 50;\n  const adaptiveDecision = speakingProgress.streak >= 5 && recentCompletionRate >= 70 ? 'advance_hsk' : speakingProgress.streak <= 1 || recentCompletionRate < 40 ? 'learn_lesson' : 'review_quiz';\n  const adaptivePlan = plan ? buildPersonalizedLearningPlan({ dailyMinutes: plan.dailyMinutes, learningGoal: plan.goal, decision: adaptiveDecision, completionPercent: Math.min(100, Math.round((completedPlanDays / Math.max(1, plan.durationWeeks * plan.daysPerWeek)) * 100)), vocabularyScore: 70, grammarScore: 70, quizScore: 75, momentumScore: Math.min(100, 50 + speakingProgress.streak * 8), momentumTrend: speakingProgress.streak >= 5 ? 'rising' : speakingProgress.streak <= 1 ? 'falling' : 'stable', recentCompletionRate, consistencyScore: recentCompletionRate }) : null;\n  const todayKey = new Date().toISOString().slice(0, 10);\n  const todayDone = adaptiveDays[todayKey]?.completed === true;

  const handleGenerate = () => {
    const next: StudyPlan = {
      goal,
      currentLevel,
      targetLevel: Math.max(currentLevel, targetLevel),
      dailyMinutes,
      daysPerWeek,
      durationWeeks,
      createdAt: new Date().toISOString(),
    };
    setPlan(next);
    setActiveWeek(1);
    setSaved(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.setTimeout(() => setSaved(false), 2200);
  };

  const resetPlan = () => {
    setPlan(null);
    setActiveWeek(1);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-7 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-[#FFF8F4] to-[#FFE9DF] dark:from-[#241F1C] dark:via-[#2A2320] dark:to-[#332621] border border-[#E86F51]/15 shadow-sm p-6 sm:p-9">
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-[#E86F51]/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-black"><Sparkles size={14} /> Lina Personal Learning Coach</div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#211A17] dark:text-white mt-4">Tạo kế hoạch học cá nhân</h1>
          <p className="text-sm sm:text-base text-[#716761] dark:text-[#A89E97] mt-2 leading-relaxed">
            Chọn mục tiêu và nhịp học. HanziAI sẽ biến chúng thành lộ trình theo tuần, có việc cần làm mỗi buổi và sẵn sàng kết nối với Lina, SRS và bài học.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['Mục tiêu rõ ràng', 'Lộ trình theo tuần', 'Lưu tự động', 'Có thể điều chỉnh'].map((item) => (
              <span key={item} className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#181412]/60 border border-[#E86F51]/10 text-xs font-bold text-[#716761] dark:text-[#C7BCB5]">
                <CheckCircle2 size={13} className="inline mr-1.5 text-[#65A873]" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-5">
        <div className="chiu-card p-5 sm:p-7 space-y-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86F51]">Bước 1</p>
            <h2 className="text-2xl font-black text-[#211A17] dark:text-white mt-1">Bạn muốn đạt điều gì?</h2>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">Mục tiêu quyết định tỷ trọng speaking, listening, từ vựng và bài tập.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalOptions.map((item) => {
              const Icon = item.icon;
              const active = goal === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setGoal(item.id)}
                  className={'text-left p-4 rounded-2xl border transition-all ' + (active ? 'border-[#E86F51] bg-[#FFF3EE] dark:bg-[#342822] shadow-sm' : 'border-[#EADFD6] dark:border-[#3A3029] bg-white dark:bg-[#241F1C] hover:border-[#E86F51]/50')}>
                  <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (active ? 'bg-[#E86F51] text-white' : 'bg-[#E86F51]/10 text-[#E86F51]')}><Icon size={19} /></div>
                  <p className="text-sm font-black text-[#211A17] dark:text-white mt-3">{item.title}</p>
                  <p className="text-[11px] leading-relaxed text-[#716761] dark:text-[#A89E97] mt-1">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-5 border-t border-[#EDE4DB] dark:border-[#382E27] space-y-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86F51]">Bước 2</p>
              <h2 className="text-xl font-black text-[#211A17] dark:text-white mt-1">Mức độ & nhịp học</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">HSK hiện tại</span>
                <select value={currentLevel} onChange={(e) => { const value = Number(e.target.value); setCurrentLevel(value); if (targetLevel < value) setTargetLevel(value); }} className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-bold text-[#211A17] dark:text-white">
                  {[1,2,3,4,5,6].map((level) => <option key={level} value={level}>HSK {level}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">Mục tiêu HSK</span>
                <select value={targetLevel} onChange={(e) => setTargetLevel(Math.max(currentLevel, Number(e.target.value)))} className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-bold text-[#211A17] dark:text-white">
                  {[1,2,3,4,5,6].map((level) => <option key={level} value={level}>HSK {level}</option>)}
                </select>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">Thời gian mỗi ngày</span><span className="text-sm font-black text-[#E86F51]">{dailyMinutes} phút</span></div>
              <input type="range" min={15} max={60} step={5} value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} className="w-full accent-[#E86F51]" />
              <div className="flex justify-between text-[10px] text-[#A0958D] mt-1"><span>15 phút</span><span>30</span><span>45</span><span>60 phút</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">Ngày học / tuần</span>
                <select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-bold text-[#211A17] dark:text-white">
                  {[3,4,5,6,7].map((days) => <option key={days} value={days}>{days} ngày</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">Thời lượng lộ trình</span>
                <select value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-bold text-[#211A17] dark:text-white">
                  {[4,8,12,16,24].map((weeks) => <option key={weeks} value={weeks}>{weeks} tuần</option>)}
                </select>
              </label>
            </div>

            <button type="button" onClick={handleGenerate} className="w-full chiu-btn chiu-btn-primary py-3.5 text-sm flex items-center justify-center gap-2"><Sparkles size={17} /> Tạo kế hoạch của tôi <ArrowRight size={17} /></button>
            {saved && <p className="text-center text-xs font-bold text-[#65A873]"><CheckCircle2 size={14} className="inline mr-1" /> Đã tạo và lưu kế hoạch</p>}
          </div>
        </div>

        <aside className="chiu-card p-5 sm:p-7 bg-gradient-to-br from-[#FFF9F4] to-white dark:from-[#2A2320] dark:to-[#241F1C]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center"><CalendarDays size={21} /></div>
            <div><p className="text-xs font-black uppercase tracking-wider text-[#E86F51]">Kế hoạch sẽ gồm</p><h3 className="text-lg font-black text-[#211A17] dark:text-white">Một lịch học có lý do</h3></div>
          </div>
          <div className="space-y-3 mt-6">
            {[
              ['Mục tiêu', goalLabels[goal]],
              ['Từ HSK', 'HSK ' + currentLevel + ' → HSK ' + Math.max(currentLevel, targetLevel)],
              ['Nhịp học', dailyMinutes + ' phút × ' + daysPerWeek + ' ngày/tuần'],
              ['Thời lượng', durationWeeks + ' tuần'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#181412]/50 border border-[#E86F51]/10"><span className="text-xs text-[#716761] dark:text-[#A89E97]">{label}</span><span className="text-xs font-black text-[#211A17] dark:text-white text-right">{value}</span></div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-2xl bg-[#E86F51]/8 border border-[#E86F51]/10">
            <p className="text-xs font-bold text-[#211A17] dark:text-white">Vòng lặp của HanziAI</p>
            <p className="text-[11px] leading-relaxed text-[#716761] dark:text-[#A89E97] mt-1">Kế hoạch → học → đo kết quả → nhận diện điểm yếu → điều chỉnh. Sau này Lina sẽ dùng chính kế hoạch này để chọn chủ đề hội thoại.</p>
          </div>
        </aside>
      </section>

      {plan && adaptivePlan && (
        <section className="chiu-card p-5 sm:p-7 border-[#E86F51]/20 bg-gradient-to-br from-[#FFF7F2] to-white dark:from-[#2A2320] dark:to-[#241F1C]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86F51]">Kế hoạch linh động hôm nay</p><h2 className="text-xl sm:text-2xl font-black text-[#211A17] dark:text-white mt-1">{adaptivePlan.focus} · {adaptivePlan.dailyMinutes} phút</h2><p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">{adaptivePlan.adaptationReason}</p></div>
            <button type="button" onClick={toggleToday} className={'px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 ' + (todayDone ? 'bg-[#65A873]/15 text-[#4D8A59]' : 'bg-[#E86F51] text-white')}><CheckCircle2 size={15} /> {todayDone ? 'Đã hoàn thành hôm nay' : 'Đánh dấu đã học'}</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            {adaptivePlan.steps.map((step) => <div key={step.id} className="p-3 rounded-2xl bg-white/80 dark:bg-[#181412]/55 border border-[#EDE4DB] dark:border-[#382E27]"><p className="text-[11px] font-black text-[#211A17] dark:text-white">{step.title}</p><p className="text-lg font-black text-[#E86F51] mt-1">{step.minutes}′</p><p className="text-[10px] leading-relaxed text-[#716761] dark:text-[#A89E97] mt-1">{step.description}</p></div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold"><span className="px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">Độ khó: {adaptivePlan.difficulty}</span><span className="px-3 py-1.5 rounded-full bg-[#65A873]/10 text-[#4D8A59]">Từ mới: {adaptivePlan.newWordsTarget}/ngày</span><span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300">Streak Lina: {speakingProgress.streak} ngày</span><span className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-[#716761] dark:text-[#C7BCB5]">Đã hoàn thành: {completedPlanDays} ngày</span></div>
        </section>
      )}
      {plan ? (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86F51]">Kế hoạch đã tạo</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white mt-1">{goalLabels[plan.goal]} · HSK {plan.currentLevel} → HSK {plan.targetLevel}</h2>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">Khoảng {estimatedHours} giờ học trong toàn bộ lộ trình nếu giữ đúng nhịp.</p>
            </div>
            <button type="button" onClick={resetPlan} className="self-start sm:self-auto px-4 py-2.5 rounded-2xl border border-[#E5DAD0] dark:border-[#3E322A] bg-white dark:bg-[#241F1C] text-xs font-bold text-[#716761] dark:text-[#C7BCB5] hover:border-[#E86F51] transition-colors flex items-center gap-2"><RefreshCw size={14} /> Tạo lại</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Target, value: 'HSK ' + plan.targetLevel, label: 'Đích đến' },
              { icon: Clock3, value: weeklyMinutes + ' phút', label: 'Mỗi tuần' },
              { icon: CalendarDays, value: plan.durationWeeks + ' tuần', label: 'Lộ trình' },
              { icon: Flame, value: plan.daysPerWeek + ' ngày', label: 'Nhịp học' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="chiu-card p-4"><Icon size={18} className="text-[#E86F51]" /><p className="text-xl font-black text-[#211A17] dark:text-white mt-3">{value}</p><p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{label}</p></div>
            ))}
          </div>

          <div className="chiu-card p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 shrink-0">
                <p className="text-xs font-black text-[#716761] dark:text-[#A89E97] uppercase tracking-wider">Các tuần</p>
                <div className="mt-3 flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {weeks.map((item) => (
                    <button key={item.week} type="button" onClick={() => setActiveWeek(item.week)} className={'shrink-0 lg:w-full text-left px-3.5 py-3 rounded-2xl border transition-all ' + (activeWeek === item.week ? 'bg-[#FFF1EB] dark:bg-[#342822] border-[#E86F51]/40' : 'bg-white dark:bg-[#241F1C] border-[#EEE4DB] dark:border-[#3A3029] hover:border-[#E86F51]/30')}>
                      <span className="text-[10px] font-black text-[#E86F51]">TUẦN {item.week}</span><span className="block text-xs font-bold text-[#211A17] dark:text-white mt-0.5">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeWeekData && (
                <div className="min-w-0 flex-1">
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF7F2] to-white dark:from-[#2B231F] dark:to-[#241F1C] border border-[#E86F51]/10">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div><span className="text-[10px] font-black uppercase tracking-wider text-[#E86F51]">Tuần {activeWeekData.week}</span><h3 className="text-2xl font-black text-[#211A17] dark:text-white mt-1">{activeWeekData.title}</h3><p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">{activeWeekData.focus}</p></div>
                      <span className="px-3 py-1.5 rounded-full bg-white dark:bg-[#181412] border border-[#E86F51]/10 text-xs font-black text-[#E86F51]">{activeWeekData.minutes} phút / ngày</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                      {activeWeekData.tasks.map((task, index) => (
                        <div key={task} className="flex gap-3 p-4 rounded-2xl bg-white/85 dark:bg-[#181412]/55 border border-[#EDE4DB] dark:border-[#382E27]"><div className="w-8 h-8 rounded-xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center shrink-0 text-xs font-black">{index + 1}</div><p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#403732] dark:text-[#D8CEC7]">{task}</p></div>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-[#65A873]/10 text-[#4D8A59] dark:text-[#8BD696] text-[11px] font-bold"><RefreshCw size={13} className="inline mr-1" /> SRS</span>
                      <span className="px-3 py-1.5 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-[11px] font-bold"><Mic2 size={13} className="inline mr-1" /> Lina Speaking</span>
                      <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 text-[11px] font-bold"><BookOpen size={13} className="inline mr-1" /> Bài học HSK</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl p-5 sm:p-6 bg-[#211A17] text-white dark:bg-[#2B231F] border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div><p className="text-xs font-black uppercase tracking-wider text-[#F5A28E]">Bước tiếp theo</p><h3 className="text-xl font-black mt-1">Biến kế hoạch thành hành động mỗi ngày</h3><p className="text-xs text-white/65 mt-1">MVP này đã tạo nội dung lộ trình. Lớp AI điều chỉnh theo kết quả học sẽ nối vào vòng lặp này ở bước tiếp theo.</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app_navigate', { detail: { route: 'learn' } }))} className="px-4 py-2.5 rounded-2xl bg-white text-[#211A17] text-xs font-black flex items-center gap-2 hover:bg-[#FFF4EE]"><BookOpen size={15} /> Học bài</button>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app_navigate', { detail: { route: 'practice-speaking' } }))} className="px-4 py-2.5 rounded-2xl bg-[#E86F51] text-white text-xs font-black flex items-center gap-2 hover:bg-[#D85F43]"><Mic2 size={15} /> Luyện với Lina</button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="chiu-card p-6 sm:p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center"><CalendarDays size={25} /></div>
          <h2 className="text-xl font-black text-[#211A17] dark:text-white mt-4">Chưa có kế hoạch đang chạy</h2>
          <p className="text-sm text-[#716761] dark:text-[#A89E97] max-w-lg mx-auto mt-1">Chọn mục tiêu và nhịp học ở phía trên. Khi bấm “Tạo kế hoạch của tôi”, nội dung từng tuần sẽ xuất hiện ngay tại đây.</p>
        </section>
      )}
    </main>
  );
};
