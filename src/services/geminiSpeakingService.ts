// Gemini AI Speaking & Conversation Service for HanziAI
// Follows strict rules for Teacher Lina and structured JSON communication

import { geminiService } from './geminiService';
import type { ConversationMemory } from '../ai/memory/conversationMemory';
import type { SpeakingAnalysis, TutorMode } from '../ai/schemas/speakingSchema';


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
  mode?: TutorMode;
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
      en: 'When traveling, do you prefer taking a plane or high-speed rail? Why?',
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

export const HSK_SPEAKING_PROFILES: Record<string, {
  vocabularyTarget: string;
  pace: string;
  responseDepth: string;
  coachingFocus: string;
}> = {
  'HSK 1': {
    vocabularyTarget: 'Từ vựng nền khoảng 150 từ; ưu tiên từ thông dụng và mẫu câu cố định.',
    pace: 'Chậm, rõ, từng câu ngắn.',
    responseDepth: 'Một ý chính mỗi lượt, câu đơn và câu hỏi quen thuộc.',
    coachingFocus: 'Phát âm dễ hiểu, trật tự câu cơ bản, phản xạ chào hỏi và đời sống.',
  },
  'HSK 2': {
    vocabularyTarget: 'Khoảng 300 từ; mở rộng giao tiếp hàng ngày, mua sắm, thời gian và di chuyển.',
    pace: 'Tự nhiên nhưng vẫn rõ ràng.',
    responseDepth: 'Một đến hai câu, có thể nối hai ý đơn giản.',
    coachingFocus: 'Tăng độ trôi chảy, dùng mẫu câu đời thường và sửa lỗi quan trọng.',
  },
  'HSK 3': {
    vocabularyTarget: 'Khoảng 600 từ; ưu tiên du lịch, công việc và diễn đạt trải nghiệm.',
    pace: 'Tự nhiên, khuyến khích phản xạ liên tục.',
    responseDepth: 'Hai đến ba câu, biết giải thích và kể lại trải nghiệm.',
    coachingFocus: 'Mở rộng ý, liên kết câu, giải thích nguyên nhân và nêu quan điểm.',
  },
  'HSK 4': {
    vocabularyTarget: 'Khoảng 1200 từ; đa chủ đề đời sống, xã hội và công việc.',
    pace: 'Tự nhiên, gần hội thoại thực tế.',
    responseDepth: 'Hai đến ba câu có liên kết logic.',
    coachingFocus: 'Lập luận nhẹ, phản hồi ý kiến khác và dùng cấu trúc câu phức.',
  },
  'HSK 5': {
    vocabularyTarget: 'Khoảng 2500 từ; báo chí, phim ảnh, kinh doanh và chủ đề trừu tượng.',
    pace: 'Tăng phản xạ, giảm phụ thuộc vào câu mẫu.',
    responseDepth: 'Ba câu trở lên khi cần, có giải thích và ví dụ.',
    coachingFocus: 'Phân tích, tóm tắt, thuyết trình và sắc thái từ vựng.',
  },
  'HSK 6': {
    vocabularyTarget: '5000+ từ; ngôn ngữ chuyên sâu, học thuật và sắc thái.',
    pace: 'Tăng phản xạ, ưu tiên tự nhiên như hội thoại nâng cao.',
    responseDepth: 'Lập luận nhiều lớp, diễn đạt linh hoạt và tinh tế.',
    coachingFocus: 'Sắc thái, thành ngữ, văn phong, lập luận và diễn đạt gần tự nhiên.',
  },
};

const LEVEL_STARTERS: Record<string, { chinese: string; pinyin: string; vi: string; en: string }> = {
  'HSK 4': {
    chinese: '我们来深入聊聊这个话题。你觉得它对日常生活有什么影响？',
    pinyin: 'Wǒmen lái shēnrù liáo liao zhège huàtí. Nǐ juéde tā duì rìcháng shēnghuó yǒu shénme yǐngxiǎng?',
    vi: 'Chúng ta cùng thảo luận sâu hơn về chủ đề này nhé. Bạn nghĩ nó ảnh hưởng thế nào đến cuộc sống hàng ngày?',
    en: 'Let’s discuss this topic in more depth. How do you think it affects daily life?',
  },
  'HSK 5': {
    chinese: '我们从更深入的角度来讨论这个话题。你认为最值得关注的问题是什么？',
    pinyin: 'Wǒmen cóng gèng shēnrù de jiǎodù lái tǎolùn zhège huàtí. Nǐ rènwéi zuì zhíde guānzhù de wèntí shì shénme?',
    vi: 'Chúng ta hãy thảo luận chủ đề này ở góc nhìn sâu hơn. Theo bạn, vấn đề đáng chú ý nhất là gì?',
    en: 'Let’s discuss this topic from a deeper perspective. What issue deserves the most attention?',
  },
  'HSK 6': {
    chinese: '我们来探讨这个话题背后的原因和不同观点。你会如何评价其中最关键的问题？',
    pinyin: 'Wǒmen lái tàntǎo zhège huàtí bèihòu de yuányīn hé bùtóng guāndiǎn. Nǐ huì rúhé píngjià qízhōng zuì guānjiàn de wèntí?',
    vi: 'Chúng ta cùng khám phá nguyên nhân và các góc nhìn phía sau chủ đề này. Bạn sẽ đánh giá vấn đề then chốt nhất như thế nào?',
    en: 'Let’s explore the reasons and different perspectives behind this topic. How would you evaluate the key issue?',
  },
};

class GeminiSpeakingService {
  public getInitialPrompt(
    topic: string,
    level: string = 'HSK 1',
    nativeLang: string = 'vi'
  ): { chinese: string; pinyin: string; translation: string } {
    const topicGroup = TOPIC_STARTERS[topic] || TOPIC_STARTERS['Free Conversation'];
    const matched = topicGroup[level]
      || LEVEL_STARTERS[level]
      || {
        chinese: `我们来聊聊“${topic}”这个话题吧。`,
        pinyin: `Wǒmen lái liáo liao “${topic}” zhège huàtí ba.`,
        vi: `Chúng ta cùng trò chuyện về chủ đề “${topic}” nhé.`,
        en: `Let's talk about “${topic}”.`,
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
      mode: input.mode,
      memory: input.memory,
    });
  }
}

export const geminiSpeakingService = new GeminiSpeakingService();
