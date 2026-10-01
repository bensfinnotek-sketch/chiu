import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Trash2,
  Sparkles,
  Volume2,
  BookmarkPlus,
  RefreshCw,
  Lightbulb,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  BookOpen,
  StopCircle,
  Edit2,
  Check,
  X,
  VolumeX,
  Brain,
  Cpu,
} from 'lucide-react';
import { ConversationMessage } from '../types';
import type { ConversationMessage as PersistedConversationMessage } from '../types/conversation';
import { useAuth } from '../hooks/useAuth';
import { getConversationRepository } from '../services/repositories/repositoryFactory';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';
import { LinaAvatar, LinaTeacherState } from '../components/common/LinaAvatar';
import { AudioButton } from '../components/common/AudioButton';
import { MicrophoneButton, MicrophoneState } from '../components/common/MicrophoneButton';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speech';
import { geminiSpeakingService } from '../services/geminiSpeakingService';
import type { SpeakingAnalysis, TutorMode } from '../ai/schemas/speakingSchema';
import { progressService, SpeakingSettings } from '../services/progressService';
import { recommendationService } from '../curriculum/recommendationService';
import { getLessonProgressRepository } from '../curriculum/lessonProgressRepository';
import { subscriptionService } from '../services/subscriptionService';
import { flashcardService } from '../services/flashcardService';
import { SpeakingSettingsModal } from '../components/speaking/SpeakingSettingsModal';
import { SessionSummaryModal } from '../components/speaking/SessionSummaryModal';
import {
  ConversationMemory,
  createEmptyMemory,
  updateMemoryWithTurn,
  saveMemoryToStorage,
  clearMemoryFromStorage,
} from '../ai/memory/conversationMemory';

interface AiConversationPageProps {
  onBackToTopics?: () => void;
  initialTopic?: string;
  initialLevel?: string;
  selectedSessionId?: string;
}

