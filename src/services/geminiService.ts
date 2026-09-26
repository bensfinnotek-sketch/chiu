// Real Gemini AI Service for HanziAI
// Proxies all AI calls to the secure server endpoints with schema validation, retry logic, and mock fallback.

import { AI_CONFIG } from '../config/ai';
import {
  SpeakingAnalysis,
  validateSpeakingResponse,
  createFallbackSpeakingAnalysis,
} from '../ai/schemas/speakingSchema';
import { mockGeminiService } from './mockGeminiService';
import { ConversationMessage, SpeakingFeedback, TranslationResult, DictionaryEntry } from '../types';
import { getAuthHeaders } from './flashcardService';
import { PronunciationAssessment, PronunciationAudioInput, createUnavailablePronunciationAssessment } from '../ai/pronunciation/pronunciationTypes';

export interface AIService {
  generateConversation(params: any): Promise<any>;
  analyzeSpeaking(params: {
    userText: string;
    targetLevel?: string;
    topic?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; chinese: string }>;
    nativeLanguage?: string;
    difficulty?: 'easy' | 'normal' | 'challenge';
    memory?: any;
    signal?: AbortSignal;
  }): Promise<SpeakingAnalysis>;
  correctChinese?(sentence: string, level?: string, language?: string): Promise<any>;
  translateChinese?(text: string, from?: string, to?: string): Promise<any>;
  explainGrammar?(point: string, level?: string, language?: string): Promise<any>;
  summarizeMemory?(memory: any): Promise<{ summary: string; keyFacts: string[] }>;
  assessPronunciation?(params: {
    spokenText: string;
    targetText?: string;
    language?: string;
    audio?: PronunciationAudioInput | null;
  }): Promise<PronunciationAssessment>;
}

