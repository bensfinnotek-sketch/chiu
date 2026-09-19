import React from 'react';
import { X, Volume2, Sparkles, Sliders, Check } from 'lucide-react';
import { SpeakingSettings } from '../../services/progressService';

interface SpeakingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SpeakingSettings;
  onSave: (settings: Partial<SpeakingSettings>) => void;
}

export const SpeakingSettingsModal: React.FC<SpeakingSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-[#FFF9F4] dark:bg-[#1E1916] text-[#211A17] dark:text-[#F7F2EE] w-full max-w-md rounded-2xl shadow-2xl border border-[#F0E4D8] dark:border-[#382E28] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E4D8] dark:border-[#382E28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E86F51]/10 flex items-center justify-center text-[#E86F51]">
              <Sliders size={18} />
            </div>
            <h3 className="font-semibold text-lg">Cài đặt luyện nói (Speaking Settings)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#716761] hover:bg-[#F3E8DE] dark:hover:bg-[#2B231F] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Speaking Speed */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] mb-2.5 block">
              Tốc độ nói của cô Lina (Speech Speed)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Chậm (0.8x)', value: 0.8 },
                { label: 'Chuẩn (1.0x)', value: 0.95 },
                { label: 'Tự nhiên (1.2x)', value: 1.15 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSave({ speed: item.value })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    Math.abs(settings.speed - item.value) < 0.1
                      ? 'bg-[#E86F51] text-white border-[#E86F51] shadow-xs'
                      : 'border-[#EADCCF] dark:border-[#3A2F28] hover:bg-[#FFF0EB] dark:hover:bg-[#2F2621]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] mb-2.5 block">
              Độ khó trò chuyện (Conversation Level)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy', title: 'Dễ dàng', desc: 'Từ ngữ ngắn gọn' },
                { id: 'normal', title: 'Tiêu chuẩn', desc: 'Giao tiếp tự nhiên' },
                { id: 'challenge', title: 'Thử thách', desc: 'Câu ghép bản xứ' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onSave({ difficulty: lvl.id as any })}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    settings.difficulty === lvl.id
                      ? 'bg-[#E86F51]/10 border-[#E86F51] text-[#E86F51] font-semibold'
                      : 'border-[#EADCCF] dark:border-[#3A2F28] hover:bg-[#FFF0EB] dark:hover:bg-[#2F2621]'
                  }`}
                >
                  <p className="text-xs">{lvl.title}</p>
                  <p className="text-[10px] opacity-75 font-normal">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Display Toggles */}
          <div className="space-y-3.5 pt-2 border-t border-[#F0E4D8] dark:border-[#382E28]">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] block">
              Hiển thị & Hỗ trợ học tập
            </label>

            {/* Show Pinyin */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Hiện phiên âm Pinyin</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">Hỗ trợ đọc chuẩn thanh điệu</p>
              </div>
              <button
                type="button"
                onClick={() => onSave({ showPinyin: !settings.showPinyin })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.showPinyin ? 'bg-[#E86F51]' : 'bg-[#D6C7BC] dark:bg-[#463932]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.showPinyin ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Show Translation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Hiện nghĩa dịch tiếng Việt</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">Hiểu ngay nội dung hội thoại</p>
              </div>
              <button
                type="button"
                onClick={() => onSave({ showTranslation: !settings.showTranslation })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.showTranslation ? 'bg-[#E86F51]' : 'bg-[#D6C7BC] dark:bg-[#463932]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.showTranslation ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Play AI Audio */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tự động phát giọng cô Lina</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">Tự động đọc to phản hồi tiếng Trung</p>
              </div>
              <button
                type="button"
                onClick={() => onSave({ autoPlayAi: !settings.autoPlayAi })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.autoPlayAi ? 'bg-[#E86F51]' : 'bg-[#D6C7BC] dark:bg-[#463932]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.autoPlayAi ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Listen Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Chế độ tự động mở micro (Auto-Listen)</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">Tự động bật mic khi cô Lina nói xong</p>
              </div>
              <button
                type="button"
                onClick={() => onSave({ autoListen: !settings.autoListen })}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.autoListen ? 'bg-[#E86F51]' : 'bg-[#D6C7BC] dark:bg-[#463932]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.autoListen ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8EFE7] dark:bg-[#261F1B] border-t border-[#F0E4D8] dark:border-[#382E28] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#E86F51] hover:bg-[#D55F42] text-white font-medium text-sm transition-colors cursor-pointer"
          >
            Đã lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
