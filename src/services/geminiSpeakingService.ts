// Gemini AI Speaking & Conversation Service for HanziAI
// Follows strict rules for Teacher Lina and structured JSON communication

import { geminiService } from './geminiService';
import type { ConversationMemory } from '../ai/memory/conversationMemory';
import type { SpeakingAnalysis } from '../ai/schemas/speakingSchema';
import type { PronunciationAssessment } from '../ai/pronunciation/pronunciationTypes';
import { GeminiPronunciationProvider } from '../ai/pronunciation/pronunciationProvider';


export interface SpeakingAnalysisInput {
  userText: string;
  targetLevel: string;
  topic: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    chinese: string;
    translation?: string;
  }>;
  nativeLanguage?: string;
  difficulty?: 'easy' | 'normal' | 'challenge';
  memory?: ConversationMemory;
}

// Section 19: Pronunciation Analyzer Architecture
export interface PronunciationIssue {
  character: string;
  pinyin: string;
  issue: string;
}

export interface PronunciationAnalyzer {
  analyze(audioData: any): Promise<any>;
  getScore(): number | null;
  getIssues(): PronunciationIssue[];
}

export class FallbackPronunciationAnalyzer implements PronunciationAnalyzer {
  public async analyze(_audioData: any): Promise<any> {
    // Return null since acoustic server-side ML model is not attached
    return null;
  }
  public getScore(): number | null {
    // Honest: No fake acoustic score
    return null;
  }
  public getIssues(): PronunciationIssue[] {
    return [];
  }
}

export const pronunciationAnalyzer = new FallbackPronunciationAnalyzer();

// Preset openers for Teacher Lina by topic and level
export const TOPIC_STARTERS: Record<string, Record<string, { chinese: string; pinyin: string; vi: string; en: string }>> = {
  'Daily Life': {
    'HSK 1': {
      chinese: '你好！你今天高兴吗？',
      pinyin: 'Nǐ hǎo! Nǐ jīntiān gāoxìng ma?',
      vi: 'Xin chào! Hôm nay bạn có vui không?',
      en: 'Hello! Are you happy today?',
    },
    'HSK 2': {
      chinese: '你好！你今天打算做什么？',
      pinyin: 'Nǐ hǎo! Nǐ jīntiān dǎsuàn zuò shénme?',
      vi: 'Xin chào! Hôm nay bạn dự định làm gì?',
      en: 'Hello! What do you plan to do today?',
    },
    'HSK 3': {
      chinese: '你好！你平时周末一般怎么安排？',
      pinyin: 'Nǐ hǎo! Nǐ píngshí zhōumò yìbān zěnme ānpái?',
      vi: 'Xin chào! Bình thường cuối tuần bạn hay sắp xếp thế nào?',
      en: 'Hello! How do you usually spend your weekends?',
    },
  },
  'Food': {
    'HSK 1': {
      chinese: '你好！你喜欢吃什么中国菜？',
      pinyin: 'Nǐ hǎo! Nǐ xǐhuan chī shénme zhōngguó cài?',
      vi: 'Xin chào! Bạn thích ăn món Trung Quốc nào?',
      en: 'Hello! What Chinese food do you like?',
    },
    'HSK 2': {
      chinese: '你喜欢喝茶还是喜欢喝咖啡？',
      pinyin: 'Nǐ xǐhuan hē chá háishì xǐhuan hē kāfēi?',
      vi: 'Bạn thích uống trà hay thích uống cà phê hơn?',
      en: 'Do you prefer drinking tea or coffee?',
    },
    'HSK 3': {
      chinese: '你平时喜欢自己做饭，还是喜欢在外面吃？',
      pinyin: 'Nǐ píngshí xǐhuan zìjǐ zuòfàn, háishì xǐhuan zài wàimiàn chī?',
      vi: 'Bình thường bạn thích tự nấu cơm hay thích đi ăn ngoài hàng?',
      en: 'Do you usually prefer cooking at home or eating out?',
    },
  },
  'Travel': {
    'HSK 1': {
      chinese: '你去过中国吗？',
      pinyin: 'Nǐ qù guò zhōngguó ma?',
      vi: 'Bạn đã từng đến Trung Quốc chưa?',
      en: 'Have you been to China before?',
    },
    'HSK 2': {
      chinese: '如果有假期的时侯，你想去哪里旅游？',
      pinyin: 'Rúguǒ yǒu jiàqī de shíhou, nǐ xiǎng qù nǎlǐ lǚyóu?',
      vi: 'Nếu có kỳ nghỉ, bạn muốn đi du lịch ở đâu?',
      en: 'If you have a vacation, where would you like to travel?',
    },
    'HSK 3': {
      chinese: '去旅行的时候，你更喜欢坐飞机还是坐高铁？为什么？',
      pinyin: 'Qù lǚxíng de shíhou, nǐ gèng xǐhuan zuò fēijī háishì zuò gāotiě? Wèishénme?',
      vi: 'Khi đi du lịch, bạn thích đi máy bay hay đi tàu cao tốc hơn? Vì sao?',
      en: 'When traveling, do you prefer taking a plane or high-speed rail?',
    },
  },
  'Work': {
    'HSK 1': {
      chinese: '你工作忙不忙？',
      pinyin: 'Nǐ gōngzuò máng bu máng?',
      vi: 'Công việc của bạn có bận không?',
      en: 'Is your work busy?',
    },
    'HSK 2': {
      chinese: '你觉得你的工作有意思吗？',
      pinyin: 'Nǐ juéde nǐ de gōngzuò yǒuyìsi ma?',
      vi: 'Bạn thấy công việc của bạn có thú vị không?',
      en: 'Do you find your work interesting?',
    },
    'HSK 3': {
      chinese: '在工作中，你最享受哪一部分？',
      pinyin: 'Zài gōngzuò zhōng, nǐ zuì xiǎngshòu nǎ yí bùfen?',
      vi: 'Trong công việc, bạn thích nhất phần nào?',
      en: 'At work, which part do you enjoy the most?',
    },
  },
  'Free Conversation': {
    'HSK 1': {
      chinese: '你好！很高兴和你聊天。你想聊什么？',
      pinyin: 'Nǐ hǎo! Hěn gāoxìng hé nǐ liáotiān. Nǐ xiǎng liáo shénme?',
      vi: 'Xin chào! Rất vui được trò chuyện với bạn. Bạn muốn nói về điều gì?',
      en: 'Hello! Nice to chat with you. What would you like to talk about?',
    },
    'HSK 2': {
      chinese: '你好！今天有什么新鲜事想和我分享吗？',
      pinyin: 'Nǐ hǎo! Jīntiān yǒu shénme xīnxiān shì xiǎng hé wǒ fēnxiǎng ma?',
      vi: 'Xin chào! Hôm nay có chuyện gì mới muốn chia sẻ cùng mình không?',
      en: 'Hello! Any fresh news or stories you want to share today?',
    },
    'HSK 3': {
      chinese: '你好！随便聊聊吧。最近有什么事情让你印象深刻吗？',
      pinyin: 'Nǐ hǎo! Suíbiàn liáo liao ba. Zuìjìn yǒu shénme shìqing ràng nǐ yìnxiàng shēnkè ma?',
      vi: 'Chào bạn! Cứ thoải mái trò chuyện nhé. Dạo này có việc gì khiến bạn ấn tượng sâu sắc không?',
      en: 'Hello! Let us chat freely. Has anything left a deep impression on you recently?',
    },
  },
};

