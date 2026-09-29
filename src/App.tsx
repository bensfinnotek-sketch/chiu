import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { HSKLevelNumber } from './types/curriculum';
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
  const [requestedHskLevel, setRequestedHskLevel] = useState<HSKLevelNumber | undefined>(undefined);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserProfile>(storageService.getUserProfile());
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
      checkHasGuestData(authUser.id).then((hasData) => {
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

  const handleNavigate = (route: string, param?: string) => {
    if (route === 'learn' && param?.startsWith('level:')) {
      const level = Number(param.slice('level:'.length));
      if (Number.isInteger(level) && level >= 1 && level <= 6) {
        setRequestedHskLevel(level as HSKLevelNumber);
      }
    }
    if (route === 'learn-detail' && param) {
      setSelectedLessonId(param);
    }
    if (route === 'practice-conversation' && param) {
      setSelectedSessionId(param);