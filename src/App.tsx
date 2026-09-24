import React, { useState, useEffect } from 'react';
import { UserProfile, SupportedLanguage } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { PricingModal } from './components/common/PricingModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { checkHasGuestData } from './services/migration/guestMigration';
import { GuestMigrationModal } from './components/auth/GuestMigrationModal';

// Pages
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { CurriculumLearnPage } from './pages/CurriculumLearnPage';
import { CurriculumLessonViewer } from './pages/CurriculumLessonViewer';
import { LessonsPage } from './pages/LessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { AiConversationPage } from './pages/AiConversationPage';
import { SpeakingPracticePage } from './pages/SpeakingPracticePage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { DailyReviewPage } from './pages/DailyReviewPage';
import { ToolsHubPage } from './pages/ToolsHubPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { TranslatorPage } from './pages/TranslatorPage';
import { MusicPage } from './pages/MusicPage';
import { HskTestPage } from './pages/HskTestPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';

// New Cloud Auth & History Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ConversationsHistoryPage } from './pages/ConversationsHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('hsk1-l1');
  const [requestedHskLevel, setRequestedHskLevel] = useState<number | undefined>(undefined);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserProfile>(storageService.getUserProfile());
  const [language, setLanguage] = useState<SupportedLanguage>(storageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(storageService.getTheme());
  const [pricingModalOpen, setPricingModalOpen] = useState<boolean>(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Sync profile display name when auth changes
  useEffect(() => {
    if (authUser?.displayName) {
      setUser((prev) => ({ ...prev, name: authUser.displayName || prev.name }));
    }
  }, [authUser]);

  // Check URL hash for direct routing (e.g., #reset-password, #login)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['login', 'register', 'forgot-password', 'reset-password', 'onboarding', 'conversations', 'settings'].includes(hash)) {
      setCurrentRoute(hash);
    }
  }, []);

  // Detect if newly logged in user has guest data to migrate
  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkHasGuestData().then((hasData) => {
        if (hasData) {
          setGuestModalOpen(true);
        }
      });
    }
  }, [isAuthenticated, authUser]);

  // Apply theme to html root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.setTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    storageService.setLanguage(lang);
  };

  const handleNavigate = (route: string, param?: string) => {
    if (route === 'learn' && param?.startsWith('level:')) {
      const level = Number(param.slice('level:'.length));
      if (Number.isInteger(level) && level >= 1 && level <= 6) {
        setRequestedHskLevel(level);
      }
    }
    if (route === 'learn-detail' && param) {
      setSelectedLessonId(param);
    }
    if (route === 'practice-conversation' && param) {
      setSelectedSessionId(param);
    } else if (route === 'practice-conversation' && !param) {
      setSelectedSessionId(undefined);
    }
    setCurrentRoute(route);
    window.location.hash = route === 'home' ? '' : route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resume conversation handler from history
  const handleResumeConversation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentRoute('practice-conversation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check for custom navigation events
  useEffect(() => {
    const handleCustomNav = (e: any) => {
      if (e.detail?.route) {
        handleNavigate(e.detail.route, e.detail.param);
      }
    };
    window.addEventListener('app_navigate', handleCustomNav);
    return () => window.removeEventListener('app_navigate', handleCustomNav);
  }, []);

  const hideNavbarRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'onboarding'];
  const showNav = !hideNavbarRoutes.includes(currentRoute);

  return (
    <div className="min-h-screen bg-[#FFF9F4] dark:bg-[#181412] text-[#211A17] dark:text-[#F7F2EE] font-sans antialiased transition-colors flex flex-col selection:bg-[#E86F51]/20 selection:text-[#E86F51]">
      {/* Global Header Navbar */}
      {showNav && (
        <Navbar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          language={language}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          user={user}
          onOpenPricing={() => setPricingModalOpen(true)}
        />
      )}

      {/* Main Page Content */}
      <main className="flex-1 pb-20 lg:pb-10">
        <ErrorBoundary>
          {currentRoute === 'home' && (
            <HomePage
              onStartLearning={() => handleNavigate('dashboard')}
              onTryAiConversation={() => handleNavigate('practice-conversation')}
              onNavigate={handleNavigate}
              language={language}
            />
          )}

          {currentRoute === 'dashboard' && (
            <DashboardPage
              user={user}
              onNavigate={handleNavigate}
              language={language}
            />
          )}

          {currentRoute === 'login' && (
            <LoginPage
              onNavigate={handleNavigate}
              onSuccess={() => handleNavigate('dashboard')}
            />
          )}

          {currentRoute === 'register' && (
            <RegisterPage
              onNavigate={handleNavigate}
              onSuccess={() => handleNavigate('onboarding')}
            />
          )}

          {currentRoute === 'forgot-password' && (
            <ForgotPasswordPage onNavigate={handleNavigate} />
          )}

          {currentRoute === 'reset-password' && (
            <ResetPasswordPage onNavigate={handleNavigate} />
          )}

          {currentRoute === 'onboarding' && (
            <OnboardingPage onComplete={() => handleNavigate('dashboard')} />
          )}

          {currentRoute === 'conversations' && (
            <ConversationsHistoryPage
              onNavigate={handleNavigate}
              onResumeConversation={handleResumeConversation}
            />
          )}

          {currentRoute === 'settings' && (
            <SettingsPage onNavigate={handleNavigate} />
          )}

          {currentRoute === 'learn' && (
            <CurriculumLearnPage
              initialLevel={requestedHskLevel}
              onSelectLesson={(id) => handleNavigate('learn-detail', id)}
              onNavigate={handleNavigate}
            />
          )}

          {currentRoute === 'learn-detail' && (
            <CurriculumLessonViewer
              lessonId={selectedLessonId}
              onBack={() => handleNavigate('learn')}
              onNavigate={handleNavigate}
              onNavigateToSpeaking={(topic) => {
                const levelMatch = selectedLessonId.match(/^hsk([1-6])-/i);
                const speakingLevel = levelMatch ? `HSK ${levelMatch[1]}` : 'HSK 1';
                sessionStorage.setItem('selected_speaking_topic', topic);
                sessionStorage.setItem('selected_speaking_level', speakingLevel);
                setSelectedSessionId(undefined);
                handleNavigate('practice-conversation');
              }}
            />
          )}

          {(currentRoute === 'practice' || currentRoute === 'practice-speaking') && (
            <SpeakingPracticePage
              onStartConversation={(topic, level) => {
                sessionStorage.setItem('selected_speaking_topic', topic);
                sessionStorage.setItem('selected_speaking_level', level);
                setSelectedSessionId(undefined);
                handleNavigate('practice-conversation');
              }}
            />
          )}

          {currentRoute === 'practice-conversation' && (
            <AiConversationPage
              selectedSessionId={selectedSessionId}
              onBackToTopics={() => handleNavigate('practice-speaking')}
            />
          )}

          {currentRoute === 'flashcards' && (
            <FlashcardsPage onNavigate={handleNavigate} />
          )}

          {currentRoute === 'review' && (
            <DailyReviewPage onComplete={() => handleNavigate('dashboard')} />
          )}

          {currentRoute === 'tools' && (
            <ToolsHubPage onNavigate={handleNavigate} />
          )}

          {currentRoute === 'dictionary' && (
            <DictionaryPage onBack={() => handleNavigate('tools')} />
          )}

          {currentRoute === 'translator' && (
            <TranslatorPage onBack={() => handleNavigate('tools')} />
          )}

          {currentRoute === 'music' && (
            <MusicPage onBack={() => handleNavigate('tools')} />
          )}

          {currentRoute === 'hsk-test' && (
            <HskTestPage onBack={() => handleNavigate('tools')} />
          )}

          {currentRoute === 'progress' && (
            <ProgressPage user={user} />
          )}

          {currentRoute === 'profile' && (
            <ProfilePage
              user={user}
              onUpdateUser={setUser}
              onOpenPricing={() => setPricingModalOpen(true)}
              onNavigate={handleNavigate}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {showNav && (
        <BottomNav
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          language={language}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        user={user}
      />

      {/* Guest Data Migration Modal */}
      <GuestMigrationModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSuccess={() => setGuestModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
