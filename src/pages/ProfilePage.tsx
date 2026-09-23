import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Target,
  Clock,
  Crown,
  Sparkles,
  Save,
  CheckCircle2,
  LogOut,
  Settings,
  Flame,
  BookOpen,
  Award,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile as LegacyUserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDashboardData } from '../hooks/useDashboardData';
import { useSubscription } from '../hooks/useSubscription';

interface ProfilePageProps {
  user?: LegacyUserProfile;
  onUpdateUser?: (u: LegacyUserProfile) => void;
  onOpenPricing: () => void;
  onNavigate?: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user: legacyUser,
  onUpdateUser,
  onOpenPricing,
  onNavigate,
}) => {
  const { user: authUser, signOut, isGuest } = useAuth();
  const { profile, updateProfile, isLoading: profileLoading } = useUserProfile();
  const { progress } = useDashboardData();
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();

  const [name, setName] = useState('');
  const [hskLevel, setHskLevel] = useState(1);
  const [goal, setGoal] = useState('conversation');
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || authUser?.displayName || 'Learner');
      setHskLevel(profile.hskLevel || 1);
      setGoal(profile.learningGoal || 'conversation');
      setDailyMinutes(profile.dailyMinutes || 15);
    } else if (legacyUser) {
      setName(legacyUser.name);
      setHskLevel(parseInt(legacyUser.chineseLevel.replace(/\D/g, ''), 10) || 1);
      setDailyMinutes(legacyUser.dailyMinutes);
    }
  }, [profile, legacyUser, authUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      if (profile) {
        await updateProfile({
          displayName: name,
          hskLevel,
          learningGoal: goal as any,
          dailyMinutes,
        });
      }

      if (legacyUser && onUpdateUser) {
        onUpdateUser({
          ...legacyUser,
          name,
          chineseLevel: `HSK ${hskLevel}` as any,
          dailyMinutes,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (onNavigate) onNavigate('home');
  };

  const streakDays = progress?.currentStreak ?? legacyUser?.streakDays ?? 1;
  const wordsLearned = progress?.wordsLearned ?? legacyUser?.wordsLearned ?? 38;
  const displayIsPremium = authUser ? isPremium : (legacyUser?.isPremium ?? false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#211A17] dark:text-white tracking-tight">
            Hồ sơ & Tiến độ học tập 👤
          </h1>
          <p className="text-sm text-[#716761] dark:text-[#A89E97]">
            Thông tin cá nhân, mục tiêu HSK và kết quả luyện nói được lưu trữ đám mây.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-white dark:bg-[#201A17] border border-[#E86F51]/20 text-xs font-bold text-[#211A17] dark:text-white hover:bg-[#FAF6F2] dark:hover:bg-[#2C231E] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Settings size={15} />
            <span>Cài đặt hệ thống</span>
          </button>
        )}
      </div>

      {/* Membership Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF5F1] to-white dark:from-[#2B231F] dark:to-[#241F1C] border border-[#E86F51]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-[#E86F51]/25">
            {name ? name.charAt(0).toUpperCase() : 'H'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#211A17] dark:text-white">{name || 'Học viên'}</h2>
              {displayIsPremium ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown size={12} className="fill-amber-600" />
                  <span>PRO</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[#716761] dark:text-[#A89E97] text-[10px] font-bold">
                  {isGuest ? 'Khách' : subscriptionLoading ? 'Đang tải gói…' : 'Miễn phí'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              {authUser?.email || legacyUser?.email || 'Chế độ khách (Chưa liên kết email)'}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-semibold text-[#E86F51] bg-[#FFF0EB] dark:bg-[#342822] px-2 py-0.5 rounded-md">
                HSK {hskLevel}
              </span>
              <span className="text-[11px] text-[#716761] dark:text-[#A89E97]">
                Mục tiêu: {dailyMinutes} phút/ngày
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isPremium ? (
            <button
              type="button"
              onClick={onOpenPricing}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D5A85C] to-[#E5BE79] text-white font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown size={15} />
              <span>Nâng cấp Pro</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200">
              Đã kích hoạt Pro trọn đời
            </div>
          )}

          {authUser && (
            <button
              type="button"
              onClick={handleSignOut}
              className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-[#716761] dark:text-[#A89E97] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Learning Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <Flame size={18} className="fill-orange-500" />
          </div>
          <p className="text-xl font-black text-[#211A17] dark:text-white">{streakDays} ngày</p>
          <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Chuỗi học liên tục</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <p className="text-xl font-black text-[#211A17] dark:text-white">{wordsLearned}</p>
          <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Từ vựng đã thuộc</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <p className="text-xl font-black text-[#211A17] dark:text-white">
            {progress?.totalStudyMinutes ?? 45} phút
          </p>
          <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Tổng thời gian học</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#201A17] border border-[#E86F51]/10 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
            <Award size={18} />
          </div>
          <p className="text-xl font-black text-[#211A17] dark:text-white">
            {progress?.conversationsCompleted ?? 2} buổi
          </p>
          <p className="text-[11px] text-[#716761] dark:text-[#A89E97]">Hội thoại cùng Lina</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-[#201A17] rounded-3xl p-6 sm:p-8 border border-[#E86F51]/15 shadow-sm space-y-6"
      >
        <h3 className="text-lg font-bold text-[#211A17] dark:text-white">Thiết lập mục tiêu cá nhân</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#716761] dark:text-[#A89E97] mb-1.5">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-semibold text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#716761] dark:text-[#A89E97] mb-1.5">
                Cấp độ HSK hiện tại
              </label>
              <select
                value={hskLevel}
                onChange={(e) => setHskLevel(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-semibold text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
              >
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#716761] dark:text-[#A89E97] mb-1.5">
                Mục tiêu học chính
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#28211C] border border-[#E5DAD0] dark:border-[#3E322A] text-sm font-semibold text-[#211A17] dark:text-white focus:outline-none focus:border-[#E86F51]"
              >
                <option value="conversation">Giao tiếp đời sống</option>
                <option value="travel">Du lịch & Khám phá</option>
                <option value="work">Công việc & Thương mại</option>
                <option value="exam">Luyện thi HSK / HSKK</option>
                <option value="culture">Văn hóa & Phim ảnh</option>
                <option value="general">Học vì sở thích</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#716761] dark:text-[#A89E97]">
                Thời gian học mỗi ngày: {dailyMinutes} phút
              </label>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              className="w-full accent-[#E86F51] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#716761] dark:text-[#A89E97] mt-1">
              <span>5 phút</span>
              <span>15 phút (Khuyên dùng)</span>
              <span>60 phút</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#EDE4DB] dark:border-[#382E27]">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={16} />
              <span>Đã lưu hồ sơ thành công!</span>
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="ml-auto px-6 py-2.5 rounded-2xl bg-[#E86F51] text-white font-bold text-xs shadow-md shadow-[#E86F51]/25 hover:bg-[#d85f41] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
