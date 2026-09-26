import React from 'react';
import {
  Flame,
  BookOpen,
  Target,
  Clock,
  ArrowRight,
  Mic,
  MessageSquare,
  RotateCcw,
  Layers,
  Sparkles,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { UserProfile, SupportedLanguage } from '../types';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurriculum } from '../hooks/useCurriculum';

interface DashboardPageProps {
  user: UserProfile;
  onNavigate: (route: string, param?: string) => void;
  language: SupportedLanguage;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onNavigate,
}) => {
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { progress, vocabularyCount } = useDashboardData();
  const displayName = profile?.displayName?.trim() || (profileLoading ? '...' : 'bạn');
  const streakDays = progress?.currentStreak ?? user.streakDays;
  const wordsLearned = progress?.wordsLearned ?? vocabularyCount;
  const minutesLearnedToday = progress?.totalStudyMinutes ?? user.minutesLearnedToday;
  const currentHskLevel = Math.min(6, Math.max(1, Number(String(user.chineseLevel).match(/\d+/)?.[0] || 1))) as 1 | 2 | 3 | 4 | 5 | 6;
  const { levelCompletion, recommendations, isLoading: curriculumLoading } = useCurriculum(currentHskLevel);
  const nextRecommendation = recommendations[0];

  const handleLearningRecommendation = () => {
    if (!nextRecommendation) {
      onNavigate('learn', `level:${currentHskLevel}`);
      return;
    }
    if (nextRecommendation.targetId === 'flashcards') {
      onNavigate('flashcards');
      return;
    }
    if (nextRecommendation.targetId.startsWith('level:')) {
      onNavigate('learn', nextRecommendation.targetId);
      return;
    }
    if (nextRecommendation.targetId !== 'grammar') {
      onNavigate('learn-detail', nextRecommendation.targetId);
      return;
    }
    onNavigate('learn', `level:${currentHskLevel}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* 1. Header Greeting & Lina Callout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-white via-[#FFF8F4] to-[#FFF0EB] dark:from-[#241F1C] dark:via-[#2A2320] dark:to-[#322722] p-6 sm:p-8 rounded-3xl border border-[#E86F51]/15 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-bold">
            <Sparkles size={14} />
            <span>Kế hoạch học cá nhân hóa</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#211A17] dark:text-white tracking-tight">
            你好, {displayName} 👋
          </h1>
          <p className="text-base text-[#716761] dark:text-[#A89E97]">
            Ready for today's Chinese practice? Hãy cùng Lina luyện nói 10 phút nhé!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-[#181412] p-3 rounded-2xl border border-[#E86F51]/10 shadow-xs">
          <LinaAvatar size="md" />
          <div className="text-left">
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">Cô giáo AI</p>
            <p className="text-sm font-bold text-[#211A17] dark:text-white">Lina đang online</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice-conversation')}
            className="px-3.5 py-2 rounded-xl bg-[#E86F51] text-white text-xs font-bold hover:bg-[#d85f41] transition-colors cursor-pointer ml-1"
          >
            Chat ngay
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <Flame size={22} className="fill-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#211A17] dark:text-white">{streakDays} ngày</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97]">Chuỗi học liên tiếp (Streak)</p>
          </div>
        </div>

        {/* Words Learned */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#211A17] dark:text-white">{wordsLearned}</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97]">Từ vựng đã nắm vững</p>
          </div>
        </div>

        {/* Current HSK Target */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#65A873] flex items-center justify-center">
            <Target size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#211A17] dark:text-white">{user.chineseLevel}</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97]">Mục tiêu: {user.targetHsk}</p>
          </div>
        </div>

        {/* Minutes Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#211A17] dark:text-white">{minutesLearnedToday} phút</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97]">Thời gian hôm nay (Mục tiêu {user.dailyMinutes}m)</p>
          </div>
        </div>
      </div>

      {/* 3. Learning Core recommendation */}
      <div className="bg-white dark:bg-[#241F1C] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#E86F51] uppercase tracking-wider">Bước học tiếp theo</span>
            <h2 className="text-2xl font-bold text-[#211A17] dark:text-white mt-1">
              {curriculumLoading ? 'Đang phân tích tiến độ của bạn...' : nextRecommendation?.title || `Tiếp tục lộ trình HSK ${currentHskLevel}`}
            </h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97] mt-1">
              {nextRecommendation?.description || 'Lộ trình sẽ được chọn từ dữ liệu tiến độ, quiz, từ vựng và ngữ pháp đã ghi nhận.'}
            </p>
          </div>
          <button type="button" onClick={handleLearningRecommendation} disabled={curriculumLoading}
            className="px-6 py-3 rounded-2xl bg-[#E86F51] text-white font-bold text-sm shadow-md shadow-[#E86F51]/20 hover:bg-[#d85f41] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-2 cursor-pointer">
            <span>{nextRecommendation?.actionText || 'Mở lộ trình'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#716761] dark:text-[#A89E97]">
            <span>Tiến độ HSK {currentHskLevel}</span>
            <span className="text-[#E86F51]">{levelCompletion?.completionPercent ?? 0}%</span>
          </div>
          <div className="w-full h-3 bg-[#FFF0EB] dark:bg-[#342822] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E86F51] to-[#F5A28E] rounded-full transition-all duration-500" style={{ width: `${levelCompletion?.completionPercent ?? 0}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#716761] dark:text-[#A89E97]">
            <span>{levelCompletion?.completedLessons ?? 0}/{levelCompletion?.totalRequiredLessons ?? 0} bài bắt buộc</span>
            <span>Mastery {levelCompletion?.masteryScore ?? 0}/100</span>
            <span>Quiz {levelCompletion?.quizMastery ?? 0}/100</span>
          </div>
        </div>
      </div>

      {/* 4. Daily goal */}
      <div className="rounded-3xl bg-[#211A17] dark:bg-[#2A2320] p-5 sm:p-6 text-white border border-[#E86F51]/20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame size={17} className="text-[#F5A28E]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#F5A28E]">Mục tiêu hôm nay</span>
            </div>
            <h3 className="text-xl font-bold mt-1">{Math.min(minutesLearnedToday, user.dailyMinutes)} / {user.dailyMinutes} phút học</h3>
            <p className="text-xs text-white/65 mt-1">
              {minutesLearnedToday >= user.dailyMinutes ? 'Bạn đã hoàn thành mục tiêu hôm nay. Giữ nhịp học tiếp nhé!' : 'Một phiên học ngắn nữa là bạn chạm mục tiêu hôm nay.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('review')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E86F51] text-white text-xs font-bold hover:bg-[#d85f41] transition-colors cursor-pointer shrink-0"
          >
            {minutesLearnedToday >= user.dailyMinutes ? 'Ôn thêm' : 'Học tiếp'}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-white/10 overflow-hidden" aria-label={`Tiến độ mục tiêu hôm nay: ${Math.min(100, Math.round((minutesLearnedToday / Math.max(user.dailyMinutes, 1)) * 100))}%`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E86F51] to-[#F5A28E] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((minutesLearnedToday / Math.max(user.dailyMinutes, 1)) * 100))}%` }}
          />
        </div>
      </div>

      {/* 4. Quick Action Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#211A17] dark:text-white">Luyện tập hôm nay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Speaking Practice */}
          <div
            onClick={() => onNavigate('practice-speaking')}
            className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] text-white flex items-center justify-center shadow-md shadow-[#E86F51]/25 group-hover:scale-105 transition-transform">
              <Mic size={22} />
            </div>
            <h4 className="text-lg font-bold text-[#211A17] dark:text-white group-hover:text-[#E86F51] transition-colors">
              Luyện phát âm giọng nói
            </h4>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">
              Nhấn mic, nói câu tiếng Trung theo chủ đề và nhận đánh giá sao cùng mẹo phát âm từ Lina.
            </p>
          </div>

          {/* AI Voice Conversation */}
          <div
            onClick={() => onNavigate('practice-conversation')}
            className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D5A85C] to-[#E5BE79] text-white flex items-center justify-center shadow-md shadow-[#D5A85C]/25 group-hover:scale-105 transition-transform">
              <MessageSquare size={22} />
            </div>
            <h4 className="text-lg font-bold text-[#211A17] dark:text-white group-hover:text-[#D5A85C] transition-colors">
              Hội thoại tự do với Lina
            </h4>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">
              Trò chuyện bằng giọng nói hoặc tin nhắn. Tự động phát hiện lỗi sai và gợi ý cách diễn đạt tự nhiên hơn.
            </p>
          </div>

          {/* Daily 10-Minute Review */}
          <div
            onClick={() => onNavigate('review')}
            className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#65A873] to-[#88C695] text-white flex items-center justify-center shadow-md shadow-[#65A873]/25 group-hover:scale-105 transition-transform">
              <RotateCcw size={22} />
            </div>
            <h4 className="text-lg font-bold text-[#211A17] dark:text-white group-hover:text-[#65A873] transition-colors">
              Ôn tập ngày 10 phút
            </h4>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">
              5 từ vựng, 3 bài nghe và 2 bài luyện nói tổng hợp để duy trì phản xạ và giữ vững chuỗi Streak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
