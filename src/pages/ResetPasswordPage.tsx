import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ResetPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu mới.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#201A17] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-[#211A17] dark:text-white tracking-tight">
            Đặt lại mật khẩu 🔐
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Tạo mật khẩu mới an toàn cho tài khoản HanziAI của bạn.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>Cập nhật mật khẩu thành công!</span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8078]" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8078]" size={16} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Lưu mật khẩu mới</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
