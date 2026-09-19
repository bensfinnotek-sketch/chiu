import React from 'react';
import { Home, BookOpen, Mic, RotateCcw, User } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { UI_TEXTS } from '../../data/translations';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  language: SupportedLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
  language,
}) => {
  const t = UI_TEXTS[language];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'learn', label: t.learn, icon: BookOpen },
    { id: 'practice', label: t.practice, icon: Mic, isCenter: true },
    { id: 'review', label: t.review, icon: RotateCcw },
    { id: 'profile', label: t.profile, icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#181412]/95 backdrop-blur-lg border-t border-[#E86F51]/15 dark:border-white/10 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className="relative -top-3 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-[#E86F51] text-white ring-4 ring-[#E86F51]/20 shadow-[#E86F51]/40'
                    : 'bg-gradient-to-tr from-[#E86F51] to-[#F5A28E] text-white hover:scale-105 shadow-[#E86F51]/30'
                }`}>
                  <Mic size={24} className="stroke-[2.5]" />
                </div>
                <span className={`text-[11px] font-bold mt-1 ${
                  isActive ? 'text-[#E86F51]' : 'text-[#716761] dark:text-[#A89E97]'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#E86F51]'
                  : 'text-[#716761] dark:text-[#A89E97] hover:text-[#211A17] dark:hover:text-white'
              }`}
            >
              <tab.icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