export class GeminiServiceImpl implements AIService {
  /**
   * Primary Speaking Analysis & Conversation response generator
   * Implements validation, single-retry on schema invalidity, and seamless mock fallback.
   */
  async analyzeSpeaking(params: {
    userText: string;
    targetLevel?: string;
    topic?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; chinese: string }>;
    nativeLanguage?: string;
    difficulty?: 'easy' | 'normal' | 'challenge';
    memory?: any;
    signal?: AbortSignal;
  }): Promise<SpeakingAnalysis> {
    // 1. If provider is explicitly set to 'mock', route immediately to mock
    if (AI_CONFIG.provider === 'mock') {
      return mockGeminiService.analyzeSpeaking(params);
    }

    const {
      userText,
      targetLevel = 'HSK 1',
      topic = 'Daily Life',
      conversationHistory = [],
      nativeLanguage = 'vi',
      difficulty = 'normal',
      memory,
      signal,
    } = params;

    let attempt = 0;
    const maxAttempts = AI_CONFIG.maxRetries || 2;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const payload = {
          userText,
          targetLevel,
          topic,
          conversationHistory: conversationHistory.slice(-8).map((message) => ({
            role: message.role,
            chinese: message.chinese.slice(0, 500),
          })),
          nativeLanguage,
          difficulty,
          memory: {
            summary: memory?.summary,
            keyFacts: memory?.keyFacts,
          },
                  };

        const authHeaders = await getAuthHeaders();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...authHeaders,
        };

        const res = await fetch('/api/ai/speaking', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          cache: 'no-store',
          signal,
        });

        // If route not found on older server, fallback to /api/gemini/speaking-analyze
        if (res.status === 404) {
          const fallbackRes = await fetch('/api/gemini/speaking-analyze', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal,
          });
          if (!fallbackRes.ok) throw new Error(`Fallback HTTP ${fallbackRes.status}`);
          const rawData = await fallbackRes.json();
          const validation = validateSpeakingResponse(rawData);
          if (validation.valid && validation.data) {
            return validation.data;
          }
        }

        if (res.status === 429) {
          throw new Error('Gemini API đang bận (429 Rate limit). Vui lòng thử lại sau giây lát.');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `Server returned HTTP ${res.status}`;
          throw new Error(errMsg);
        }

        const rawData = await res.json();
        const validation = validateSpeakingResponse(rawData);

        if (validation.valid && validation.data) {
          if (AI_CONFIG.isDevelopment) {
            console.log('[AI Speaking Success]', { model: AI_CONFIG.model, attempt });
          }
          return validation.data;
        } else {
          console.warn('[AI Schema Validation Issue]', validation.error, rawData);
          if (attempt >= maxAttempts) {
            throw new Error(validation.error || 'Dữ liệu phản hồi từ AI không đúng cấu trúc.');
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw err; // propagate user abort
        }
        console.warn(`[AI Attempt ${attempt} failed]:`, err.message);
        if (attempt >= maxAttempts) {
          throw err;
        }
      }
    }

    throw new Error('Không thể kết nối đến AI Speaking server.');
  }

  async generateConversation(params: any): Promise<any> {
    const analysis = await this.analyzeSpeaking(params);
    return {
      chinese: analysis.reply,
      pinyin: analysis.pinyin,
      translation: analysis.translation,
      correction: analysis.corrections.length > 0 ? analysis.corrections[0] : null,
      encouragement: analysis.encouragement,
    };
  }

  async sendConversationMessage(
    messages: ConversationMessage[],
    userLevel: string = 'HSK 1',
    topic: string = 'Hội thoại thường ngày',
    language: string = 'vi'
  ) {
    if (AI_CONFIG.provider === 'mock') {
      return {
        chinese: '太棒了！你的中文发音越来越标准了。',
        pinyin: 'Tài bàng le! Nǐ de zhōngwén fāyīn yuè lái yuè biāozhǔn le.',
        translation: language === 'vi'
          ? 'Tuyệt quá! Phát âm tiếng Trung của bạn ngày càng chuẩn rồi đó.'
          : 'Awesome! Your Chinese pronunciation is getting more and more natural.',
        correction: null,
        encouragement: 'Tiếp tục luyện tập nhé! Bạn làm rất tốt.',
      };
    }
    const res = await fetch('/api/gemini/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        messages: messages.map((m) => ({
          sender: m.sender,
          text: m.chinese,
        })),
        userLevel,
        topic,
        language,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server returned HTTP ${res.status}`);
    }
    return await res.json();
  }

  async correctSentence(sentence: string, level: string = 'HSK 1', language: string = 'vi') {
    if (AI_CONFIG.provider === 'mock') {
      return {
        isCorrect: true,
        original: sentence,
        naturalVersion: sentence,
        pinyin: '',
        translation: '',
        explanation: 'Câu nói của bạn rất chuẩn xác và rõ nghĩa!',
        mistakes: [],
      };
    }
    const res = await fetch('/api/gemini/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ sentence, level, language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server returned HTTP ${res.status}`);
    }
    return await res.json();
  }

  async correctChinese(sentence: string, level: string = 'HSK 1', language: string = 'vi') {
    return this.correctSentence(sentence, level, language);
  }

  async getSpeakingFeedback(sentence: string, targetPrompt: string, language: string = 'vi'): Promise<SpeakingFeedback> {
    if (AI_CONFIG.provider === 'mock') {
      return {
        pronunciationScore: 90,
        grammarScore: 88,
        naturalnessScore: 92,
        feedback: language === 'vi'
          ? 'Bạn nói rất lưu loát và phát âm rõ ràng, nhịp điệu tự nhiên.'
          : 'Great pacing and natural pronunciation.',
        suggestedImprovement: 'Hãy chú ý thêm về biến điệu của thanh 3 khi nói nhanh.',
      };
    }
    const res = await fetch('/api/gemini/speaking-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ sentence, targetPrompt, language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server returned HTTP ${res.status}`);
    }
    return await res.json();
  }

  async translateText(text: string, from: string = 'zh', to: string = 'vi', formality: string = 'standard'): Promise<any> {
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ text, from, to, formality }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      return {
        translation: data.translation || text,
        translatedText: data.translation || data.translatedText || text,
        pinyin: data.pinyin || '',
        explanation: data.explanation || '',
        culturalNote: data.culturalNote || '',
        naturalAlternative: data.naturalAlternative || '',
        naturalAlternatives: Array.isArray(data.naturalAlternatives) ? data.naturalAlternatives : [],
      };
    } catch (err) {
      console.warn('Fallback translate:', err);
      return {
        translation: text,
        translatedText: text,
        pinyin: '',
        explanation: '',
        culturalNote: '',
        naturalAlternative: '',
        naturalAlternatives: [],
      };
    }
  }

  /**
   * Acoustic pronunciation assessment is intentionally separate from transcript feedback.
   * Until an audio-capable provider is wired in, return an explicit unavailable state.
   */
  async assessPronunciation(params: {
    spokenText: string;
    targetText?: string;
    language?: string;
    audio?: PronunciationAudioInput | null;
  }): Promise<PronunciationAssessment> {
    if (!params.audio) {
      return createUnavailablePronunciationAssessment(params.language || 'vi');
    }

    const blob = params.audio.blob;
    if (!blob.size || blob.size > 12 * 1024 * 1024) {
      return createUnavailablePronunciationAssessment(params.language || 'vi');
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
    }

    const base64 = btoa(binary);
    const authHeaders = await getAuthHeaders();
    const res = await fetch('/api/ai/pronunciation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        spokenText: params.spokenText,
        targetText: params.targetText,
        language: params.language || 'vi',
        audio: {
          base64,
          mimeType: params.audio.mimeType || blob.type || 'audio/webm',
        },
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return createUnavailablePronunciationAssessment(params.language || 'vi');
    }

    const data = await res.json();
    if (
      (data?.source !== 'acoustic' && data?.source !== 'unavailable') ||
      (data?.accuracyScore !== null &&
        (typeof data?.accuracyScore !== 'number' ||
          !Number.isFinite(data.accuracyScore) ||
          data.accuracyScore < 0 ||
          data.accuracyScore > 100))
    ) {
      return createUnavailablePronunciationAssessment(params.language || 'vi');
    }

    return {
      source: data.source,
      accuracyScore: data.accuracyScore,
      feedback: typeof data.feedback === 'string' ? data.feedback : '',
      suggestedImprovement:
        typeof data.suggestedImprovement === 'string' ? data.suggestedImprovement : null,
    };
  }

  async translateChinese(text: string, from: string = 'zh', to: string = 'vi') {
    return this.translateText(text, from, to);
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const res = await fetch('/api/gemini/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ sentence: prompt, level: 'HSK 1', language: 'vi' }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.explanation || data.naturalVersion || 'Lina đã nhận được câu hỏi và sẵn sàng hỗ trợ em!';
      }
    } catch {
      // fallback
    }
    return 'Lina rất vui được đồng hành cùng em! Em hãy tiếp tục học từ vựng và làm bài tập nhé.';
  }

  async getDictionaryDetail(charOrWord: string): Promise<DictionaryEntry | null> {
    try {
      const res = await fetch(`/api/gemini/dictionary?word=${encodeURIComponent(charOrWord)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Fallback dictionary lookup:', err);
      return null;
    }
  }

  async generateLesson(level: string, lessonNumber: number, topic: string) {
    try {
      const res = await fetch('/api/gemini/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ level, lessonNumber, topic }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Fallback lesson gen:', err);
      return null;
    }
  }

  async generateQuiz(level: string, count: number = 5) {
    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ level, count }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Fallback quiz gen:', err);
      return null;
    }
  }

  async summarizeMemory(memory: any): Promise<{ summary: string; keyFacts: string[] }> {
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ memory }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return mockGeminiService.summarizeMemory(memory);
  }
}

export const geminiService = new GeminiServiceImpl();
