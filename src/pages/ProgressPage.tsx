import React from 'react';
import {
  Flame,
  BookOpen,
  Target,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';

export const ProgressPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const weekDays = [
    { day: 'T2', active: true, minutes: 22 },
    { day: 'T3', active: true, minutes: 25 },
    { day: 'T4', active: true, minutes: 18 },
    { day: 'T5', active: true, minutes: 30 },
    { day: 'T6', active: true, minutes: 20 },
    { day: 'T7', active: true, minutes: 15 },
    { day: 'CN', active: true, minutes: 18 },
  ];

  const badges = [
    { title: 'Khởi đầu rực rỡ', desc: 'Hoàn thành bài học đầu tiên', unlocked: true, icon: '🌱' },
    { title: 'Chiến binh 7 ngày', desc: 'Duy trì chuỗi học 7 ngày', unlocked: true, icon: '🔥' },
    { title: 'Bậc thầy giao tiếp', desc: 'Trò chuyện 50 câu với Lina', unlocked: true, icon: '🗣️' },
    { title: '100 từ vựng cốt lõi', desc: 'Ghi nhớ vững 100 từ HSK', unlocked: true, icon: '📚' },
    { title: 'Chinh phục HSK 2', desc: 'Hoàn thành toàn bộ lộ trình HSK 2', unlocked: false, icon: '🏆' },
    { title: 'Phát âm hoàn hảo', desc: 'Đạt 100 điểm phát âm 5 lần', unlocked: false, icon: '⭐' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Tiến độ học tập & Thành tựu
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Theo dõi hành trình chinh phục tiếng Trung của bạn mỗi ngày
        </p>
      </div>

      {/* Week Activity Heatmap / Bar Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#211A17] dark:text-white">
              Thời gian học trong tuần (Phút)
            </h3>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Tổng cộng tuần này: 148 phút
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            Đạt 105% mục tiêu
          </span>
        </div>

        {/* 7-day Bar chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-40 pt-4 border-b border-gray-100 dark:border-white/5 pb-2">
          {weekDays.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[11px] font-bold text-[#716761]">{item.minutes}m</span>
              <div
                className="w-full max-w-[36px] bg-gradient-to-t from-[#E86F51] to-[#F5A28E] rounded-t-xl transition-all hover:brightness-110"
                style={{ height: `${(item.minutes / 35) * 100}%` }}
              />
              <span className="text-xs font-bold text-[#211A17] dark:text-white">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* HSK Mastery Level Progress */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-[#211A17] dark:text-white">
          Tiến độ hoàn thành theo cấp độ HSK
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-[#211A17] dark:text-white mb-1.5">
              <span>HSK 1: Cơ bản (150 từ vựng)</span>
              <span className="text-emerald-600 font-extrabold">100% Hoàn thành</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#211A17] dark:text-white mb-1.5">
              <span>HSK 2: Giao tiếp đời sống (300 từ vựng)</span>
              <span className="text-[#E86F51] font-extrabold">42% (126 / 300 từ)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#E86F51] rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#716761] mb-1.5">
              <span>HSK 3: Nâng cao trung cấp (600 từ vựng)</span>
              <span>0%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gray-300 dark:bg-gray-700 rounded-full w-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Badges / Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Huy hiệu thành tựu</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-5 rounded-3xl border transition-all text-center space-y-2 ${
                b.unlocked
                  ? 'bg-white dark:bg-[#241F1C] border-[#E86F51]/20 shadow-xs'
                  : 'bg-gray-50/70 dark:bg-[#1C1816]/70 border-gray-200 dark:border-gray-800 opacity-50'
              }`}
            >
              <div className="text-3xl">{b.icon}</div>
              <h4 className="font-bold text-sm text-[#211A17] dark:text-white">{b.title}</h4>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
