import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Mic,
  Volume2,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Star,
  ChevronDown,
  Layers,
  GraduationCap,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { LinaAvatar } from '../components/common/LinaAvatar';
import { AudioButton } from '../components/common/AudioButton';
import { SupportedLanguage } from '../types';
import { UI_TEXTS } from '../data/translations';

interface HomePageProps {
  onStartLearning: () => void;
  onTryAiConversation: () => void;
  onNavigate: (route: string) => void;
  language: SupportedLanguage;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartLearning,
  onTryAiConversation,
  onNavigate,
  language,
}) => {
  const t = UI_TEXTS[language];
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [heroMicActive, setHeroMicActive] = useState(false);
  const [heroTranscript, setHeroTranscript] = useState('我想要一杯奶茶。');

  const faqs = [
    {
      q: 'HanziAI có miễn phí không?',
      a: 'HanziAI hoàn toàn miễn phí cho tất cả bài học HSK cơ bản, flashcards spaced repetition, tra cứu từ điển và lượt trò chuyện AI hàng ngày. Bạn có thể nâng cấp lên bản Pro để mở khóa hội thoại AI không giới hạn và phân tích phát âm chuyên sâu.',
    },
    {
      q: 'Người hoàn toàn mới bắt đầu (chưa biết gì) có học được không?',
      a: 'Rất phù hợp! Lộ trình HSK 1 của HanziAI được thiết kế tỉ mỉ từ bài học phiên âm Pinyin, các nét chữ Hán cơ bản, chào hỏi thông dụng cho đến những mẫu câu giao tiếp đời sống đầu tiên.',
    },
    {
      q: 'HanziAI hỗ trợ những cấp độ HSK nào?',
      a: 'Hệ thống hỗ trợ toàn diện từ HSK 1 đến HSK 6 theo tiêu chuẩn Hán ngữ quốc tế, bao gồm đầy đủ Từ vựng, Ngữ pháp, Luyện nghe, Đọc hiểu và Hội thoại thực chiến.',
    },
    {
      q: 'Lina sửa phát âm và lỗi sai của tôi như thế nào?',
      a: 'Khi bạn nói hoặc gõ tiếng Trung, AI Teacher Lina sẽ phân tích ngữ pháp, từ vựng và ngữ cảnh. Nếu có lỗi, Lina sẽ hiển thị gợi ý cách nói tự nhiên hơn của người bản xứ kèm lời giải thích ngắn gọn, khích lệ và không tạo áp lực.',
    },
    {
      q: 'Tôi có cần micro để học không?',
      a: 'Bạn có thể sử dụng micro tích hợp sẵn trên điện thoại hoặc máy tính để luyện nói trực tiếp. Nếu ở nơi công cộng ồn ào, bạn vẫn có thể gõ chữ Hán hoặc Pinyin để trò chuyện với Lina bình thường.',
    },
    {
      q: 'Tôi có thể học trên điện thoại được không?',
      a: 'Có! HanziAI được thiết kế tối ưu hóa trải nghiệm dạng ứng dụng di động (Mobile-first PWA), thao tác vuốt chạm mượt mà, nút thu âm to rõ, không bị tràn màn hình.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-[#FFF9F4] via-[#FFF3EC] to-[#FFF9F4] dark:from-[#181412] dark:via-[#211A17] dark:to-[#181412]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C211A] border border-[#E86F51]/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#E86F51] animate-ping" />
                <span className="text-xs font-bold text-[#E86F51] tracking-wide uppercase">
                  AI-Powered Mandarin Speaking
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#211A17] dark:text-white leading-[1.15]">
                Learn Chinese by <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E86F51] via-[#F5A28E] to-[#D5A85C]">
                  actually speaking it.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#716761] dark:text-[#BDB4AE] max-w-2xl font-normal leading-relaxed">
                Practice Mandarin with your personal AI teacher, build real conversations, and follow a personalized HSK learning path.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onStartLearning}
                  className="px-7 py-4 rounded-2xl bg-[#E86F51] text-white font-bold text-base shadow-lg shadow-[#E86F51]/30 hover:bg-[#d85f41] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.startFree}</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={onTryAiConversation}
                  className="px-7 py-4 rounded-2xl bg-white dark:bg-[#241F1C] text-[#211A17] dark:text-white font-bold text-base border-2 border-[#E86F51]/30 hover:border-[#E86F51] hover:bg-[#FFF5F1] dark:hover:bg-[#342822] shadow-xs hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <MessageSquare size={18} className="text-[#E86F51]" />
                  <span>{t.tryAiConversation}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#716761] dark:text-[#A89E97]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#65A873]" />
                  <span>Chuẩn HSK 1–6 quốc tế</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#65A873]" />
                  <span>Phản hồi giọng nói tức thì</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#65A873]" />
                  <span>Miễn phí bắt đầu</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              {/* Floating Vocabulary Card 1 */}
              <div className="absolute -top-4 -left-4 z-20 bg-white dark:bg-[#241F1C] p-3 rounded-2xl shadow-xl border border-[#E86F51]/15 animate-bounce [animation-duration:4s]">
                <div className="flex items-center gap-2.5">
                  <span className="font-chinese text-2xl font-bold text-[#E86F51]">水</span>
                  <div>
                    <p className="text-xs font-bold text-[#211A17] dark:text-white">shuǐ</p>
                    <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">nước (water)</p>
                  </div>
                  <AudioButton text="水" size="sm" />
                </div>
              </div>

              {/* Floating Vocabulary Card 2 */}
              <div className="absolute -bottom-4 -right-4 z-20 bg-white dark:bg-[#241F1C] p-3 rounded-2xl shadow-xl border border-[#E86F51]/15 animate-bounce [animation-duration:5s]">
                <div className="flex items-center gap-2.5">
                  <span className="font-chinese text-2xl font-bold text-[#D5A85C]">好吃</span>
                  <div>
                    <p className="text-xs font-bold text-[#211A17] dark:text-white">hǎochī</p>
                    <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">ngon miệng</p>
                  </div>
                  <AudioButton text="好吃" size="sm" />
                </div>
              </div>

              {/* Main Teacher Lina Card */}
              <div className="w-full max-w-sm bg-white dark:bg-[#241F1C] rounded-3xl p-6 shadow-2xl border border-[#E86F51]/20 relative z-10 space-y-4">
                <div className="flex items-center gap-3.5">
                  <LinaAvatar size="lg" isSpeaking={heroMicActive} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-base text-[#211A17] dark:text-white">Lina 老师</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#E86F51]/10 text-[#E86F51] text-[10px] font-bold">
                        AI Teacher
                      </span>
                    </div>
                    <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                      Patient · Encouraging · Native Accent
                    </p>
                  </div>
                </div>

                {/* Simulated Conversation Bubble */}
                <div className="space-y-3 pt-2">
                  {/* Lina speech */}
                  <div className="bg-[#FFF5F1] dark:bg-[#342822] p-3.5 rounded-2xl rounded-tl-sm border border-[#E86F51]/15 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-chinese text-base font-semibold text-[#211A17] dark:text-white">
                        你好！你想吃什么？
                      </p>
                      <AudioButton text="你好！你想吃什么？" size="sm" />
                    </div>
                    <p className="text-xs text-[#E86F51] font-medium">Nǐ hǎo! Nǐ xiǎng chī shénme?</p>
                    <p className="text-xs text-[#716761] dark:text-[#BDB4AE]">
                      Xin chào! Bạn muốn ăn gì nào?
                    </p>
                  </div>

                  {/* User response simulation */}
                  <div className="bg-[#E86F51] text-white p-3.5 rounded-2xl rounded-tr-sm ml-6 space-y-1 shadow-md shadow-[#E86F51]/20">
                    <p className="font-chinese text-base font-semibold">
                      {heroTranscript}
                    </p>
                    <p className="text-xs text-white/90">Wǒ xiǎng yào yì bēi nǎichá.</p>
                  </div>

                  {/* AI Correction Note */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-xs">
                    <span className="text-[#65A873] font-bold text-sm">✓</span>
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Chuẩn ngữ điệu!</span>
                      <p className="text-emerald-700/90 dark:text-emerald-400 text-[11px]">
                        Cách dùng từ "一杯奶茶" rất tự nhiên và chính xác.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Microphone action bar */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setHeroMicActive(!heroMicActive);
                      if (!heroMicActive) {
                        setHeroTranscript('我想吃牛肉面！(Wǒ xiǎng chī niúròumiàn)');
                      } else {
                        setHeroTranscript('我想要一杯奶茶。');
                      }
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FCE2D8] transition-colors cursor-pointer"
                  >
                    <Mic size={16} className={heroMicActive ? 'animate-bounce text-[#E86F51]' : ''} />
                    <span>{heroMicActive ? 'Đang nói...' : 'Thử nhấn nói tiếng Trung'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-16 bg-white dark:bg-[#181412] border-y border-[#E86F51]/10 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
              Học tiếng Trung hiệu quả gấp 3 lần
            </h2>
            <p className="text-base text-[#716761] dark:text-[#A89E97]">
              Không còn học thuộc lòng thụ động. Với Lina, bạn luyện phản xạ giao tiếp mỗi ngày như đang trò chuyện cùng người bản xứ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#FFF9F4] dark:bg-[#241F1C] p-6 rounded-3xl border border-[#E86F51]/15 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#E86F51]/10 text-[#E86F51] flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-[#211A17] dark:text-white">
                Nói bằng giọng nói thật
              </h3>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                Nhấn mic và cất lời. Web Speech AI nhận diện chuẩn thanh điệu tiếng Trung và phản hồi tức thì với giọng phát âm ấm áp.
              </p>
            </div>

            <div className="bg-[#FFF9F4] dark:bg-[#241F1C] p-6 rounded-3xl border border-[#E86F51]/15 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#D5A85C]/15 text-[#D5A85C] flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-[#211A17] dark:text-white">
                Sửa lỗi nhẹ nhàng, không áp lực
              </h3>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                AI phát hiện lỗi dùng từ, sai ngữ pháp và đưa ra phiên bản tự nhiên nhất của người bản xứ kèm giải thích tiếng Việt.
              </p>
            </div>

            <div className="bg-[#FFF9F4] dark:bg-[#241F1C] p-6 rounded-3xl border border-[#E86F51]/15 space-y-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#65A873]/15 text-[#65A873] flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-[#211A17] dark:text-white">
                Chinh phục chuẩn HSK 1–6
              </h3>
              <p className="text-sm text-[#716761] dark:text-[#A89E97] leading-relaxed">
                Lộ trình bài bản với từ vựng, ngữ pháp, flashcards lặp lại ngắt quãng (SRS) và đề thi thử định kỳ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI TEACHER LINA SHOWCASE */}
      <section className="py-16 bg-[#FFF9F4] dark:bg-[#211A17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white to-[#FFF5F1] dark:from-[#241F1C] dark:to-[#2B231F] rounded-3xl p-8 md:p-12 border border-[#E86F51]/20 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
              <LinaAvatar size="hero" />
              <div>
                <h3 className="text-2xl font-extrabold text-[#211A17] dark:text-white">Lina 老师</h3>
                <p className="text-sm text-[#E86F51] font-bold">Giáo viên tiếng Trung AI của bạn</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#181412] text-xs font-semibold text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10">
                  Thân thiện
                </span>
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#181412] text-xs font-semibold text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10">
                  Kiên nhẫn
                </span>
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#181412] text-xs font-semibold text-[#716761] dark:text-[#A89E97] border border-[#E86F51]/10">
                  Phát âm chuẩn Bắc Kinh
                </span>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <h2 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
                "Học ngoại ngữ là để nói, không phải để sợ sai."
              </h2>
              <p className="text-base text-[#716761] dark:text-[#A89E97] leading-relaxed">
                Nhiều người học tiếng Trung nhiều năm nhưng ngại mở miệng vì sợ phát âm sai 4 thanh điệu hoặc sợ sai ngữ pháp. Lina được huấn luyện riêng biệt để tạo ra một không gian luyện tập an toàn, nơi bạn có thể thoải mái thử nghiệm, nhận lời khuyên chân thành và tiến bộ từng ngày.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/10 space-y-1">
                  <h4 className="font-bold text-sm text-[#211A17] dark:text-white">Tự điều chỉnh theo cấp độ</h4>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                    Nếu bạn ở HSK 1, Lina dùng câu ngắn, từ vựng đơn giản. Khi bạn lên HSK 4+, câu chuyện sẽ sâu sắc hơn.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181412] border border-[#E86F51]/10 space-y-1">
                  <h4 className="font-bold text-sm text-[#211A17] dark:text-white">Có Pinyin & Dịch tiếng Việt</h4>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                    Mỗi câu nói đều đi kèm phiên âm Pinyin chuẩn và dịch nghĩa để bạn không bao giờ bị bối rối.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onTryAiConversation}
                  className="px-6 py-3 rounded-xl bg-[#E86F51] text-white font-bold text-sm shadow-md hover:bg-[#d85f41] transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>Trò chuyện cùng Lina ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HSK ROADMAP SECTION */}
      <section className="py-16 bg-white dark:bg-[#181412]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
              Lộ trình HSK 1 đến HSK 6 toàn diện
            </h2>
            <p className="text-base text-[#716761] dark:text-[#A89E97]">
              Thiết kế bài học có cấu trúc: Mục tiêu, Từ vựng, Phiên âm, Câu ví dụ, Luyện nghe nói, Hội thoại và Trắc nghiệm.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { lvl: 'HSK 1', words: '150 từ', desc: 'Chào hỏi & Đời sống cơ bản', color: 'from-orange-500 to-amber-500' },
              { lvl: 'HSK 2', words: '300 từ', desc: 'Giao tiếp hàng ngày, mua sắm', color: 'from-amber-500 to-yellow-500' },
              { lvl: 'HSK 3', words: '600 từ', desc: 'Du lịch, công việc & biểu đạt', color: 'from-emerald-500 to-teal-500' },
              { lvl: 'HSK 4', words: '1200 từ', desc: 'Thảo luận trôi chảy đa chủ đề', color: 'from-blue-500 to-cyan-500' },
              { lvl: 'HSK 5', words: '2500 từ', desc: 'Đọc báo & xem phim tiếng Trung', color: 'from-indigo-500 to-purple-500' },
              { lvl: 'HSK 6', words: '5000 từ', desc: 'Làm chủ ngôn ngữ chuyên sâu', color: 'from-rose-500 to-pink-500' },
            ].map((item, idx) => (
              <div
                key={item.lvl}
                onClick={() => onNavigate('learn')}
                className="p-5 rounded-3xl bg-[#FFF9F4] dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-xl text-white bg-gradient-to-r ${item.color} mb-3 shadow-xs`}>
                    {item.lvl}
                  </span>
                  <h4 className="font-extrabold text-base text-[#211A17] dark:text-white group-hover:text-[#E86F51] transition-colors">
                    {item.words}
                  </h4>
                  <p className="text-xs text-[#716761] dark:text-[#A89E97] mt-1.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#E86F51] mt-4 flex items-center gap-1">
                  Xem bài học →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TOOL HUB & MUSIC PREVIEW */}
      <section className="py-16 bg-[#FFF9F4] dark:bg-[#211A17] border-t border-[#E86F51]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
              Hệ sinh thái công cụ hỗ trợ người học
            </h2>
            <p className="text-base text-[#716761] dark:text-[#A89E97]">
              Mọi tính năng bạn cần để phát triển toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => onNavigate('dictionary')}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-xl transition-all cursor-pointer space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-[#E86F51] flex items-center justify-center font-bold text-lg font-chinese">
                词
              </div>
              <h3 className="font-bold text-lg text-[#211A17] dark:text-white">Từ điển Hán ngữ AI</h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Tra cứu Hanzi, Pinyin, bộ thủ, số nét, câu ví dụ thực tế và từ vựng liên quan.
              </p>
            </div>

            <div
              onClick={() => onNavigate('translator')}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-xl transition-all cursor-pointer space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-[#D5A85C] flex items-center justify-center font-bold text-lg font-chinese">
                译
              </div>
              <h3 className="font-bold text-lg text-[#211A17] dark:text-white">Dịch AI Đa Ngữ Cảnh</h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Dịch Việt - Trung kèm cách diễn đạt tự nhiên thay thế, biến thể thân mật và trang trọng.
              </p>
            </div>

            <div
              onClick={() => onNavigate('music')}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-xl transition-all cursor-pointer space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-[#65A873] flex items-center justify-center font-bold text-lg font-chinese">
                乐
              </div>
              <h3 className="font-bold text-lg text-[#211A17] dark:text-white">Học qua bài hát</h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Thưởng thức các ca khúc tiếng Trung bất hủ với lời bài hát đồng bộ Pinyin và dịch nghĩa.
              </p>
            </div>

            <div
              onClick={() => onNavigate('hsk-test')}
              className="p-6 rounded-3xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/15 hover:border-[#E86F51] hover:shadow-xl transition-all cursor-pointer space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold text-lg font-chinese">
                考
              </div>
              <h3 className="font-bold text-lg text-[#211A17] dark:text-white">Thi thử HSK Mock Test</h3>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Đánh giá trình độ với đề thi có tính giờ, phân loại câu hỏi và gợi ý lộ trình phù hợp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="py-16 bg-white dark:bg-[#181412]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#211A17] dark:text-white">
              Câu hỏi thường gặp (FAQ)
            </h2>
            <p className="text-sm text-[#716761] dark:text-[#A89E97]">
              Mọi điều bạn muốn biết về việc học tiếng Trung với HanziAI
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-[#E86F51]/15 dark:border-white/10 bg-[#FFF9F4] dark:bg-[#241F1C] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4.5 text-left font-bold text-base text-[#211A17] dark:text-white flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#E86F51] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#716761] dark:text-[#BDB4AE] leading-relaxed border-t border-[#E86F51]/10 dark:border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-20 bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Sẵn sàng tự tin giao tiếp tiếng Trung?
          </h2>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
            Học cùng giáo viên AI Lina ngay hôm nay. Bắt đầu miễn phí và cảm nhận sự tiến bộ sau 10 phút đầu tiên!
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartLearning}
              className="px-8 py-4 rounded-2xl bg-white text-[#E86F51] font-extrabold text-base shadow-xl hover:bg-[#FFF9F4] hover:scale-105 transition-all cursor-pointer"
            >
              Bắt đầu miễn phí ngay
            </button>
            <button
              type="button"
              onClick={onTryAiConversation}
              className="px-8 py-4 rounded-2xl bg-[#211A17] text-white font-bold text-base hover:bg-black transition-all cursor-pointer"
            >
              Thử nói chuyện với Lina
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-12 bg-[#211A17] text-[#A89E97] text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E86F51] flex items-center justify-center text-white font-bold text-base font-chinese">
              汉
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              HanziAI
            </span>
            <span className="text-xs text-[#716761] border-l border-white/10 pl-2">
              Learn Chinese. Speak Naturally.
            </span>
          </div>

          <p className="text-xs text-[#716761]">
            © {new Date().getFullYear()} HanziAI Education Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
