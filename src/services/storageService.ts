import { UserProfile, ConversationMessage, VocabularyItem, SupportedLanguage } from '../types';
import { INITIAL_FLASHCARDS } from '../data/hskData';

const USER_KEY = 'hanziai_user_profile';
const SAVED_WORDS_KEY = 'hanziai_saved_words';
const CONVERSATION_KEY = 'hanziai_conversation_history';
const COMPLETED_LESSONS_KEY = 'hanziai_completed_lessons';
const LANG_KEY = 'hanziai_lang';
const THEME_KEY = 'hanziai_theme';

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }

    const defaultProfile: UserProfile = {
      id: 'usr-1',
      name: 'Minh',
      email: 'minh.nguyen@example.com',
      chineseLevel: 'HSK 2',
      targetHsk: 'HSK 4',
      learningGoal: 'conversation',
      dailyMinutes: 20,
      nativeLanguage: 'vi',
      streakDays: 7,
      wordsLearned: 126,
      minutesLearnedToday: 18,
      isPremium: false,
      joinedDate: '2026-02-10',
    };
    return defaultProfile;
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  },

  getSavedWords(): VocabularyItem[] {
    try {
      const stored = localStorage.getItem(SAVED_WORDS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_FLASHCARDS;
  },

  saveWords(words: VocabularyItem[]): void {
    try {
      localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(words));
    } catch (e) {
      console.error(e);
    }
  },

  getCompletedLessons(): string[] {
    try {
      const stored = localStorage.getItem(COMPLETED_LESSONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return ['hsk1-l1', 'hsk1-l2', 'hsk1-l3', 'hsk1-l4'];
  },

  markLessonCompleted(lessonId: string): string[] {
    const list = this.getCompletedLessons();
    if (!list.includes(lessonId)) {
      list.push(lessonId);
      try {
        localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }
    }
    return list;
  },

  getConversationHistory(): ConversationMessage[] {
    try {
      const stored = localStorage.getItem(CONVERSATION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'msg-init-1',
        sender: 'lina',
        chinese: '你好！我是Lina，你的AI中文老师。今天想和我聊些什么呢？',
        pinyin: 'Nǐ hǎo! Wǒ shì Lina, nǐ de AI zhōngwén lǎoshī. Jīntiān xiǎng hé wǒ liáo xiē shénme ne?',
        translation: 'Xin chào! Mình là Lina, giáo viên tiếng Trung AI của bạn. Hôm nay bạn muốn trò chuyện về chủ đề gì nào?',
        timestamp: '10:00 AM',
      },
    ];
  },

  saveConversationHistory(messages: ConversationMessage[]): void {
    try {
      localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  },

  getLanguage(): SupportedLanguage {
    try {
      return (localStorage.getItem(LANG_KEY) as SupportedLanguage) || 'vi';
    } catch {
      return 'vi';
    }
  },

  setLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      console.error(e);
    }
  },

  getTheme(): 'light' | 'dark' {
    try {
      return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error(e);
    }
  },
};
