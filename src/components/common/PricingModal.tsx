import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Modal } from './Modal';
import { UserProfile } from '../../types';
import { storageService } from '../../services/storageService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpgradeSuccess: (updated: UserProfile) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
}) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updated: UserProfile = {
        ...user,
        isPremium: true,
      };
      storageService.saveUserProfile(updated);
      onUpgradeSuccess(updated);
      setIsProcessing(false);
      onClose();
    }, 900);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-6 text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#D5A85C] to-[#E5BE79] text-white flex items-center justify-center mx-auto shadow-md">
            <Crown size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#211A17] dark:text-white">
            Nâng cấp HanziAI Pro
          </h2>
          <p className="text-xs sm:text-sm text-[#716761] dark:text-[#A89E97] max-w-md mx-auto">
            Mở khóa trọn vẹn sức mạnh AI để giao tiếp tiếng Trung tự tin và tự nhiên nhất
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-[#181412] text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              !isAnnual ? 'bg-white dark:bg-[#241F1C] text-[#211A17] dark:text-white shadow-xs' : 'text-[#716761]'
            }`}
          >
            Hàng tháng
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              isAnnual ? 'bg-[#E86F51] text-white shadow-xs' : 'text-[#716761]'
            }`}
          >
            <span>Hàng năm</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold">
              Tiết kiệm 40%
            </span>
          </button>
        </div>

        {/* Plan Comparisons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          {/* Free Plan */}
          <div className="p-6 rounded-3xl bg-[#FFF9F4] dark:bg-[#1C1816] border border-gray-200 dark:border-white/10 space-y-4">
            <div>
              <h3 className="font-bold text-base text-[#211A17] dark:text-white">Gói Miễn phí</h3>
              <p className="text-xs text-[#716761]">Cơ bản cho người mới bắt đầu</p>
              <p className="text-2xl font-black text-[#211A17] dark:text-white mt-2">0đ</p>
            </div>

            <ul className="space-y-2 text-xs text-[#716761] dark:text-[#A89E97]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Lộ trình cơ bản HSK 1</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>5 phút trò chuyện AI mỗi ngày</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Thẻ nhớ Spaced Repetition cơ bản</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Tra cứu từ điển Hán ngữ</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-white to-[#FFF5F1] dark:from-[#2A2320] dark:to-[#241F1C] border-2 border-[#E86F51] shadow-lg relative space-y-4">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#E86F51] text-white text-[10px] font-black uppercase tracking-wider">
              Khuyên dùng
            </span>

            <div>
              <h3 className="font-bold text-base text-[#E86F51]">HanziAI Pro Unlimited</h3>
              <p className="text-xs text-[#716761]">Không giới hạn mọi tính năng</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#211A17] dark:text-white">
                  {isAnnual ? '79.000đ' : '129.000đ'}
                </span>
                <span className="text-xs text-[#716761]">/tháng</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[#211A17] dark:text-[#F7F2EE]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#E86F51] shrink-0" />
                <strong className="font-semibold">Hội thoại không giới hạn với Lina</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#E86F51] shrink-0" />
                <span>Toàn bộ giáo trình HSK 1 đến HSK 6</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#E86F51] shrink-0" />
                <span>Chấm điểm và phân tích ngữ điệu chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#E86F51] shrink-0" />
                <span>Trọn bộ đề thi thử HSK có lời giải chi tiết</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#E86F51] shrink-0" />
                <span>Học ngoại tuyến & tải audio bài học</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isProcessing || user.isPremium}
              className="w-full py-3.5 rounded-2xl bg-[#E86F51] text-white font-extrabold text-xs shadow-md shadow-[#E86F51]/30 hover:bg-[#d85f41] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>
                {user.isPremium
                  ? 'Gói Pro đang kích hoạt'
                  : isProcessing
                  ? 'Đang kích hoạt...'
                  : 'Nâng cấp HanziAI Pro ngay'}
              </span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">
          Hỗ trợ thanh toán an toàn qua Chuyển khoản QR Momo / Ngân hàng / Thẻ quốc tế. Hủy gia hạn bất cứ lúc nào chỉ với 1 cú click.
        </p>
      </div>
    </Modal>
  );
};
