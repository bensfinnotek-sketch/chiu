import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { migrateGuestDataToUser } from '../../services/migration/guestMigration';

interface GuestMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GuestMigrationModal: React.FC<GuestMigrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen || !user) return null;

  const handleMigrate = async () => {
    setLoading(true);
    try {
      await migrateGuestDataToUser(user);
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e) {
      console.warn('Migration failed:', e);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#201A17] max-w-md w-full p-6 rounded-3xl border border-[#E86F51]/20 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-[#211A17] dark:text-white">
            Lưu tiến độ học vào tài khoản của bạn?
          </h3>
          <p className="text-xs text-[#716761] dark:text-[#A89E97] leading-relaxed">
            Chúng tôi nhận thấy bạn đã có bài học và cuộc trò chuyện ở chế độ Khách. Bạn có muốn đồng bộ toàn bộ dữ liệu này vào tài khoản{' '}
            <strong className="text-[#211A17] dark:text-white">{user.email}</strong> để không bị mất?
          </p>
        </div>

        {done ? (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Đã đồng bộ tiến độ thành công!</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-[#716761] dark:text-[#A89E97] hover:bg-black/5 cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleMigrate}
              className="flex-1 py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Đồng ý lưu</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
