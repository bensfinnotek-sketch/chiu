import React from 'react';
import {
  BookOpen,
  Languages,
  Music,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ToolsHubPageProps {
  onNavigate: (route: string) => void;
}

export const ToolsHubPage: React.FC<ToolsHubPageProps> = ({ onNavigate }) => {
  const tools = [
    {
      id: 'dictionary',
      title: 'Từ điển Hán ngữ AI',
      subtitle: 'Tra cứu chuyên sâu Hanzi & Pinyin',
      description: 'Tra cứu chữ Hán, bộ thủ, số nét, âm Hán Việt, câu ví dụ kèm phát âm chuẩn.',
      badge: 'HSK 1-6',
      icon: BookOpen,
      color: 'from-orange-500 to-amber-500',
    },
    {
      id: 'translator',
      title: 'Dịch AI Đa Ngữ Cảnh',
      subtitle: 'Dịch Việt ⇄ Trung tự nhiên',
      description: 'Không chỉ dịch nghĩa, AI còn phân tích ngữ cảnh thân mật, trang trọng và gợi ý cách nói chuẩn bản xứ.',
      badge: 'AI Smart',
      icon: Languages,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'music',
      title: 'Học tiếng Trung qua bài hát',
      subtitle: 'Âm nhạc & Lời đồng bộ',
      description: 'Luyện nghe và học từ vựng qua các bản tình ca kinh điển: Ánh trăng hiểu lòng em, Đồng thoại, Sứ thanh hoa...',
      badge: 'Karaoke Lyrics',
      icon: Music,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'hsk-test',
      title: 'Thi thử HSK Mock Test',
      subtitle: 'Đánh giá năng lực chuẩn hóa',
      description: 'Bộ câu hỏi Nghe - Đọc - Ngữ pháp - Từ vựng có tính giờ để xác định cấp độ HSK thực tế của bạn.',
      badge: 'Timed Test',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
          Hộp công cụ hỗ trợ học tập
        </h1>
        <p className="text-sm text-[#716761] dark:text-[#A89E97]">
          Các công cụ thông minh giúp bạn tra cứu, dịch thuật, giải trí và kiểm tra năng lực Hán ngữ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onNavigate(tool.id)}
            className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between gap-6 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center shadow-md`}>
                  <tool.icon size={24} />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] text-xs font-bold">
                  {tool.badge}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#211A17] dark:text-white group-hover:text-[#E86F51] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs font-semibold text-[#D5A85C] mt-0.5">
                  {tool.subtitle}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#E86F51]">
              <span>Mở công cụ</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
