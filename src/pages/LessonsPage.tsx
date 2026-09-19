import React, { useState } from 'react';
import { CheckCircle2, Lock, Play, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { HSK_LEVELS, ALL_LESSONS } from '../data/hskData';
import { storageService } from '../services/storageService';

interface LessonsPageProps {
  onSelectLesson: (lessonId: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ onSelectLesson }) => {
  const [selectedLevelId, setSelectedLevelId] = useState('hsk-1');
  const completedLessonIds = storageService.getCompletedLessons();

  const currentLevel = HSK_LEVELS.find((l) => l.id === selectedLevelId) || HSK_LEVELS[0];
  const levelLessons = ALL_LESSONS.filter((l) => l.hskLevel === currentLevel.title);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Lộ trình bài học HSK
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Học theo từng cấp độ chuẩn quốc tế với lộ trình toàn diện từ phát âm, từ vựng đến hội thoại thực chiến.
        </p>
      </div>

      {/* Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {HSK_LEVELS.map((level) => {
          const isSelected = level.id === selectedLevelId;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => setSelectedLevelId(level.id)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#E86F51] text-white shadow-md shadow-[#E86F51]/25 scale-102'
                  : 'bg-white dark:bg-[#241F1C] text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/15 hover:border-[#E86F51]'
              }`}
            >
              <span>{level.title}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#342822]'
              }`}>
                {level.wordCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Level Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF5F1] to-white dark:from-[#2A2320] dark:to-[#241F1C] border border-[#E86F51]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#E86F51] uppercase">Cấp độ đang chọn</span>
          <h2 className="text-2xl font-black text-[#211A17] dark:text-white mt-0.5">
            {currentLevel.title} · {currentLevel.descriptionVi}
          </h2>
          <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1">
            Mục tiêu: {currentLevel.targetSummary}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/15 text-center">
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">Tổng bài học</p>
            <p className="text-lg font-extrabold text-[#211A17] dark:text-white">{currentLevel.totalLessons} bài</p>
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#211A17] dark:text-white">Danh sách bài học</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levelLessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            const isLocked = lesson.isLocked && !isCompleted;

            return (
              <div
                key={lesson.id}
                onClick={() => !isLocked && onSelectLesson(lesson.id)}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  isLocked
                    ? 'bg-gray-50/70 dark:bg-[#1C1816]/70 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-[#241F1C] border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg cursor-pointer group'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51]">
                      Bài {lesson.order}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#65A873]">
                        <CheckCircle2 size={16} />
                        <span>Đã hoàn thành</span>
                      </span>
                    ) : isLocked ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                        <Lock size={15} />
                        <span>Chưa mở</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#E86F51] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Học ngay</span>
                        <ChevronRight size={14} />
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-[#211A17] dark:text-white group-hover:text-[#E86F51] transition-colors">
                    {lesson.titleVi}
                  </h4>
                  <p className="text-xs text-[#E86F51] font-medium font-chinese">
                    {lesson.titleZh}
                  </p>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                    {lesson.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-[#716761] dark:text-[#A89E97]">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{lesson.estimatedMinutes} phút</span>
                  </span>
                  <span>{lesson.vocabulary.length} từ mới</span>
                  <span>{lesson.dialogue.length} câu hội thoại</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
