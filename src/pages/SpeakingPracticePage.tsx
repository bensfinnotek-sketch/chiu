import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Coffee,
  UtensilsCrossed,
  Plane,
  Briefcase,
  GraduationCap,
  Users,
  Film,
  ShoppingBag,
  Award,
  MessageCircle,
  Clock,
  Flame,
  ChevronRight,
  BookOpen,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { progressService, SpeakingProgress } from '../services/progressService';
import { storageService } from '../services/storageService';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

interface SpeakingPracticePageProps {
  onStartConversation?: (topicId: string, level: string) => void;
}

export const TOPICS_DATA = [
  {
    id: 'Daily Life',
    titleVi: 'Cuộc sống hàng ngày',
    titleZh: '日常生活',
    icon: Coffee,
    badge: 'Phổ biến nhất',
    color: 'from-[#FF9A8B] to-[#FF6A88]',
    starterQuestion: '你今天打算做什么？',
    starterPinyin: 'Nǐ jīntiān dǎsuàn zuò shénme?',
    starterVi: 'Hôm nay bạn dự định làm gì?',
    sampleWords: ['起床', '上班', '休息', '买东西'],
  },
  {
    id: 'Food',
    titleVi: 'Ẩm thực & Nhà hàng',
    titleZh: '美食与餐厅',
    icon: UtensilsCrossed,
    badge: 'Thú vị',
    color: 'from-[#F6D365] to-[#FDA085]',
    starterQuestion: '你最喜欢吃什么中国菜？',
    starterPinyin: 'Nǐ zuì xǐhuan chī shénme zhōngguó cài?',
    starterVi: 'Bạn thích ăn món Trung Quốc nào nhất?',
    sampleWords: ['点菜', '好吃', '买单', '火锅'],
  },
  {
    id: 'Travel',
    titleVi: 'Du lịch & Di chuyển',
    titleZh: '旅行与出行',
    icon: Plane,
    badge: 'Thực tế',
    color: 'from-[#84FAB0] to-[#8FD3F4]',
    starterQuestion: '你去过中国哪几个城市？',
    starterPinyin: 'Nǐ qù guò zhōngguó nǎ jǐ gè chéngshì?',
    starterVi: 'Bạn đã từng đến những thành phố nào ở Trung Quốc?',
    sampleWords: ['机票', '酒店', '风景', '拍照'],
  },
  {
    id: 'Work',
    titleVi: 'Công việc & Sự nghiệp',
    titleZh: '职场与工作',
    icon: Briefcase,
    badge: 'Hữu ích',
    color: 'from-[#A1C4FD] to-[#C2E9FB]',
    starterQuestion: '你的工作平时忙不忙？',
    starterPinyin: 'Nǐ de gōngzuò píngshí máng bu máng?',
    starterVi: 'Công việc của bạn thường ngày có bận không?',
    sampleWords: ['开会', '同事', '加班', '项目'],
  },
  {
    id: 'School',
    titleVi: 'Trường học & Học tập',
    titleZh: '学校与学习',
    icon: GraduationCap,
    badge: 'Học sinh',
    color: 'from-[#FCCB90] to-[#D57EEB]',
    starterQuestion: '你学中文多长时间了？',
    starterPinyin: 'Nǐ xué zhōngwén duō cháng shíjiān le?',
    starterVi: 'Bạn học tiếng Trung được bao lâu rồi?',
    sampleWords: ['老师', '作业', '考试', '生词'],
  },
  {
    id: 'Family',
    titleVi: 'Gia đình & Bạn bè',
    titleZh: '家庭与朋友',
    icon: Users,
    badge: 'Ấm áp',
    color: 'from-[#FD868C] to-[#FE9A8B]',
    starterQuestion: '你家里有几口人？',
    starterPinyin: 'Nǐ jiā lǐ yǒu jǐ kǒu rén?',
    starterVi: 'Nhà bạn có mấy người?',
    sampleWords: ['父母', '孩子', '朋友', '周末'],
  },
  {
    id: 'Entertainment',
    titleVi: 'Giải trí & Sở thích',
    titleZh: '娱乐与爱好',
    icon: Film,
    badge: 'Thư giãn',
    color: 'from-[#E0C3FC] to-[#8EC5FC]',
    starterQuestion: '你平时喜欢听中文歌吗？',
    starterPinyin: 'Nǐ píngshí xǐhuan tīng zhōngwén gē ma?',
    starterVi: 'Bạn thường có thích nghe nhạc Hoa không?',
    sampleWords: ['电影', '听歌', '运动', '看书'],
  },
  {
    id: 'Shopping',
    titleVi: 'Mua sắm & Giá cả',
    titleZh: '购物与消费',
    icon: ShoppingBag,
    badge: 'Giao tiếp',
    color: 'from-[#FFECD2] to-[#FCB69F]',
    starterQuestion: '这个多少钱一件？可以便宜点吗？',
    starterPinyin: 'Zhège duōshao qián yí jiàn? Kěyǐ piányi diǎn ma?',
    starterVi: 'Cái này bao nhiêu tiền một chiếc? Có bớt được không?',
    sampleWords: ['多少钱', '便宜', '贵', '打折'],
  },
  {
    id: 'HSK Practice',
    titleVi: 'Luyện thi nói HSK',
    titleZh: 'HSK 口语专项',
    icon: Award,
    badge: 'Thi cử',
    color: 'from-[#F093FB] to-[#F5576C]',
    starterQuestion: '请简短介绍一下你最近的一个目标。',
    starterPinyin: 'Qǐng jiǎnduǎn jièshào yíxià nǐ zuìjìn de yí gè mùbiāo.',
    starterVi: 'Hãy giới thiệu ngắn gọn một mục tiêu gần đây của bạn.',
    sampleWords: ['目标', '坚持', '提高', '成功'],
  },
  {
    id: 'Free Conversation',
    titleVi: 'Trò chuyện tự do',
    titleZh: '自由畅聊',
    icon: MessageCircle,
    badge: 'Linh hoạt',
    color: 'from-[#4FACFE] to-[#00F2FE]',
    starterQuestion: '你想和我聊聊什么呢？随便说吧！',
    starterPinyin: 'Nǐ xiǎng hé wǒ liáo liao shénme ne? Suíbiàn shuō ba!',
    starterVi: 'Bạn muốn cùng mình trò chuyện về điều gì? Cứ thoải mái nhé!',
    sampleWords: ['分享', '心情', '想法', '聊天'],
  },
];

