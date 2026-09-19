import React, { useState } from 'react';
import { X, Send, Sparkles, Volume2, Bot } from 'lucide-react';
import { LinaAvatar } from './common/LinaAvatar';
import { geminiService } from '../services/geminiService';
import { voiceService } from '../services/voiceService';

interface LinaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonContext?: {
    lessonTitle: string;
    level: string;
    vocabulary?: string[];
  };
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  pinyin?: string;
  vi?: string;
}

export const LinaChatModal: React.FC<LinaChatModalProps> = ({
  isOpen,
  onClose,
  lessonContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `你好！我是Lina老师。Hôm nay chúng ta đang học bài: "${lessonContext?.lessonTitle || 'Bài học HSK'}". Em có câu hỏi gì về ngữ pháp, cách phát âm hoặc muốn thực hành cùng cô không?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const prompt = `Bạn là cô giáo Lina, giáo viên tiếng Trung chuẩn Bắc Kinh, thân thiện, kiên nhẫn.
Học viên đang hỏi trong bối cảnh bài học: "${lessonContext?.lessonTitle || 'HSK'} (${lessonContext?.level || 'HSK 1'})".
Từ vựng trong bài: ${lessonContext?.vocabulary?.join(', ') || 'Cơ bản'}.

Câu hỏi của học viên: "${userText}"

Hãy trả lời ngắn gọn, chuẩn mực, khích lệ học viên. Nếu có tiếng Trung, hãy kèm pinyin và dịch nghĩa tiếng Việt dễ hiểu.`;

      const response = await geminiService.generateText(prompt);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response || 'Lina đang lắng nghe em, em có thể hỏi lại được không?',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Lina chưa nghe rõ, mạng có chút gián đoạn. Em thử hỏi lại nhé!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    voiceService.speakText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#241F1C] border border-[#E86F51]/20 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="p-4 bg-[#FFF9F4] dark:bg-[#1E1917] border-b border-[#E86F51]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LinaAvatar size="sm" isSpeaking={isLoading} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#211A17] dark:text-white">Lina 老师</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E86F51]/10 text-[#E86F51]">
                  AI Tutor
                </span>
              </div>
              <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">
                Trợ giảng bám sát bài: {lessonContext?.lessonTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#E86F51] text-white rounded-tr-none'
                    : 'bg-[#FFFDFB] dark:bg-[#2A2320] border border-[#E86F51]/15 text-[#211A17] dark:text-[#F7F2EE] rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => speak(m.text)}
                    className="mt-2 text-[#E86F51] hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                  >
                    <Volume2 size={13} />
                    <span>Nghe đọc</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#E86F51] font-semibold animate-pulse">
              <Sparkles size={14} />
              <span>Lina 老师 đang soạn câu trả lời...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 bg-[#FFF9F4] dark:bg-[#1E1917] border-t border-[#E86F51]/15 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi Lina về phát âm, ngữ pháp bài này..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/20 text-xs text-[#211A17] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E86F51]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-[#E86F51] text-white disabled:opacity-40 hover:bg-[#D35B3E] transition-all cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
