import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  BookOpen,
  Target,
  Clock,
  Award,
  MessageSquare,
  Mic,
  RotateCcw,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ALL_HSK_LEVELS } from '../data/hskData';
import { useAuth } from '../hooks/useAuth';
import { getProgressRepository, getVocabularyRepository } from '../services/repositories/repositoryFactory';
import { LearningProgress } from '../types/progress';
import { UserVocabulary } from '../types/vocabulary';

export const ProgressPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { user: authUser } = useAuth();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [vocabulary, setVocabulary] = useState<UserVocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const userId = authUser?.id || 'guest_user';
        const [nextProgress, nextVocabulary] = await Promise.all([
          getProgressRepository(authUser).getProgress(userId),
          getVocabularyRepository(authUser).getUserVocabulary(userId),
        ]);

        if (!cancelled) {
          setProgress(nextProgress);
          setVocabulary(nextVocabulary);
        }
      } catch (error) {
        console.warn('[Progress] Failed to load progress:', error);
        if (!cancelled) {
          setProgress(null);
          setVocabulary([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const levelStats = useMemo(
    () =>
      ALL_HSK_LEVELS.map((level) => {
        const words = vocabulary.filter((word) => word.hskLevel === Number(level.level.replace('HSK ', '')));
        const learned = words.filter((word) => word.status === 'learned').length;
        const learning = words.filter((word) => word.status === 'learning').length;
        const total = Math.min(level.wordsCount, words.length);
        const percent = Math.min(100, Math.round((learned / level.wordsCount) * 100));

        return {
          ...level,
          discovered: total,
          learned,
          learning,
          percent,
        };
      }),
    [vocabulary]
  );

  const stats = progress || {
    currentStreak: 0,
    longestStreak: 0,
    totalStudyMinutes: 0,
    lessonsCompleted: 0,
    wordsLearned: 0,
    speakingMinutes: 0,
    conversationsCompleted: 0,
  };

  const badges = [
    {
      title: 'Khởi đầu',
      desc: 'Hoàn thành ít nhất 1 hoạt động học',
      unlocked: stats.totalStudyMinutes > 0,
      icon: '🌱',
    },
    {
      title: 'Chiến binh 7 ngày',
      desc: 'Duy trì chuỗi học từ 7 ngày',
      unlocked: stats.longestStreak >= 7,
      icon: '🔥',
    },
    {
      title: 'Bạn đồng hành Lina',
      desc: 'Hoàn thành 10 cuộc hội thoại',
      unlocked: stats.conversationsCompleted >= 10,
      icon: '🗣️',
    },
    {
      title: '100 từ vựng',
      desc: 'Nắm vững 100 từ trong flashcard',
      unlocked: vocabulary.filter((word) => word.status === 'learned').length >= 100,
      icon: '📚',
    },
    {
      title: 'HSK mục tiêu',
      desc: 'Đạt ít nhất 80% từ vựng của HSK mục tiêu',
      unlocked:
        Number(String(user.targetHsk).match(/\d+/)?.[0] || 1) <=
        Math.max(...levelStats.filter((item) => item.percent >= 80).map((item) => Number(item.level.replace('HSK ', ''))), 0),
      icon: '🏆',
    },
    {
      title: 'Phát âm chăm chỉ',
      desc: 'Có ít nhất 30 phút luyện nói',
      unlocked: stats.speakingMinutes >= 30,
      icon: '🎙️',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3 text-[#716761]">
        <Loader2 size={20} className="animate-spin" />
        Đang tải tiến độ học tập...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Tiến độ học tập & Thành tựu
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Dữ liệu được lấy từ tiến trình và flashcard riêng của tài khoản này.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Flame, value: `${stats.currentStreak} ngày`, label: 'Chuỗi hiện tại' },
          { icon: BookOpen, value: String(vocabulary.filter((word) => word.status === 'learned').length), label: 'Từ đã nắm vững' },
          { icon: Target, value: user.targetHsk, label: 'Mục tiêu HSK' },
          { icon: Clock, value: `${stats.totalStudyMinutes} phút`, label: 'Tổng thời gian học' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="p-5 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center mb-3">
              <Icon size={21} />
            </div>
            <p className="text-2xl font-black text-[#211A17] dark:text-white">{value}</p>
            <p className="text-xs font-medium text-[#716761] dark:text-[#A89E97]">{label}</p>
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Hoạt động học tập</h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Streak dài nhất: {stats.longestStreak} ngày · {stats.lessonsCompleted} bài học · {stats.conversationsCompleted} hội thoại
            </p>
          </div>
          <TrendingUp className="text-[#E86F51]" size={22} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412]">
            <Clock size={17} className="text-[#E86F51] mb-2" />
            <p className="font-bold text-[#211A17] dark:text-white">{stats.speakingMinutes} phút</p>
            <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Luyện nói</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412]">
            <MessageSquare size={17} className="text-[#D5A85C] mb-2" />
            <p className="font-bold text-[#211A17] dark:text-white">{stats.conversationsCompleted}</p>
            <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Cuộc hội thoại</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#181412]">
            <RotateCcw size={17} className="text-[#65A873] mb-2" />
            <p className="font-bold text-[#211A17] dark:text-white">{vocabulary.filter((word) => word.status === 'learning').length}</p>
            <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Đang ôn</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Tiến độ HSK 1 → HSK 6</h3>
          <p className="text-xs text-[#716761] dark:text-[#A89E97]">
            Tính theo các từ trong flashcard cá nhân đã được đánh dấu “đã nắm vững”.
          </p>
        </div>

        <div className="space-y-5">
          {levelStats.map((item) => (
            <div key={item.level}>
              <div className="flex justify-between gap-3 text-xs font-bold mb-1.5">
                <span className="text-[#211A17] dark:text-white">
                  {item.level}: {item.name}
                </span>
                <span className="text-[#716761] dark:text-[#A89E97]">
                  {item.learned}/{item.wordsCount} · {item.percent}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E86F51] rounded-full transition-all"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[#8A7F78]">
                {item.discovered} từ đã xuất hiện trong flashcard · {item.learning} từ đang học
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-[#D5A85C]" />
          <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Huy hiệu thành tựu</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className={`p-5 rounded-3xl border text-center space-y-2 ${
                badge.unlocked
                  ? 'bg-white dark:bg-[#241F1C] border-[#E86F51]/20 shadow-xs'
                  : 'bg-gray-50/70 dark:bg-[#1C1816]/70 border-gray-200 dark:border-gray-800 opacity-50'
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <h4 className="font-bold text-sm text-[#211A17] dark:text-white">{badge.title}</h4>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{badge.desc}</p>
              <span className="text-[10px] font-bold text-[#E86F51]">
                {badge.unlocked ? 'Đã mở khóa' : 'Chưa mở khóa'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-3xl border border-dashed border-[#E86F51]/30 bg-[#FFF9F4] dark:bg-[#241F1C] flex items-start gap-3">
        <Mic size={18} className="text-[#E86F51] mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-sm text-[#211A17] dark:text-white">Mục tiêu tiếp theo</p>
          <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">
            Hãy tiếp tục luyện nói và ôn các flashcard đang ở trạng thái “đang học” để tăng mức độ thành thạo thực tế.
          </p>
        </div>
      </div>
    </div>
  );
};
