// Mock AI Service Fallback for HanziAI
// Implements the identical AIService interface to guarantee 100% offline & keyless functionality.

import { AIService } from './geminiService';
import { SpeakingAnalysis, createFallbackSpeakingAnalysis } from '../ai/schemas/speakingSchema';

export class MockGeminiService implements AIService {
  async analyzeSpeaking(params: {
    userText: string;
    targetLevel?: string;
    topic?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; chinese: string }>;
    nativeLanguage?: string;
    difficulty?: 'easy' | 'normal' | 'challenge';
    memory?: any;
  }): Promise<SpeakingAnalysis> {
    const {
      userText = '',
      targetLevel = 'HSK 1',
      topic = 'Daily Life',
      nativeLanguage = 'vi',
      memory,
    } = params;

    const isVi = nativeLanguage === 'vi';
    const text = userText.trim();

    // Check for memory facts if user asks "你记得...吗"
    if (text.includes('记得') || text.includes('remember') || text.includes('nhớ')) {
      const knownFacts = memory?.keyFacts || [];
      if (knownFacts.length > 0) {
        // Find latest preference or name
        const factText = knownFacts[knownFacts.length - 1];
        return {
          reply: `我当然记得！${factText}。你今天过得怎么样？`,
          pinyin: 'Wǒ dāngrán jìde! Nǐ jīntiān guò de zěnmeyàng?',
          translation: isVi
            ? `Mình đương nhiên nhớ chứ! ${factText}. Hôm nay bạn cảm thấy thế nào?`
            : `Of course I remember! ${factText}. How has your day been?`,
          question: '你今天过得怎么样？',
          corrections: [],
          vocabulary: [
            { hanzi: '当然', pinyin: 'dāngrán', meaning: isVi ? 'đương nhiên, tất nhiên' : 'of course', hskLevel: 'HSK 2' },
            { hanzi: '记得', pinyin: 'jìde', meaning: isVi ? 'nhớ' : 'to remember', hskLevel: 'HSK 2' },
          ],
          grammarNote: null,
          encouragement: isVi ? 'Bạn đặt câu hỏi tương tác rất tự nhiên!' : 'Great natural interactive question!',
          followUpQuestion: undefined,
          clarityScore: 5,
          grammarScore: 5,
          vocabularyScore: 5,
          naturalnessScore: 5,
        };
      }
    }

    // Name introduction
    if (text.includes('我叫') || text.includes('我的名字')) {
      const name = text.replace(/.*(?:我叫|名字(?:是|叫))\s*/, '').replace(/[,.!?，。！？]/g, '') || '朋友';
      return {
        reply: `你好，${name}！很高兴认识你。你学习中文多长时间了？`,
        pinyin: `Nǐ hǎo, ${name}! Hěn gāoxìng rènshi nǐ. Nǐ xué zhōngwén duō cháng shíjiān le?`,
        translation: isVi
          ? `Chào ${name}! Rất vui được làm quen với bạn. Bạn học tiếng Trung được bao lâu rồi?`
          : `Hello, ${name}! Nice to meet you. How long have you been studying Chinese?`,
        question: '你学习中文多长时间了？',
        corrections: [],
        vocabulary: [
          { hanzi: '认识', pinyin: 'rènshi', meaning: isVi ? 'làm quen, quen biết' : 'to meet / know', hskLevel: 'HSK 1' },
          { hanzi: '高兴', pinyin: 'gāoxìng', meaning: isVi ? 'vui mừng' : 'happy', hskLevel: 'HSK 1' },
        ],
        grammarNote: isVi
          ? "Trong tiếng Trung, '很高兴认识你' (Hěn gāoxìng rènshi nǐ) là cách chào hỏi xã giao lịch sự khi mới làm quen."
          : null,
        encouragement: isVi ? 'Chào hỏi rất lưu loát và thân thiện!' : 'Very natural and friendly greeting!',
        followUpQuestion: undefined,
        clarityScore: 5,
        grammarScore: 5,
        vocabularyScore: 4,
        naturalnessScore: 5,
      };
    }

    // Preference detection (e.g. food/hotpot/duck)
    if (text.includes('喜欢')) {
      return {
        reply: `太好了！我也很喜欢这个。你平时经常吃或者做这个吗？`,
        pinyin: `Tài hǎo le! Wǒ yě hěn xǐhuan zhège. Nǐ píngshí jīngcháng chī huòzhě zuò zhège ma?`,
        translation: isVi
          ? `Tuyệt quá! Mình cũng rất thích món này. Bình thường bạn có hay ăn hay tự làm không?`
          : `Awesome! I like that too. Do you often eat or make it?`,
        question: '你平时经常吃或者做这个吗？',
        corrections: [],
        vocabulary: [
          { hanzi: '经常', pinyin: 'jīngcháng', meaning: isVi ? 'thường xuyên' : 'often', hskLevel: 'HSK 2' },
          { hanzi: '或者', pinyin: 'huòzhě', meaning: isVi ? 'hoặc là' : 'or', hskLevel: 'HSK 2' },
        ],
        grammarNote: null,
        encouragement: isVi ? 'Cách dùng động từ 喜欢 (thích) rất chuẩn xác!' : 'Great use of the verb 喜欢 (to like)!',
        followUpQuestion: undefined,
        clarityScore: 5,
        grammarScore: 5,
        vocabularyScore: 4,
        naturalnessScore: 5,
      };
    }

    // Grammar correction simulation if user says something with typical error (e.g., 不了 vs 没)
    if (text.includes('不了') || (text.includes('昨天') && text.includes('不'))) {
      return {
        reply: `原来是这样！昨天的事情我们通常用“没”来否定哦。那你今天感觉怎么样？`,
        pinyin: `Yuánlái shì zhèyàng! Zuótiān de shìqing wǒmen tōngcháng yòng "méi" lái fǒudìng o. Nà jīntiān nǐ gǎnjué zěnmeyàng?`,
        translation: isVi
          ? `Hóa ra là vậy! Những sự việc đã xảy ra trong quá khứ thường dùng "没" để phủ định nhé. Thế hôm nay bạn cảm thấy thế nào?`
          : `I see! For past actions, we usually use "没" to negate. How do you feel today?`,
        question: '那你今天感觉怎么样？',
        corrections: [
          {
            original: text,
            corrected: text.replace('不', '没'),
            explanation: isVi
              ? "Trong quá khứ, dùng '没' (méi) thay vì '不' (bù) khi phủ định hành động."
              : "Use '没' instead of '不' to negate past actions.",
          },
        ],
        vocabulary: [
          { hanzi: '原来', pinyin: 'yuánlái', meaning: isVi ? 'hóa ra là' : 'as it turns out', hskLevel: 'HSK 3' },
          { hanzi: '事情', pinyin: 'shìqing', meaning: isVi ? 'sự việc, chuyện' : 'matter, thing', hskLevel: 'HSK 2' },
        ],
        grammarNote: isVi
          ? "Lưu ý ngữ pháp: '不' dùng cho hiện tại/tương lai hoặc thói quen; '没' dùng cho hành động chưa hoặc không diễn ra trong quá khứ."
          : null,
        encouragement: isVi ? 'Sai một chút không sao cả, bạn đang tiến bộ rất nhanh!' : 'A small slip is fine, you are making fast progress!',
        followUpQuestion: undefined,
        clarityScore: 4,
        grammarScore: 3,
        vocabularyScore: 4,
        naturalnessScore: 4,
      };
    }

    // Default pleasant conversational reply
    return createFallbackSpeakingAnalysis(text, topic, targetLevel, nativeLanguage);
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

  async correctChinese(sentence: string, _level: string = 'HSK 1'): Promise<any> {
    return {
      isCorrect: true,
      original: sentence,
      naturalVersion: sentence,
      pinyin: '',
      explanation: 'Câu diễn đạt tự nhiên và rõ ràng.',
    };
  }

  async translateChinese(text: string): Promise<any> {
    return {
      translation: `[Bản dịch] ${text}`,
    };
  }

  async summarizeMemory(memory: any): Promise<{ summary: string; keyFacts: string[] }> {
    return {
      summary: memory?.summary || 'Learner practicing Chinese conversation.',
      keyFacts: memory?.keyFacts || [],
    };
  }
}

export const mockGeminiService = new MockGeminiService();
