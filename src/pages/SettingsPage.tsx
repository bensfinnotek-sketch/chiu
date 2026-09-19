import React, { useState } from 'react';
import {
  Settings,
  BookOpen,
  Mic,
  Shield,
  User,
  CheckCircle2,
  Trash2,
  LogOut,
  Sparkles,
  Loader2,
  Volume2,
  Clock,
  Globe,
  Database,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { isSupabaseConfigured } from '../database/supabaseClient';

interface SettingsPageProps {
  onNavigate: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, signOut, isGuest, isMockMode } = useAuth();
  const { profile, updateProfile, isLoading } = useUserProfile();

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State initialized from profile
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [hskLevel, setHskLevel] = useState(profile?.hskLevel || 1);
  const [dailyMinutes, setDailyMinutes] = useState(profile?.dailyMinutes || 15);
  const [showPinyin, setShowPinyin] = useState(profile?.showPinyin ?? true);
  const [showTranslation, setShowTranslation] = useState(profile?.showTranslation ?? true);
  const [speechSpeed, setSpeechSpeed] = useState(profile?.speechSpeed || 1.0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateProfile({
        displayName,
        hskLevel,
        dailyMinutes,
        showPinyin,
        showTranslation,
        speechSpeed,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  const handleClearLocalData = () => {
    if (window.confirm('Bạn có chắc muốn xóa bộ nhớ đệm cục bộ không?')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('hanzi_ai_') || k.startsWith('speaking_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      alert('Đã dọn sạch bộ nhớ đệm cục bộ!');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#201A17] p-6 rounded-3xl border border-[#E86F51]/15 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#211A17] dark:text-white">Cài đặt ứng dụng ⚙️</h1>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Tùy chỉnh lộ trình học, giọng nói AI, bảo mật và tài khoản cá nhân.
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">
          <Database size={14} />
          <span>{isSupabaseConfigured && user ? 'Đã đồng bộ Cloud' : 'Bộ nhớ cục bộ (Local)'}</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-fade-in">
          <CheckCircle2 size={18} />
          <span>Cài đặt của bạn đã được lưu thành công!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: LEARNING PREFERENCES */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EDE4DB] dark:border-[#382E27]">
            <BookOpen size={18} className="text-[#E86F51]" />
            <h2 className="text-base font-bold text-[#211A17] dark:text-white">Cài đặt học tập (Learning)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Cấp độ HSK mục tiêu
              </label>
              <select
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
              >
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    HSK {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Mục tiêu thời gian mỗi ngày
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
              >
                <option value={5}>5 phút / ngày</option>
                <option value={10}>10 phút / ngày</option>
                <option value={15}>15 phút / ngày (Tiêu chuẩn)</option>
                <option value={30}>30 phút / ngày</option>
                <option value={45}>45 phút / ngày</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF6F2] dark:bg-[#29201B] cursor-pointer">
              <div>
                <p className="text-sm font-bold text-[#211A17] dark:text-white">Hiển thị Pinyin</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                  Hiện phiên âm Latinh bên trên chữ Hán trong bài học và hội thoại
                </p>
              </div>
              <input
                type="checkbox"
                checked={showPinyin}
                onChange={(e) => setShowPinyin(e.target.checked)}
                className="w-5 h-5 accent-[#E86F51] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF6F2] dark:bg-[#29201B] cursor-pointer">
              <div>
                <p className="text-sm font-bold text-[#211A17] dark:text-white">Hiển thị Bản dịch nghĩa</p>
                <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                  Tự động hiển thị giải nghĩa tiếng Việt cho câu nói của Lina
                </p>
              </div>
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="w-5 h-5 accent-[#E86F51] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* SECTION 2: SPEAKING & VOICE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EDE4DB] dark:border-[#382E27]">
            <Mic size={18} className="text-[#E86F51]" />
            <h2 className="text-base font-bold text-[#211A17] dark:text-white">Giọng đọc & Luyện nói (Speaking)</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#211A17] dark:text-[#EAE2DA]">
                  Tốc độ phát âm của cô giáo Lina
                </label>
                <span className="text-xs font-extrabold text-[#E86F51]">{speechSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#E86F51] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#8C8078]">
                <span>0.75x (Chậm, rõ chữ)</span>
                <span>1.0x (Tự nhiên)</span>
                <span>1.25x (Thành thạo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ACCOUNT & PROFILE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EDE4DB] dark:border-[#382E27]">
            <User size={18} className="text-[#E86F51]" />
            <h2 className="text-base font-bold text-[#211A17] dark:text-white">Tài khoản cá nhân</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#211A17] dark:text-[#EAE2DA] mb-1.5">
                Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'Khách vãng lai (Guest)'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#EDE7E1] dark:bg-[#241E1A] border border-[#E5DAD0] dark:border-[#3E322A] text-sm text-[#716761] dark:text-[#8C8078] cursor-not-allowed"
              />
            </div>
          </div>

          {isGuest && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Bạn đang ở chế độ Khách (Guest)
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Đăng ký hoặc đăng nhập để lưu tiến độ học vĩnh viễn và đồng bộ đa thiết bị.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-3.5 py-2 rounded-xl bg-[#E86F51] text-white text-xs font-bold shrink-0 hover:bg-[#d85f41] cursor-pointer"
              >
                Tạo tài khoản
              </button>
            </div>
          )}
        </div>

        {/* SECTION 4: PRIVACY & SYSTEM CACHE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EDE4DB] dark:border-[#382E27]">
            <Shield size={18} className="text-[#E86F51]" />
            <h2 className="text-base font-bold text-[#211A17] dark:text-white">Quyền riêng tư & Bộ nhớ đệm</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-sm font-bold text-[#211A17] dark:text-white">Xóa bộ nhớ đệm cục bộ</p>
              <p className="text-xs text-[#716761] dark:text-[#A89E97]">
                Đặt lại các file cache và phiên học tạm thời trên trình duyệt này
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearLocalData}
              className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Xóa bộ nhớ đệm</span>
            </button>
          </div>
        </div>

        {/* Submit & Sign out bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 text-[#716761] dark:text-[#A89E97] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Đăng xuất khỏi tài khoản</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-sm font-bold shadow-md shadow-[#E86F51]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Lưu tất cả cài đặt</span>
                <CheckCircle2 size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