export const HSK_LEVEL_DESCRIPTIONS: Record<string, { descVi: string; wordCount: string }> = {
  'HSK 1': { descVi: 'Người mới bắt đầu', wordCount: '150 từ cơ bản' },
  'HSK 2': { descVi: 'Giao tiếp thường nhật', wordCount: '300 từ' },
  'HSK 3': { descVi: 'Hội thoại linh hoạt', wordCount: '600 từ' },
  'HSK 4': { descVi: 'Thảo luận đa dạng chủ đề', wordCount: '1200 từ' },
  'HSK 5': { descVi: 'Thuyết trình & phản xạ nhanh', wordCount: '2500 từ' },
  'HSK 6': { descVi: 'Lưu loát như người bản xứ', wordCount: '5000+ từ' },
};

export const SpeakingPracticePage: React.FC<SpeakingPracticePageProps> = ({
  onStartConversation,
}) => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const localProfile = storageService.getUserProfile();
  const [selectedLevel, setSelectedLevel] = useState<string>(localProfile.chineseLevel || 'HSK 1');
  const [progress, setProgress] = useState<SpeakingProgress>(progressService.getProgress());

  useEffect(() => {
    let cancelled = false;

    const loadCloudProgress = async () => {
      if (authLoading) return;

      if (!authUser || !isSupabaseConfigured || !supabase) {
        setSelectedLevel(localProfile.chineseLevel || 'HSK 1');
        setProgress(progressService.getProgress());
        return;
      }

      try {
        const [{ data: profile, error: profileError }, { data: cloudProgress, error: progressError }] =
          await Promise.all([
            supabase.from('profiles').select('hsk_level').eq('id', authUser.id).maybeSingle(),
            supabase.from('learning_progress').select('*').eq('user_id', authUser.id).maybeSingle(),
          ]);

        if (profileError) throw new Error(profileError.message);
        if (progressError) throw new Error(progressError.message);
        if (cancelled) return;

        setSelectedLevel(profile?.hsk_level ? `HSK ${profile.hsk_level}` : 'HSK 1');

        if (cloudProgress) {
          setProgress({
            speaking_minutes: cloudProgress.speaking_minutes || 0,
            conversation_count: cloudProgress.conversations_completed || 0,
            vocabulary_learned: [],
            corrections_count: 0,
            topics: [],
            last_practice: cloudProgress.last_study_date || '',
            streak: cloudProgress.current_streak || 0,
            session_history: [],
          });
        }
      } catch (error) {
        console.warn('Cloud speaking progress fetch error:', error);
        if (!cancelled) setProgress(progressService.getProgress());
      }
    };

    loadCloudProgress();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, authLoading]);

  const handleSelectTopic = (topicId: string) => {
    if (onStartConversation) {
      onStartConversation(topicId, selectedLevel);
    } else {
      // Fallback: save to sessionStorage and dispatch navigate event
      sessionStorage.setItem('selected_speaking_topic', topicId);
      sessionStorage.setItem('selected_speaking_level', selectedLevel);
      window.location.hash = '#practice-conversation';
      window.dispatchEvent(new CustomEvent('app_navigate', { detail: { route: 'practice-conversation' } }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF5F0] via-[#FFF9F4] to-[#FDF1EB] dark:from-[#231C18] dark:via-[#1D1714] dark:to-[#281F1A] border border-[#F2E5D8] dark:border-[#382D25] p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-xs font-semibold tracking-wide">
              <Sparkles size={14} />
              AI SPEAKING PRACTICE • HANZI AI
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#211A17] dark:text-[#FAF5F1]">
              Luyện nói AI cùng cô Lina
            </h1>

            <p className="text-base sm:text-lg text-[#716761] dark:text-[#BDB2AA] leading-relaxed">
              Talk naturally with your AI Chinese teacher. Trò chuyện trực tiếp bằng giọng nói, nhận diện sửa lỗi tức thì và mở rộng từ vựng phản xạ.
            </p>

            {/* Speaking Stats Highlights */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#211A17] dark:text-[#E8DFD8]">
                <Flame className="w-4 h-4 text-[#E86F51]" />
                <span>Chuỗi {progress.streak} ngày</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#D6C7BC] dark:bg-[#4E3F36]" />
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#211A17] dark:text-[#E8DFD8]">
                <Clock className="w-4 h-4 text-[#D5A85C]" />
                <span>{progress.speaking_minutes} phút đã luyện</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#D6C7BC] dark:bg-[#4E3F36]" />
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#211A17] dark:text-[#E8DFD8]">
                <BookOpen className="w-4 h-4 text-[#65A873]" />
                <span>{progress.vocabulary_learned.length} từ vựng mới</span>
              </div>
            </div>
          </div>

          {/* Lina Teacher Card */}
          <div className="bg-white/80 dark:bg-[#28201B]/80 backdrop-blur-xs rounded-2xl p-5 border border-[#EFE2D5] dark:border-[#3E322A] shadow-md flex flex-col items-center text-center max-w-xs shrink-0">
            <LinaAvatar size="xl" className="mb-3" />
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-base">Cô Lina (Lina 老师)</h3>
              <span className="w-2 h-2 rounded-full bg-[#65A873]" />
            </div>
            <p className="text-xs text-[#E86F51] font-medium mb-2">Giáo viên tiếng Trung AI trực tuyến</p>
            <div className="bg-[#FFF5F0] dark:bg-[#342720] px-3 py-2 rounded-xl text-xs text-[#716761] dark:text-[#C5B9B0] italic mb-3">
              "今天我们聊什么？Hôm nay bạn muốn cùng mình luyện chủ đề nào?"
            </div>
            <button
              type="button"
              onClick={() => handleSelectTopic('Daily Life')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E86F51] to-[#F5A28E] hover:shadow-md hover:shadow-[#E86F51]/20 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Headphones size={16} />
              Vào phòng nói ngay
            </button>
          </div>
        </div>
      </div>

      {/* Level Selector Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#211A17] dark:text-[#FAF5F1]">
              1. Chọn trình độ của bạn (Target Level)
            </h2>
            <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97]">
              Cô Lina sẽ tự động điều chỉnh tốc độ nói và vốn từ vựng phù hợp với mục tiêu của bạn.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#E86F51]/10 text-[#E86F51]">
            Đang chọn: {selectedLevel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.keys(HSK_LEVEL_DESCRIPTIONS).map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const details = HSK_LEVEL_DESCRIPTIONS[lvl];

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#E86F51] text-white border-[#E86F51] shadow-md shadow-[#E86F51]/20 scale-102'
                    : 'bg-white dark:bg-[#201915] border-[#EADCCF] dark:border-[#382E27] text-[#211A17] dark:text-[#E8DFD8] hover:border-[#E86F51]/50 hover:bg-[#FFF9F4] dark:hover:bg-[#28201B]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm sm:text-base">{lvl}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <p className={`text-xs font-medium line-clamp-1 ${isSelected ? 'text-white/90' : 'text-[#716761] dark:text-[#A89E97]'}`}>
                    {details.descVi}
                  </p>
                </div>
                <span className={`text-[11px] mt-2 block ${isSelected ? 'text-white/80' : 'text-[#8C8078] dark:text-[#8C8078]'}`}>
                  {details.wordCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#211A17] dark:text-[#FAF5F1]">
              2. Chọn chủ đề bạn muốn luyện tập (Choose Topic)
            </h2>
            <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97]">
              Chọn bất kỳ chủ đề nào bên dưới để bắt đầu buổi luyện nói 1-1 ngay lập tức.
            </p>
          </div>
          <span className="text-xs text-[#716761] dark:text-[#A89E97] hidden sm:block">
            {TOPICS_DATA.length} chủ đề thực tế
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS_DATA.map((topic) => {
            const Icon = topic.icon;

            return (
              <div
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                className="group relative bg-white dark:bg-[#201915] border border-[#EADCCF] dark:border-[#382E27] rounded-2xl p-5 hover:border-[#E86F51] hover:shadow-lg hover:shadow-[#E86F51]/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Topic Header & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] dark:bg-[#342721] flex items-center justify-center text-[#E86F51] group-hover:scale-110 transition-transform">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#211A17] dark:text-[#FAF5F1]">
                          {topic.titleVi}
                        </h3>
                        <p className="text-xs font-serif text-[#E86F51]">{topic.titleZh}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3E8DE] dark:bg-[#322822] text-[#716761] dark:text-[#B5AAA2]">
                      {topic.badge}
                    </span>
                  </div>

                  {/* Starter Question Preview */}
                  <div className="bg-[#FFF9F4] dark:bg-[#261E1A] p-3 rounded-xl border border-[#F2E5D8] dark:border-[#3A2E26] mb-3">
                    <p className="text-[11px] font-medium text-[#716761] dark:text-[#A89E97] mb-1">
                      Câu hỏi mở đầu:
                    </p>
                    <p className="font-serif font-semibold text-sm text-[#211A17] dark:text-white line-clamp-1">
                      {topic.starterQuestion}
                    </p>
                    <p className="text-[11px] text-[#E86F51] line-clamp-1">{topic.starterPinyin}</p>
                    <p className="text-xs text-[#716761] dark:text-[#B5AAA2] italic line-clamp-1 mt-0.5">
                      "{topic.starterVi}"
                    </p>
                  </div>

                  {/* Vocabulary preview chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {topic.sampleWords.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#F5ECE2] dark:bg-[#2F2520] text-[#554A44] dark:text-[#C5B9B0]"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Launch Action */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F2E5D8] dark:border-[#382E27]">
                  <span className="text-xs font-semibold text-[#E86F51] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Bắt đầu nói
                    <ChevronRight size={14} />
                  </span>
                  <span className="text-[11px] text-[#716761] dark:text-[#A89E97]">
                    Cùng cô Lina ({selectedLevel})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
