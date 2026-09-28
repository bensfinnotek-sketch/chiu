import React, { useState, useRef, useEffect } from 'react';
import {
  Flame, Globe, Sun, Moon, Crown, User, Sparkles, BookOpen, Mic, Layers,
  BarChart3, Menu, X, LogOut, Settings, MessageSquare, ChevronDown,
} from 'lucide-react';
import { SupportedLanguage, UserProfile } from '../../types';
import { UI_TEXTS } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  user: UserProfile;
  onOpenPricing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, language, onLanguageChange, theme, onToggleTheme, user, onOpenPricing }) => {
  const { user: authUser, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXTS[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'learn', label: t.learn, icon: BookOpen },
    { id: 'practice', label: t.practice, icon: Mic },
    { id: 'flashcards', label: t.flashcards, icon: Layers },
    { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
    { id: 'progress', label: t.progress, icon: BarChart3 },
  ];

  const displayName = authUser?.displayName || user.name || 'Học viên';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const themeLabel = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await signOut();
    onNavigate('home');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#181412]/90 border-b border-[#E86F51]/10 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group cursor-pointer focus:outline-none" aria-label="Về trang chủ Bentalk AI">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-[#E86F51]/25 group-hover:scale-105 transition-transform font-chinese">汉</div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xl tracking-tight text-[#211A17] dark:text-white flex items-center gap-1">Bentalk<span className="text-[#E86F51]"> AI</span></span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#716761] dark:text-[#A89E97] hidden sm:inline-block">Speak Naturally</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Điều hướng chính">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-current={isActive ? 'page' : undefined} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isActive ? 'bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] font-semibold shadow-xs' : 'text-[#716761] dark:text-[#A89E97] hover:text-[#211A17] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}><item.icon size={16} className={isActive ? 'text-[#E86F51]' : 'opacity-70'} />{item.label}</button>;
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button type="button" onClick={() => onNavigate('progress')} className="min-h-11 flex items-center gap-1.5 px-2.5 rounded-xl bg-orange-50 dark:bg-[#2C211A] text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-bold border border-orange-200/60 dark:border-orange-900/40 hover:scale-105 transition-transform" title={`${user.streakDays} ngày học liên tiếp`} aria-label={`${user.streakDays} ngày học liên tiếp`}><Flame size={17} className="fill-orange-500 text-orange-500 animate-pulse" /><span>{user.streakDays}</span></button>

          <button type="button" onClick={onOpenPricing} className={`hidden sm:flex min-h-11 items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${user.isPremium ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gradient-to-r from-[#D5A85C] to-[#E5BE79] text-white hover:brightness-105 hover:shadow-md'}`}><Crown size={14} className={user.isPremium ? 'fill-amber-600 text-amber-700' : 'fill-white'} /><span>{user.isPremium ? 'PRO' : 'Upgrade'}</span></button>

          <div className="relative">
            <button type="button" onClick={() => setLangMenuOpen(!langMenuOpen)} className="min-h-11 min-w-11 p-2 rounded-xl text-[#716761] dark:text-[#A89E97] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-1 text-xs font-semibold uppercase" aria-label="Đổi ngôn ngữ" aria-expanded={langMenuOpen}><Globe size={18} /><span className="hidden sm:inline">{language}</span></button>
            {langMenuOpen && <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 dark:border-white/10 shadow-xl py-1.5 z-50" role="menu">
              {([['vi','🇻🇳 Tiếng Việt'],['en','🇬🇧 English'],['zh','🇨🇳 中文 (简体)']] as const).map(([lang,label]) => <button key={lang} type="button" onClick={() => { onLanguageChange(lang); setLangMenuOpen(false); }} className={`w-full min-h-11 px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-[#FFF0EB] dark:hover:bg-[#342822] ${language === lang ? 'text-[#E86F51] font-bold' : 'text-[#211A17] dark:text-white'}`} role="menuitem"><span>{label}</span>{language === lang && '✓'}</button>)}
            </div>}
          </div>

          <button type="button" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel} className="min-h-11 min-w-11 p-2 rounded-xl text-[#716761] dark:text-[#A89E97] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center" aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="min-h-11 flex items-center gap-2 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer" aria-label={`Mở menu tài khoản ${displayName}`} aria-expanded={userDropdownOpen}><div className="w-8 h-8 rounded-full bg-[#E86F51]/15 text-[#E86F51] font-bold flex items-center justify-center border border-[#E86F51]/30 text-sm">{initialLetter}</div><ChevronDown size={14} className="text-[#8C8078] hidden sm:inline" /></button>
            {userDropdownOpen && <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#241F1C] border border-[#E86F51]/10 dark:border-white/10 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800"><p className="text-xs font-bold text-[#211A17] dark:text-white truncate">{displayName}</p><p className="text-[11px] text-[#8C8078] truncate">{authUser?.email}</p></div>
              {[['profile',User,'Hồ sơ học tập'],['conversations',MessageSquare,'Lịch sử hội thoại'],['settings',Settings,'Cài đặt hệ thống']].map(([route,Icon,label]) => <button key={String(route)} type="button" onClick={() => { onNavigate(String(route)); setUserDropdownOpen(false); }} className="w-full min-h-11 px-4 py-2 text-left text-xs font-semibold text-[#211A17] dark:text-white hover:bg-[#FFF0EB] dark:hover:bg-[#342822] flex items-center gap-2 cursor-pointer"><Icon size={15} className="text-[#E86F51]" /><span>{String(label)}</span></button>)}
              <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1"><button type="button" onClick={handleSignOut} className="w-full min-h-11 px-4 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"><LogOut size={15} /><span>Đăng xuất</span></button></div>
            </div>}
          </div> : <div className="flex items-center gap-2"><button type="button" onClick={() => onNavigate('login')} className="min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold text-[#716761] dark:text-[#A89E97] hover:text-[#211A17] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">Đăng nhập</button><button type="button" onClick={() => onNavigate('register')} className="hidden sm:inline-flex min-h-11 px-3.5 py-1.5 rounded-xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">Đăng ký</button></div>}

          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden min-h-11 min-w-11 p-2 rounded-xl text-[#716761] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center" aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {mobileMenuOpen && <div className="lg:hidden border-b border-[#E86F51]/10 dark:border-white/10 bg-white dark:bg-[#181412] px-4 pt-2 pb-4 space-y-1">
        {navItems.map((item) => { const isActive = currentRoute === item.id; return <button key={item.id} type="button" onClick={() => { onNavigate(item.id); closeMobileMenu(); }} aria-current={isActive ? 'page' : undefined} className={`w-full min-h-11 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-[#FFF0EB] dark:bg-[#342822] text-[#E86F51] font-bold' : 'text-[#716761] dark:text-[#A89E97] hover:bg-black/5'}`}><item.icon size={18} className={isActive ? 'text-[#E86F51]' : 'opacity-70'} /><span>{item.label}</span></button>; })}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button type="button" onClick={() => { onToggleTheme(); closeMobileMenu(); }} className="w-full min-h-11 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#716761] dark:text-[#A89E97] hover:bg-[#FFF0EB] dark:hover:bg-[#342822]" aria-pressed={theme === 'dark'}><span className="flex items-center gap-3">{theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#E86F51]" />}<span>{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span></span><span className="text-[10px] font-black px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span></button>
          {isAuthenticated ? <><button type="button" onClick={() => { onNavigate('settings'); closeMobileMenu(); }} className="w-full min-h-11 flex items-center gap-3 px-3.5 py-2 text-sm text-[#716761] dark:text-[#A89E97]"><Settings size={18} /><span>Cài đặt hệ thống</span></button><button type="button" onClick={() => { handleSignOut(); closeMobileMenu(); }} className="w-full min-h-11 flex items-center gap-3 px-3.5 py-2 text-sm text-red-600 dark:text-red-400"><LogOut size={18} /><span>Đăng xuất</span></button></> : <div className="flex gap-2 pt-1"><button type="button" onClick={() => { onNavigate('login'); closeMobileMenu(); }} className="flex-1 min-h-11 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-center">Đăng nhập</button><button type="button" onClick={() => { onNavigate('register'); closeMobileMenu(); }} className="flex-1 min-h-11 py-2 rounded-xl bg-[#E86F51] text-white text-xs font-bold text-center shadow-xs">Đăng ký</button></div>}
          <button type="button" onClick={() => { onOpenPricing(); closeMobileMenu(); }} className="w-full min-h-11 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#D5A85C] to-[#E5BE79] text-white text-sm font-bold shadow-sm"><Crown size={16} /><span>Nâng cấp Bentalk AI Pro</span></button>
        </div>
      </div>}
    </header>
  );
};