class GeminiSpeakingService {
  private readonly pronunciationProvider = new GeminiPronunciationProvider();
  public getInitialPrompt(
    topic: string,
    level: string = 'HSK 1',
    nativeLang: string = 'vi'
  ): { chinese: string; pinyin: string; translation: string } {
    const topicGroup = TOPIC_STARTERS[topic] || TOPIC_STARTERS['Free Conversation'];
    const matched = topicGroup[level] || topicGroup['HSK 1'] || {
      chinese: `你好！我们来聊聊关于"${topic}"的话题吧。`,
      pinyin: `Nǐ hǎo! Wǒmen lái liáo liao guānyú "${topic}" de huàtí ba.`,
      vi: `Xin chào! Chúng ta cùng trò chuyện về chủ đề "${topic}" nhé.`,
      en: `Hello! Let's chat about "${topic}".`,
    };

    return {
      chinese: matched.chinese,
      pinyin: matched.pinyin,
      translation: nativeLang === 'vi' ? matched.vi : matched.en,
    };
  }

  public async analyzeSpeaking(input: SpeakingAnalysisInput): Promise<SpeakingAnalysis> {
    // Delegate directly to the unified Gemini Service without swallowing errors
    return await geminiService.analyzeSpeaking({
      userText: input.userText,
      targetLevel: input.targetLevel,
      topic: input.topic,
      conversationHistory: input.conversationHistory,
      nativeLanguage: input.nativeLanguage,
      difficulty: input.difficulty,
      memory: input.memory,
    });
  }

  public async assessPronunciation(params: {
    spokenText: string;
    targetText?: string;
    audio?: Blob | null;
  }): Promise<PronunciationAssessment> {
    return this.pronunciationProvider.assess({
      spokenText: params.spokenText,
      targetText: params.targetText,
      language: 'vi',
      audio: params.audio
        ? { blob: params.audio, mimeType: params.audio.type || 'audio/webm' }
        : null,
    });
  }
}

export const geminiSpeakingService = new GeminiSpeakingService();