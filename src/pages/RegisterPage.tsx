import React, { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RegisterPageProps {
  onNavigate: (route: string) => void;
  onSuccess?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onSuccess }) => {
  const { signInWithGoogle, signUp, continueAsGuest, isMockMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các thông tin.');
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
      await signUp(email, password);
      // New user goes to onboarding!
      onNavigate('onboarding');
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại. Vui lòng thử lại bằng email khác.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onNavigate('onboarding');
    } catch (err: any) {
      setError(err?.message || 'Không thể đăng ký với Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#201A17] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] items-center justify-center text-white font-bold text-2xl shadow-md shadow-[#E86F51]/25 font-chinese mx-auto">
            学
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211A17] dark:text-white tracking-tight">
            Tạo tài khoản mới ✨
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Lưu trữ tiến độ học, đồng bộ đa thiết bị và mở khóa AI speaking cùng Lina.
          </p>
        </div>

        {isMockMode && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Chế độ Demo / Mock Mode</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Bạn có thể tạo tài khoản bất kỳ mà không cần xác thực email thật.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Continue */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#F8F5F2] dark:bg-[#2C231E] hover:bg-[#EFEAE4] dark:hover:bg-[#382E28] text-[#211A17] dark:text-white text-sm font-bold border border-[#E5DAD0] dark:border-[#42352E] transition-all cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-[#E86F51]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Đăng ký với Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#EDE4DB] dark:border-[#382E27] w-full" />
          <span className="bg-white dark:bg-[#201A17] px-3 text-[11px] uppercase font-bold text-[#8C8078] tracking-wider">
            hoặc email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8078]" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
              Mật khẩu (tối thiểu 6 ký tự)
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
              Xác nhận mật khẩu
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
                <span>Bắt đầu học miễn phí</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-[#716761] dark:text-[#A89E97]">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-[#E86F51] font-bold hover:underline cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </p>

          <div className="border-t border-[#EDE4DB] dark:border-[#382E27] pt-3">
            <button
              type="button"
              onClick={() => {
                continueAsGuest();
                onNavigate('dashboard');
              }}
              className="text-xs text-[#716761] dark:text-[#A89E97] hover:text-[#211A17] dark:hover:text-white font-medium underline underline-offset-4 cursor-pointer"
            >
              Học thử không cần tạo tài khoản (Guest Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