export const AiConversationPage: React.FC<AiConversationPageProps> = ({
  onBackToTopics,
  initialTopic,
  initialLevel,
  selectedSessionId,
}) => {
  const { user: authUser, isLoading: authLoading, signInWithGoogle } = useAuth();
  const conversationRepository = getConversationRepository(authUser);
  // Retrieve selected topic and level
  const activeTopic =
    initialTopic ||
    sessionStorage.getItem('selected_speaking_topic') ||
    'Daily Life';

  const userProfile = storageService.getUserProfile();
  const initialSpeakingLevel =
    initialLevel ||
    sessionStorage.getItem('selected_speaking_level') ||
    userProfile.chineseLevel ||
    'HSK 1';
  const [activeLevel, setActiveLevel] = useState<string>(initialSpeakingLevel);

  useEffect(() => {
    setActiveLevel(initialSpeakingLevel);
  }, [initialSpeakingLevel]);

  useEffect(() => {
    void flashcardService.getFlashcards().then((cards) => {
      const now = Date.now();
      const due = cards.filter((card) => !card.next_review_at || new Date(card.next_review_at).getTime() <= now)
        .sort((a, b) => (a.next_review_at || '').localeCompare(b.next_review_at || ''))
        .slice(0, 8).map((card) => card.hanzi);
      const weak = cards.filter((card) => card.status === 'learning' || card.srs_incorrect_count > card.srs_correct_count || card.srs_incorrect_count >= 2)
        .sort((a, b) => b.srs_incorrect_count - a.srs_incorrect_count)
        .slice(0, 8).map((card) => card.hanzi);
      const newWords = cards.filter((card) => card.status === 'new')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8).map((card) => card.hanzi);
      setMemory((previous) => ({ ...previous, srsContext: { due, weak, newWords } }));
    }).catch(() => undefined);
  }, []);

  // Settings & Progress state
  const [settings, setSettings] = useState<SpeakingSettings>(progressService.getSettings());
  useEffect(() => { speechService.setVoice(settings.voice === 'Lina' ? undefined : settings.voice); }, [settings.voice]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>('conversation');

  // Conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [conversationSessionId, setConversationSessionId] = useState<string | null>(selectedSessionId || null);
  const [conversationReady, setConversationReady] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Conversation Memory State (Sections 11-20)
  const [studyCoachContext, setStudyCoachContext] = useState<{ decision: string; reason: string; focus: string; targets: string[]; lesson?: string; scores?: string } | null>(null);

  const [memory, setMemory] = useState<ConversationMemory>(() => {
    return createEmptyMemory(`speaking_${activeTopic}`, activeTopic, activeLevel);
  });
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // Guest AI Speaking limit: 5 minutes per browser speaking session.
  const GUEST_SPEAKING_LIMIT_SECONDS = 5 * 60;
  const GUEST_SPEAKING_STARTED_KEY = 'hanzi_guest_speaking_started_at';
  const [guestRemainingSeconds, setGuestRemainingSeconds] = useState(GUEST_SPEAKING_LIMIT_SECONDS);
  const [guestLimitReached, setGuestLimitReached] = useState(false);

  useEffect(() => {
    if (authLoading || authUser) {
      setGuestLimitReached(false);
      return;
    }

    const existing = Number(localStorage.getItem(GUEST_SPEAKING_STARTED_KEY));
    const startedAt = Number.isFinite(existing) && existing > 0 ? existing : Date.now();
    if (!existing || !Number.isFinite(existing) || existing <= 0) {
      localStorage.setItem(GUEST_SPEAKING_STARTED_KEY, String(startedAt));
    }

    const updateGuestTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const remaining = Math.max(0, GUEST_SPEAKING_LIMIT_SECONDS - elapsed);
      setGuestRemainingSeconds(remaining);
      if (remaining <= 0) {
        setGuestLimitReached(true);
        speechService.stopListening();
        speechService.stopSpeaking();
        setMicState('IDLE');
        setTeacherState('idle');
        setStatusMessage('Bạn đã dùng hết 5 phút AI Speaking miễn phí.');
      }
    };

    updateGuestTimer();
    const intervalId = window.setInterval(updateGuestTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [authLoading, authUser?.id]);

  const guestCanSpeak = Boolean(authUser) || (!authLoading && guestRemainingSeconds > 0 && !guestLimitReached);
  const formattedGuestTime = `${Math.floor(guestRemainingSeconds / 60)}:${String(guestRemainingSeconds % 60).padStart(2, '0')}`;

  // Check backend Gemini API readiness
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHasApiKey(Boolean(data.hasApiKey)))
      .catch(() => setHasApiKey(false));
  }, []);

  // Speech & Teacher status
  const [micState, setMicState] = useState<MicrophoneState>('IDLE');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [teacherState, setTeacherState] = useState<LinaTeacherState>('idle');
  const [statusMessage, setStatusMessage] = useState('Nhấn mic để bắt đầu nói tiếng Trung');
  const [sessionStartTime] = useState<number>(Date.now());
  const [wordsLearnedSession, setWordsLearnedSession] = useState<
    Array<{ hanzi: string; pinyin: string; meaning: string }>
  >([]);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Language Usage Ratings for active session
  const [sessionScores, setSessionScores] = useState({
    clarity: 5,
    grammar: 4,
    vocabulary: 5,
    naturalness: 4,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, teacherState]);

  // Keep Lina synchronized with the learner's current study-plan recommendation.
  useEffect(() => {
    let cancelled = false;
    const loadStudyCoachContext = async () => {
      try {
        const parsedLevel = Number(activeLevel.replace(/[^0-9]/g, '')) || 1;
        const level = Math.min(6, Math.max(1, parsedLevel)) as 1 | 2 | 3 | 4 | 5 | 6;
        const userId = authUser?.id || 'guest-user';
        const repo = getLessonProgressRepository(authUser?.id || null);
        const recommendations = await recommendationService.getRecommendations(userId, level, repo);
        const primary = recommendations[0];
        if (cancelled) return;
        const metadata = primary?.metadata as any;
        const focus = metadata?.diagnosticFocus === 'vocabulary' ? 'từ vựng' : metadata?.diagnosticFocus === 'grammar' ? 'ngữ pháp' : metadata?.diagnosticFocus === 'quiz' ? 'quiz' : 'cân bằng';
        const targets = Array.isArray(metadata?.diagnosticTargetLabels) ? metadata.diagnosticTargetLabels.slice(0, 3) : [];
        setStudyCoachContext(primary ? {
          decision: metadata?.decision || 'learn_lesson',
          reason: metadata?.reason || primary.description || '',
          focus,
          targets,
          lesson: primary.title,
          scores: typeof metadata?.score === 'number' ? 'Điểm gần nhất: ' + metadata.score + '%' : undefined,
        } : null);
      } catch {
        if (!cancelled) setStudyCoachContext(null);
      }
    };
    loadStudyCoachContext();
    return () => { cancelled = true; };
  }, [activeLevel, authUser?.id]);

  // Load an existing conversation or create a new persisted session.
  useEffect(() => {
    let cancelled = false;
    const initialiseConversation = async () => {
      if (authLoading) return;
      setConversationReady(false);
      const persistenceUserId = authUser?.id || 'guest_user';
      try {
        let session = selectedSessionId ? await conversationRepository.getSession(selectedSessionId) : null;
        if (session && session.userId !== persistenceUserId) session = null;
        if (!session) session = await conversationRepository.createSession(persistenceUserId, activeTopic, initialSpeakingLevel, `Trò chuyện về ${activeTopic}`);
        if (cancelled) return;
        setConversationSessionId(session.id);
        const persistedMessages = await conversationRepository.getSessionMessages(session.id);
        if (cancelled) return;
        const toUiMessage = (message: PersistedConversationMessage): ConversationMessage => ({
          id: message.id, sender: message.role === 'user' ? 'user' : 'lina', chinese: message.chinese,
          pinyin: message.pinyin, translation: message.translation,
          timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          correction: message.corrections?.length ? { hasMistake: true, userSentence: message.corrections[0].original,
            naturalVersion: message.corrections[0].corrected, betterChinese: message.corrections[0].corrected,
            explanationVi: message.corrections[0].explanation } : message.role === 'user' ? { hasMistake: false } : undefined,
          detectedVocabulary: message.vocabulary, grammarNote: message.grammarNote || undefined,
          encouragement: message.encouragement, followUpQuestion: message.followUpQuestion, scores: message.scores,
        });
        const loadedMessages = persistedMessages.map(toUiMessage);
        setMessages(loadedMessages);
        setMemory((previous) => ({
          ...previous,
          sessionId: session!.id,
          topic: session!.topic,
          learnerLevel: String(session!.learnerLevel),
          summary: session!.summary || previous.summary,
          keyFacts: session!.keyFacts || previous.keyFacts,
          vocabulary: session!.vocabulary || previous.vocabulary,
          recentMessages: loadedMessages.slice(-12),
        }));
        if (loadedMessages.length === 0) {
          const starter = geminiSpeakingService.getInitialPrompt(activeTopic, initialSpeakingLevel, 'vi');
          const firstMsg: ConversationMessage = { id: `lina-init-${session.id}`, sender: 'lina', chinese: starter.chinese,
            pinyin: starter.pinyin, translation: starter.translation,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setMessages([firstMsg]);
          await conversationRepository.saveMessage(session.id, persistenceUserId, { id: firstMsg.id, sessionId: session.id,
            userId: persistenceUserId, role: 'assistant', chinese: firstMsg.chinese, pinyin: firstMsg.pinyin,
            translation: firstMsg.translation, timestamp: new Date().toISOString() });
          if (settings.autoPlayAi) {
            setTeacherState('speaking');
            setMicState('AI_SPEAKING');
            speechService.speakChinese(starter.chinese, { rate: settings.speed, voice: settings.voice === 'Lina' ? undefined : settings.voice, onEnd: () => {
              setTeacherState('idle'); if (settings.autoListen) handleStartListening();
            }});
          }
        }
      } catch (error) {
        console.error('Error initialising persisted conversation:', error);
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setPersistenceError(`Không thể khởi tạo bộ nhớ hội thoại: ${message}`);
          setConversationSessionId(selectedSessionId || null);
          const starter = geminiSpeakingService.getInitialPrompt(activeTopic, activeLevel, 'vi');
          setMessages([{ id: 'lina-init-fallback', sender: 'lina', chinese: starter.chinese, pinyin: starter.pinyin,
            translation: starter.translation, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        }
      } finally { if (!cancelled) setConversationReady(true); }
    };
    initialiseConversation();
    return () => { cancelled = true; speechService.stopSpeaking(); speechService.abortListening(); };
  }, [activeTopic, initialSpeakingLevel, selectedSessionId, authUser?.id, authLoading]);

  // Stop Lina speech helper (Voice interruption)
  const stopLinaSpeech = useCallback(() => {
    speechService.stopSpeaking();
    setTeacherState('idle');
  }, []);

  // Keyboard shortcut listener (Space = toggle mic, Escape = stop Lina speech)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleMicrophone();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopLinaSpeech();
        if (speechService.isListening()) {          speechService.abortListening();
          setMicState('IDLE');
          setInterimTranscript('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [micState, teacherState]);

  // Process user message with Gemini Speaking Engine
  const processUserMessage = async (userText: string) => {
    if (!guestCanSpeak) {
      setGuestLimitReached(true);
      setStatusMessage('Bạn đã dùng hết 5 phút AI Speaking miễn phí. Hãy tiếp tục với Google.');
      return;
    }

    const cleanText = userText.trim();
    if (!cleanText) return;

    // Interrupt any ongoing speech
    stopLinaSpeech();

    const userMsg: ConversationMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      chinese: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setTeacherState('thinking');
    setStatusMessage('Đang hiểu...');
    setMicState('PROCESSING');

    try {
      const historyFormatted = newHistory.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        chinese: m.chinese,
        translation: m.translation,
      }));

      const analysis: SpeakingAnalysis = await geminiSpeakingService.analyzeSpeaking({
        userText: cleanText,
        targetLevel: activeLevel,
        topic: activeTopic,
        conversationHistory: historyFormatted,
        nativeLanguage: 'vi',
        difficulty: settings.difficulty,
        mode: tutorMode,
        memory: {
          ...memory,
          studyCoachContext,
        },
      });

      // Update user message with correction if any
      if (analysis.corrections && analysis.corrections.length > 0) {
        const firstCorrection = analysis.corrections[0];
        userMsg.correction = {
          hasMistake: true,
          userSentence: firstCorrection.original,
          naturalVersion: firstCorrection.corrected,
          betterChinese: firstCorrection.corrected,
          explanationVi: firstCorrection.explanation,
        };
      } else {
        userMsg.correction = {
          hasMistake: false,
          explanationVi: 'Diễn đạt tự nhiên, ngữ pháp chuẩn xác!',
        };
      }

      // Update detected vocabulary for the session.
      if (analysis.vocabulary && analysis.vocabulary.length > 0) {
        userMsg.detectedVocabulary = analysis.vocabulary;
        setWordsLearnedSession((prev) => {
          const map = new Map(prev.map((w) => [w.hanzi, w]));
          analysis.vocabulary.forEach((v) => {
            map.set(v.hanzi, { hanzi: v.hanzi, pinyin: v.pinyin, meaning: v.meaning });
          });
          return Array.from(map.values());
        });
      }

      // Update scores
      if (analysis.clarityScore) {
        setSessionScores({
          clarity: analysis.clarityScore ?? 5,
          grammar: analysis.grammarScore ?? 5,
          vocabulary: analysis.vocabularyScore ?? 4,
          naturalness: analysis.naturalnessScore ?? 4,
        });
      }

      const linaMsg: ConversationMessage = {
        id: `lina-${Date.now()}`,
        sender: 'lina',
        chinese: analysis.reply,
        pinyin: analysis.pinyin,
        translation: analysis.translation,
        grammarNote: analysis.grammarNote || undefined,
        encouragement: analysis.encouragement || undefined,
        followUpQuestion: undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newHistory.slice(0, -1), userMsg, linaMsg];
      setMessages(finalMessages);

      // Update and persist long-term conversation memory (facts, contradictions, vocabulary)
      const updatedMemory = updateMemoryWithTurn(memory, userMsg, linaMsg, analysis);
      const sessionMemory = { ...updatedMemory, sessionId: conversationSessionId || updatedMemory.sessionId };
      setMemory(sessionMemory);
      saveMemoryToStorage(sessionMemory);

      // Persist the completed turn after AI analysis enriches the user message.
      if (conversationSessionId) {
        const persistenceUserId = authUser?.id || 'guest_user';
        const corrections = userMsg.correction?.hasMistake && userMsg.correction.userSentence ? [{
          original: userMsg.correction.userSentence,
          corrected: userMsg.correction.naturalVersion || userMsg.correction.betterChinese || cleanText,
          explanation: userMsg.correction.explanationVi || '',
        }] : [];
        await conversationRepository.saveMessage(conversationSessionId, persistenceUserId, {
          id: userMsg.id, sessionId: conversationSessionId, userId: persistenceUserId, role: 'user', chinese: userMsg.chinese,
          timestamp: new Date().toISOString(), corrections, vocabulary: userMsg.detectedVocabulary || [],
        });
        await conversationRepository.saveMessage(conversationSessionId, persistenceUserId, {
          id: linaMsg.id, sessionId: conversationSessionId, userId: persistenceUserId, role: 'assistant', chinese: linaMsg.chinese,
          pinyin: linaMsg.pinyin, translation: linaMsg.translation, timestamp: new Date().toISOString(),
          grammarNote: linaMsg.grammarNote, encouragement: linaMsg.encouragement, followUpQuestion: linaMsg.followUpQuestion,
          scores: { clarity: analysis.clarityScore ?? 5, grammar: analysis.grammarScore ?? 5, vocabulary: analysis.vocabularyScore ?? 4, naturalness: analysis.naturalnessScore ?? 4 },
        });
        await conversationRepository.updateMemory(conversationSessionId, {
          summary: sessionMemory.summary, keyFacts: sessionMemory.keyFacts, vocabulary: sessionMemory.vocabulary,
        });
      }

      // Speak Lina's reply
      if (settings.autoPlayAi) {
        setTeacherState('speaking');
        setMicState('AI_SPEAKING');
        setStatusMessage('Lina đang nói...');
        speechService.speakChinese(analysis.reply, {
          rate: settings.speed,
          voice: settings.voice === 'Lina' ? undefined : settings.voice,
          onEnd: () => {
            setTeacherState('idle');
            setStatusMessage('Đến lượt bạn nói!');
            setMicState('IDLE');
            if (settings.autoListen) {
              handleStartListening();
            }
          },
          onError: () => {
            setTeacherState('idle');
            setMicState('IDLE');
            setStatusMessage('Giọng đọc chưa khả dụng trên trình duyệt này. Bạn vẫn có thể tiếp tục bằng văn bản.');
          },
        });
      } else {
        setTeacherState('idle');
        setStatusMessage('Đến lượt bạn nói!');
        setMicState('IDLE');
      }
    } catch (err: unknown) {
      console.error('Error generating AI response:', err);
      setTeacherState('idle');
      setMicState('IDLE');
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Guest AI Speaking limit reached')) {
        setGuestLimitReached(true);
        setGuestRemainingSeconds(0);
        setStatusMessage('Bạn đã dùng hết 5 phút AI Speaking miễn phí. Hãy tiếp tục với Google.');
        return;
      }
      const errorMsg = 'Đang gặp sự cố kết nối. Bạn thử lại nhé.';
      setStatusMessage(errorMsg);
    }
  };

  // Start listening logic
  const handleStartListening = () => {
    if (!guestCanSpeak) {
      setGuestLimitReached(true);
      setStatusMessage('Bạn đã dùng hết 5 phút AI Speaking miễn phí. Hãy tiếp tục với Google.');
      return;
    }

    // Interrupt teacher speech immediately
    stopLinaSpeech();

    setMicState('LISTENING');
    setTeacherState('listening');
    setStatusMessage('Đang nghe...');
    setInterimTranscript('');

    const started = speechService.startListening({
      onStart: () => {
        setMicState('LISTENING');
      },
      onInterimResult: (interim) => {
        setInterimTranscript(interim);
      },
      onResult: (transcript) => {
        // Keep showing the complete accumulated transcript, but do not send it
        // to Lina while Web Speech is still producing recognition segments.
        setInterimTranscript(transcript);
      },
      onError: (errMsg) => {
        setMicState('ERROR');
        setTeacherState('idle');
        setStatusMessage(errMsg);
        setTimeout(() => {
          setMicState('IDLE');
        }, 3000);
      },
      onEnd: (finalTranscript) => {
        // Only submit after recognition has actually ended. This prevents a
        // temporary/interim result or a short pause from sending a partial sentence.
        if (finalTranscript?.trim()) {
          setMicState('PROCESSING');
          setTeacherState('thinking');
          setInterimTranscript('');
          processUserMessage(finalTranscript);
        } else {
          setMicState('IDLE');
          setTeacherState('idle');
          setInterimTranscript('');
          setStatusMessage('Mình chưa nghe rõ. Bạn thử nói chậm hơn nhé.');
        }
      },
    });

    if (!started) {
      setMicState('ERROR');
      setTeacherState('idle');
    }
  };
  // Toggle Microphone
  const handleToggleMicrophone = () => {
    if (!conversationReady || !guestCanSpeak) {
      if (!guestCanSpeak) setGuestLimitReached(true);
      return;
    }
    if (micState === 'LISTENING') {
      // Let the speech service finish and deliver the accumulated final transcript.
      // Do not submit the current interim text here: it may still be incomplete.
      speechService.stopListening();
      setStatusMessage('Đang hoàn tất câu nói...');
    } else {
      handleStartListening();
    }
  };

  // Manual text submit fallback
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || micState === 'PROCESSING' || !conversationReady || !guestCanSpeak) return;
    const text = inputVal;
    setInputVal('');
    processUserMessage(text);
  };

  // Edit user transcript if speech recognition made a typo
  const handleSaveEditedMessage = (id: string) => {
    if (!editingText.trim()) return;
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, chinese: editingText.trim() } : msg))
    );
    setEditingMsgId(null);
    setEditingText('');
  };

  // Save word to review notebook
  const handleToggleSaveWord = (hanzi: string) => {
    setSavedWords((prev) => {
      const next = new Set(prev);
      if (next.has(hanzi)) {
        next.delete(hanzi);
      } else {
        next.add(hanzi);
      }
      return next;
    });
  };

  // Reset conversation memory for this topic (Section 51)
  const handleResetMemory = () => {
    clearMemoryFromStorage(memory.sessionId);
    const fresh = createEmptyMemory(memory.sessionId, activeTopic, activeLevel);
    setMemory(fresh);
    setStatusMessage('Đã làm mới trí nhớ của cô Lina.');
  };

  // End Session and Show Summary
  const handleEndSession = async () => {
    stopLinaSpeech();
    speechService.stopListening();

    const durationMinutes = (Date.now() - sessionStartTime) / 60000;
    const turnsCount = messages.filter((m) => m.sender === 'user').length;
    const correctionsCount = messages.filter((m) => m.correction?.hasMistake).length;

    const sessionData = {
      topic: activeTopic,
      level: activeLevel,
      durationMinutes,
      turns: turnsCount,
      wordsLearned: wordsLearnedSession.map((w) => w.hanzi),
      correctionsCount,
      averageScores: sessionScores,
    };

    if (!authUser || !isSupabaseConfigured || !supabase) {
      progressService.recordSession(sessionData);
      subscriptionService.addUsage(durationMinutes);
      setSummaryOpen(true);
      return;
    }

    try {
      const { data: existing, error: readError } = await supabase
        .from('learning_progress')
        .select('total_study_minutes, speaking_minutes, conversations_completed, current_streak, longest_streak, last_study_date')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (readError) throw new Error(readError.message);

      const today = new Date();
      const todayDate = today.toISOString().slice(0, 10);
      const previousDate = existing?.last_study_date || null;
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      let currentStreak = existing?.current_streak || 0;
      if (previousDate !== todayDate) {
        currentStreak = previousDate === yesterday ? currentStreak + 1 : 1;
      }
      const longestStreak = Math.max(existing?.longest_streak || 0, currentStreak);

      const { error: updateError } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: authUser.id,
          total_study_minutes: (existing?.total_study_minutes || 0) + Math.max(1, Math.round(durationMinutes)),
          speaking_minutes: (existing?.speaking_minutes || 0) + Math.max(1, Math.round(durationMinutes)),
          conversations_completed: (existing?.conversations_completed || 0) + 1,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_study_date: todayDate,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw new Error(updateError.message);
      setSummaryOpen(true);
    } catch (error) {
      console.error('Cloud learning progress update error:', error);
      setPersistenceError(
        `Không thể lưu tiến trình luyện nói: ${error instanceof Error ? error.message : String(error)}`
      );
      setSummaryOpen(true);
    }
  };

  // Navigation handlers
  const handleGoBack = () => {
    stopLinaSpeech();
    speechService.stopListening();
    if (onBackToTopics) {
      onBackToTopics();
    } else {
      window.location.hash = '#practice-speaking';
      window.dispatchEvent(new CustomEvent('app_navigate', { detail: { route: 'practice-speaking' } }));
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
      <div className="pointer-events-none absolute -top-16 -left-20 h-48 w-48 rounded-full bg-[#E86F51]/10 blur-3xl dark:bg-[#E86F51]/5" />
      <div className="pointer-events-none absolute top-24 right-0 h-56 w-56 rounded-full bg-[#D5A85C]/10 blur-3xl dark:bg-[#D5A85C]/5" />
      {/* Top Header Bar */}
      <header className="relative flex items-center justify-between pb-4 border-b border-[#EFE4D8]/80 dark:border-[#342A24]/80 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="p-2.5 rounded-2xl bg-white/80 dark:bg-[#251D19]/80 backdrop-blur border border-[#E8DACD] dark:border-[#3B3029] hover:bg-[#FFF2EB] dark:hover:bg-[#322722] hover:-translate-x-0.5 text-[#716761] dark:text-[#BDB2AA] transition-all shadow-sm cursor-pointer"
            title="Quay lại danh sách chủ đề"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg sm:text-xl text-[#211A17] dark:text-[#FAF5F1]">
                {activeTopic}
              </h1>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E86F51]/15 to-[#F5A28E]/15 text-[#D85F43] dark:text-[#FFB29D] font-bold border border-[#E86F51]/15">
                {activeLevel}
              </span>
            </div>
            <p className="text-xs text-[#716761] dark:text-[#A89E97] hidden sm:block">
              Phòng luyện nói 1-1 trực tiếp cùng cô Lina · có thể đổi HSK ngay trong phiên
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Stop Button if Lina speaking */}
          {teacherState === 'speaking' && (
            <button
              type="button"
              onClick={stopLinaSpeech}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E86F51] text-white text-xs font-semibold animate-pulse shadow-sm cursor-pointer"
            >
              <StopCircle size={15} />
              <span>Dừng đọc</span>
            </button>
          )}

          {/* Language layer controls — each layer can be shown independently. */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-white/75 dark:bg-[#251D19]/80 backdrop-blur border border-[#E8DACD] dark:border-[#3B3029] p-1.5" aria-label="Lớp hiển thị hội thoại">
            {[
              { key: 'hanzi', label: 'Hán', enabled: true },
              { key: 'pinyin', label: 'Pinyin', enabled: settings.showPinyin },
              { key: 'translation', label: 'Việt', enabled: settings.showTranslation },
            ].map((layer) => (
              <button
                key={layer.key}
                type="button"
                onClick={() => {
                  if (layer.key === 'hanzi') return;
                  const field = layer.key === 'pinyin' ? 'showPinyin' : 'showTranslation';
                  const next = !layer.enabled;
                  const updated = progressService.saveSettings({ [field]: next });
                  setSettings(updated);
                }}
                aria-pressed={layer.enabled}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${layer.enabled ? 'bg-[#E86F51] text-white shadow-sm' : 'text-[#716761] dark:text-[#A89E97] hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-2xl bg-white/75 dark:bg-[#251D19]/80 border border-[#E8DACD] dark:border-[#3B3029] p-1" aria-label="Chế độ Lina">
            <button type="button" onClick={() => setTutorMode('conversation')} aria-pressed={tutorMode === 'conversation'} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${tutorMode === 'conversation' ? 'bg-[#E86F51] text-white' : 'text-[#716761] dark:text-[#A89E97]'}`}>Trò chuyện</button>
            <button type="button" onClick={() => setTutorMode('teacher')} aria-pressed={tutorMode === 'teacher'} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${tutorMode === 'teacher' ? 'bg-[#E86F51] text-white' : 'text-[#716761] dark:text-[#A89E97]'}`}>Gia sư</button>
          </div>

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-2xl bg-white/80 dark:bg-[#251D19]/80 backdrop-blur border border-[#E8DACD] dark:border-[#3B3029] hover:bg-[#FFF2EB] dark:hover:bg-[#322722] hover:-translate-y-0.5 text-[#716761] dark:text-[#BDB2AA] transition-all shadow-sm cursor-pointer"
            title="Cài đặt luyện nói"
          >
            <Sliders size={18} />
          </button>

          {/* End Session Button */}
          <button
            type="button"
            onClick={handleEndSession}
            className="px-3.5 py-2 rounded-xl bg-[#FFF0EB] dark:bg-[#342721] text-[#E86F51] border border-[#FAD3C8] dark:border-[#4A372E] hover:bg-[#FCE2D8] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Hoàn thành
          </button>
        </div>
      </header>

      {/* In-session HSK level selector */}
      <section className="relative mt-4 p-3.5 sm:p-4 rounded-3xl bg-white/85 dark:bg-[#201915]/90 backdrop-blur border border-[#EADCCF] dark:border-[#382E27] shadow-sm shrink-0 overflow-hidden" aria-labelledby="conversation-level-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <p id="conversation-level-title" className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E86F51] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E86F51] shadow-[0_0_0_4px_rgba(232,111,81,0.12)]" />HSK mục tiêu của phiên</p>
            <p className="text-[11px] text-[#716761] dark:text-[#A89E97] mt-0.5">
              Đổi cấp độ để Lina điều chỉnh từ vựng, độ dài câu, tốc độ phản hồi và độ sâu câu hỏi.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E86F51]/10 text-[#E86F51] border border-[#E86F51]/10">Đang luyện: {activeLevel}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((level) => {
            const isSelected = activeLevel === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setActiveLevel(level);
                  sessionStorage.setItem('selected_speaking_level', level);
                  setMemory((previous) => ({
                    ...previous,
                    learnerLevel: level,
                  }));
                  setStatusMessage(`Lina đã chuyển sang ${level}. Bạn có thể tiếp tục nói ở cấp độ mới.`);
                }}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isSelected
                  ? 'bg-[#E86F51] text-white border-[#E86F51] shadow-sm'
                  : 'bg-[#FFF9F4] dark:bg-[#251D19] border-[#EADCCF] dark:border-[#382E27] text-[#5F554F] dark:text-[#C5B9B0] hover:border-[#E86F51]/50'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Classroom Grid (3-columns on desktop, stacked on mobile) */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 pt-4 overflow-hidden">
        {/* LEFT COLUMN: AI Teacher Profile & Live Status (Desktop) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col bg-white/90 dark:bg-[#201915]/95 backdrop-blur border border-[#EADCCF] dark:border-[#382E27] rounded-[28px] p-5 shadow-[0_12px_40px_rgba(73,46,32,0.07)] justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="relative flex flex-col items-center text-center pb-5 border-b border-[#F0E4D8] dark:border-[#342A24]">
              <div className="absolute top-0 h-24 w-24 rounded-full bg-[#E86F51]/10 blur-2xl" />
              <div className="relative"><LinaAvatar size="xl" state={teacherState} className="mb-3 drop-shadow-[0_8px_18px_rgba(232,111,81,0.16)]" /></div>
              <h3 className="font-bold text-lg text-[#211A17] dark:text-white">Cô Lina (Lina 老师)</h3>
              <p className="text-xs text-[#E86F51] font-medium">Giáo viên bản xứ HanziAI</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5F0] dark:bg-[#2E241E] text-xs text-[#716761] dark:text-[#C5B9B0]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    teacherState === 'speaking'
                      ? 'bg-[#E86F51] animate-ping'
                      : teacherState === 'listening'
                      ? 'bg-[#D5A85C] animate-pulse'
                      : teacherState === 'thinking'
                      ? 'bg-[#8B72DE] animate-bounce'
                      : 'bg-[#65A873]'
                  }`}
                />
                <span className="text-left">{teacherState === 'listening' ? 'Đang lắng nghe' : teacherState === 'thinking' ? 'Đang suy nghĩ' : teacherState === 'speaking' ? 'Đang nói' : 'Sẵn sàng'}</span>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-[#FFF9F4] dark:bg-[#28201B] p-3.5 rounded-2xl border border-[#F2E5D8] dark:border-[#3A2E26] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] flex items-center gap-1.5">
                <Lightbulb size={14} className="text-[#D5A85C]" />
                Mẹo luyện phản xạ
              </h4>
              <p className="text-xs text-[#716761] dark:text-[#C5B9B0] leading-relaxed">
                Đừng ngại nói sai. Hãy trả lời thành câu hoàn chỉnh và nhấn vào micro để kiểm tra phản xạ tự nhiên.
              </p>
            </div>

            {/* Conversation Memory Card (Section 11-20, 42-43) */}
            <div className="bg-[#FAF6F0] dark:bg-[#251E19] p-3.5 rounded-2xl border border-[#EDE2D5] dark:border-[#3A2E26] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#211A17] dark:text-[#F7F2EE]">
                  <Brain size={14} className="text-[#E86F51]" />
                  <span>Trí nhớ của Lina</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E86F51]/10 text-[#E86F51] font-semibold">
                  {memory.keyFacts.length} dữ kiện
                </span>
              </div>

              {memory.keyFacts.length === 0 ? (
                <p className="text-[11px] text-[#8C8078] dark:text-[#A89E97] leading-relaxed">
                  Lina sẽ tự động ghi nhớ sở thích, tên và thông tin bạn chia sẻ trong lúc trò chuyện.
                </p>
              ) : (
                <div className="space-y-1.5">                  <div className="flex flex-wrap gap-1">
                    {memory.keyFacts.map((fact, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#342A24] text-[#716761] dark:text-[#D5C9BE] border border-[#E5D7C9] dark:border-[#42352D]"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleResetMemory}
                    className="mt-1 flex items-center gap-1 text-[10px] text-[#8C8078] hover:text-[#E86F51] transition-colors cursor-pointer"
                    title="Xóa và làm mới trí nhớ của Lina cho chủ đề này"
                  >
                    <RefreshCw size={11} />
                    <span>Làm mới trí nhớ</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Engine Status Card (Section 42, 43) */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#201915] border border-[#EDE2D5] dark:border-[#382E27] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu size={14} className={hasApiKey ? 'text-[#52B788]' : 'text-[#D5A85C]'} />
                <div>
                  <p className="text-[11px] font-semibold text-[#211A17] dark:text-[#FAF5F1]">
                    {hasApiKey ? 'Gemini 3.8 Flash' : 'Mock AI Fallback'}
                  </p>
                  <p className="text-[10px] text-[#8C8078] dark:text-[#A89E97]">
                    {hasApiKey ? 'Trực tuyến với AI Google' : 'Chế độ an toàn ngoại tuyến'}
                  </p>
                </div>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  hasApiKey ? 'bg-[#52B788] ring-4 ring-[#52B788]/20' : 'bg-[#D5A85C]'
                }`}
                title={hasApiKey ? 'Gemini API đã sẵn sàng' : 'Chạy chế độ dự phòng'}
              />
            </div>

            {/* Keyboard Shortcuts Helper */}
            <div className="text-[11px] text-[#8C8078] dark:text-[#9E938B] space-y-1">
              <p className="font-semibold text-xs text-[#716761] dark:text-[#BDB2AA]">Phím tắt:</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-[#F0E4D8] dark:bg-[#342A24] rounded text-[10px]">Space</kbd> : Bật / tắt Micro</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-[#F0E4D8] dark:bg-[#342A24] rounded text-[10px]">Escape</kbd> : Dừng giọng cô Lina</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0E4D8] dark:border-[#342A24] text-center">
            <span className="text-[11px] text-[#8C8078] dark:text-[#8C8078]">
              HanziAI Speech Recognition Engine
            </span>
          </div>
        </aside>

        {/* CENTER COLUMN: Conversation History & Control Dock */}
        <div className="col-span-1 lg:col-span-6 flex flex-col bg-white/95 dark:bg-[#201915]/95 backdrop-blur border border-[#EADCCF] dark:border-[#382E27] rounded-[28px] shadow-[0_16px_50px_rgba(73,46,32,0.09)] overflow-hidden">
          {persistenceError && (
            <div className="mx-4 mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bộ nhớ hội thoại chưa lưu được</p>
                <p className="mt-1 break-words">{persistenceError}</p>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 scroll-smooth bg-gradient-to-b from-white/40 via-[#FFF9F4]/35 to-white/60 dark:from-transparent dark:via-[#251D19]/25 dark:to-transparent">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 shadow-2xs ${
                      isUser
                        ? 'bg-gradient-to-br from-[#E86F51] via-[#EC795D] to-[#F5A28E] text-white rounded-tr-md shadow-[0_10px_28px_rgba(232,111,81,0.22)]'
                        : 'bg-white dark:bg-[#29201B] text-[#211A17] dark:text-[#F7F2EE] border border-[#F0E2D5] dark:border-[#3A2E26] rounded-tl-md'
                    }`}
                  >
                    {/* Speaker Header */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-xs font-semibold opacity-85">
                        {isUser ? 'Bạn' : 'Cô Lina'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-75">{msg.timestamp}</span>
                        {!isUser && <AudioButton text={msg.chinese} size="sm" rate={settings.speed} />}
                        {isUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditingText(msg.chinese);
                            }}
                            className="text-white/80 hover:text-white p-1 transition-colors cursor-pointer"
                            title="Sửa lại câu nếu nhận diện giọng nói chưa chuẩn"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Display or Edit Box */}
                    {editingMsgId === msg.id ? (
                      <div className="space-y-2 mt-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/40 text-sm focus:outline-hidden"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="px-2 py-1 rounded bg-white/20 text-xs text-white"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditedMessage(msg.id)}
                            className="px-2 py-1 rounded bg-white text-[#E86F51] text-xs font-semibold"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Chinese Text */}
                        <p className="text-base sm:text-lg font-serif font-semibold tracking-wide leading-relaxed">
                          {msg.chinese}
                        </p>

                        {/* Pinyin with tone markers */}
                        {settings.showPinyin && msg.pinyin && (
                          <p
                            className={`text-xs font-medium tracking-wider mt-1 ${
                              isUser ? 'text-white/90' : 'text-[#E86F51]'
                            }`}
                          >
                            {msg.pinyin}
                          </p>
                        )}

                        {/* Translation */}
                        {settings.showTranslation && msg.translation && (
                          <p
                            className={`text-xs mt-1.5 leading-normal ${
                              isUser ? 'text-white/85' : 'text-[#716761] dark:text-[#A89E97]'
                            }`}
                          >
                            {msg.translation}
                          </p>
                        )}
                      </>
                    )}

                    {/* Correction Card for Learner (Section 12) */}
                    {isUser && msg.correction && (
                      <div className="mt-3 pt-2.5 border-t border-white/20 text-xs">
                        {msg.correction.hasMistake ? (
                          <div className="bg-black/15 p-2.5 rounded-xl space-y-1">
                            <div className="flex items-center gap-1 font-semibold text-white">
                              <Sparkles size={13} className="text-[#FFD166]" />
                              <span>Điểm cần lưu ý để tự nhiên hơn:</span>
                            </div>
                            <p className="text-white/90">
                              <span className="opacity-75">Cách nói tự nhiên: </span>
                              <span className="font-serif font-bold text-[#FFF5EB]">
                                {msg.correction.naturalVersion}
                              </span>
                            </p>
                            {msg.correction.explanationVi && (
                              <p className="text-[11px] text-white/80 italic">
                                {msg.correction.explanationVi}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-white/95">
                            <CheckCircle2 size={14} className="text-[#4EFA94]" />
                            <span className="text-[11px] font-medium">
                              {msg.correction.explanationVi || 'Diễn đạt tự nhiên & chuẩn xác!'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grammar Note from Lina */}
                    {!isUser && msg.grammarNote && (
                      <div className="mt-2.5 pt-2 border-t border-[#F0E4D8] dark:border-[#382E27] text-xs text-[#716761] dark:text-[#C5B9B0] flex items-start gap-1.5 bg-[#FFF0EB]/50 dark:bg-[#342721]/50 p-2 rounded-xl">
                        <Lightbulb size={14} className="text-[#E86F51] shrink-0 mt-0.5" />
                        <span>{msg.grammarNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}


                        {/* Real-time Interim Transcript preview while user is actively speaking (Section 17) */}
            {micState === 'LISTENING' && interimTranscript && (
              <div className="flex justify-end animate-fade-in">
                <div className="max-w-[85%] rounded-3xl rounded-tr-xs p-3.5 bg-[#E86F51]/15 dark:bg-[#E86F51]/25 border border-[#E86F51]/40 text-[#211A17] dark:text-white shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#E86F51] animate-ping" />
                    <span className="text-[11px] font-medium text-[#E86F51]">Đang nhận diện giọng nói:</span>
                  </div>
                  <p className="text-base font-serif font-semibold">{interimTranscript}</p>
                </div>
              </div>
            )}

            {/* Lina Thinking Bubble */}
            {teacherState === 'thinking' && (
              <div className="flex items-center gap-2.5 text-xs text-[#716761] dark:text-[#A89E97] animate-pulse px-3 py-2.5 rounded-2xl bg-[#FFF9F4] dark:bg-[#29201B] border border-[#F0E4D8] dark:border-[#382E27] w-fit">
                <LinaAvatar size="sm" state="thinking" />
                <span>Đang hiểu...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Interactive Control Dock */}
          <div className="p-4 sm:p-5 bg-gradient-to-t from-[#FFF7F1] to-[#FFFDFC] dark:from-[#251D19] dark:to-[#211915] border-t border-[#EFE4D8] dark:border-[#342A24] space-y-3">
            {!authLoading && !authUser && (
              <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border ${guestRemainingSeconds <= 30 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-[#EADCCF] text-[#5F554F]'}`}>
                <div>
                  <p className="text-xs font-semibold">AI Speaking miễn phí cho khách</p>
                  <p className="text-[11px] mt-0.5">
                    {guestLimitReached ? 'Đã hết 5 phút cho phiên này.' : 'Thời gian còn lại trong phiên:'}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums">{formattedGuestTime}</span>
              </div>
            )}

            {guestLimitReached && !authUser && !authLoading && (
              <div className="rounded-2xl border border-[#EADCCF] bg-white p-3 space-y-2">
                <p className="text-xs text-[#5F554F]">Đăng nhập Google để tiếp tục luyện nói không giới hạn.</p>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}                  className="w-full py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#D55F42] text-white text-xs font-semibold transition-colors"
                >
                  Continue with Google
                </button>
              </div>
            )}

            {/* Center Microphone Button */}
            <div className="flex flex-col items-center justify-center py-1">
              <MicrophoneButton
                state={micState}
                onClick={handleToggleMicrophone}
                statusText={statusMessage}
                size="large"
              />
            </div>

            {/* Manual Typing Fallback Form */}
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Hoặc gõ câu tiếng Trung của bạn tại đây (Enter để gửi)..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-[#1E1714] border border-[#EADCCF] dark:border-[#3C3028] text-sm text-[#211A17] dark:text-white placeholder-[#9C9188] focus:outline-hidden focus:border-[#E86F51] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || micState === 'PROCESSING' || !conversationReady || !guestCanSpeak}
                className="p-3 rounded-2xl bg-gradient-to-br from-[#E86F51] to-[#D85F43] hover:from-[#D85F43] hover:to-[#C95239] disabled:opacity-40 text-white shadow-[0_8px_18px_rgba(232,111,81,0.22)] hover:-translate-y-0.5 transition-all cursor-pointer"
                title="Gửi câu trả lời"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Vocabulary & Honest Language Feedback (Desktop) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col bg-white/90 dark:bg-[#201915]/95 backdrop-blur border border-[#EADCCF] dark:border-[#382E27] rounded-[28px] p-5 shadow-[0_12px_40px_rgba(73,46,32,0.07)] justify-between overflow-y-auto space-y-5">
          {/* Active Session Vocabulary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#211A17] dark:text-white flex items-center gap-1.5">
                <BookOpen size={16} className="text-[#E86F51]" />
                Từ vựng ghi nhận ({wordsLearnedSession.length})
              </h3>
            </div>

            {wordsLearnedSession.length === 0 ? (
              <p className="text-xs text-[#8C8078] dark:text-[#8C8078] italic bg-[#FFF9F4] dark:bg-[#28201B] p-3 rounded-2xl border border-[#F0E4D8] dark:border-[#362C25] text-center">
                Từ vựng mới xuất hiện trong hội thoại sẽ được liệt kê tại đây.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {wordsLearnedSession.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FFF9F4] dark:bg-[#29201B] border border-[#EFE2D5] dark:border-[#3A2E26] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm text-[#211A17] dark:text-white">
                          {w.hanzi}
                        </span>
                        <span className="text-xs text-[#E86F51]">{w.pinyin}</span>
                      </div>
                      <p className="text-xs text-[#716761] dark:text-[#A89E97] line-clamp-1">{w.meaning}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <AudioButton text={w.hanzi} size="sm" />
                      <button
                        type="button"
                        onClick={() => handleToggleSaveWord(w.hanzi)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          savedWords.has(w.hanzi)
                            ? 'text-[#E86F51]'
                            : 'text-[#9C9188] hover:text-[#211A17] dark:hover:text-white'
                        }`}
                        title="Lưu từ vựng"
                      >
                        <BookmarkPlus size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Honest Language Metrics (Section 19) */}
          <div className="bg-[#FFF9F4] dark:bg-[#28201B] p-4 rounded-2xl border border-[#F0E4D8] dark:border-[#382E27] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#716761] dark:text-[#A89E97] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#E86F51]" />
              Năng lực diễn đạt phiên này
            </h4>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#716761] dark:text-[#A89E97]">Rõ ràng (Clarity)</span>
                  <span className="font-bold text-[#E86F51]">{sessionScores.clarity}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= sessionScores.clarity ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#716761] dark:text-[#A89E97]">Ngữ pháp (Grammar)</span>
                  <span className="font-bold text-[#E86F51]">{sessionScores.grammar}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= sessionScores.grammar ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#716761] dark:text-[#A89E97]">Tự nhiên (Naturalness)</span>
                  <span className="font-bold text-[#E86F51]">{sessionScores.naturalness}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${
                        s <= sessionScores.naturalness ? 'bg-[#E86F51]' : 'bg-[#EADCCF] dark:bg-[#3D312A]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#8C8078] dark:text-[#8C8078] italic pt-1 border-t border-[#F0E4D8] dark:border-[#382E28]">
              * Đánh giá trực tiếp dựa trên cấu trúc ngữ cảnh câu nói của bạn.
            </p>
          </div>

          {/* Quick Finish Button */}
          <button
            type="button"
            onClick={handleEndSession}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E86F51] to-[#F5A28E] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            Tổng kết buổi luyện
          </button>
        </aside>
      </div>

      {/* Speaking Settings Modal */}
      <SpeakingSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => {
          const newSet = progressService.saveSettings(updated);
          speechService.setVoice(newSet.voice === 'Lina' ? undefined : newSet.voice);
          setSettings(newSet);
        }}
      />

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onPracticeAgain={() => {
          setSummaryOpen(false);
          handleGoBack();
        }}
        onGoHome={() => {
          setSummaryOpen(false);
          window.location.hash = '';
          window.dispatchEvent(new CustomEvent('app_navigate', { detail: { route: 'home' } }));
        }}
        stats={{
          durationMinutes: (Date.now() - sessionStartTime) / 60000,
          turnsCount: messages.filter((m) => m.sender === 'user').length,
          wordsLearned: wordsLearnedSession,
          correctionsCount: messages.filter((m) => m.correction?.hasMistake).length,
          topic: activeTopic,
          level: activeLevel,
          scores: sessionScores,
        }}
      />
    </div>
  );
};