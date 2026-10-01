export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabularyItem {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel?: number | string;
}

export type TutorMode = 'conversation' | 'teacher';
export type TutorEmotion = 'neutral' | 'happy' | 'encouraging' | 'confused' | 'error';

export interface SpeakingAnalysis {
  reply: string;
  pinyin: string;
  translation: string;
  question?: string | null;
  corrections: Correction[];
  vocabulary: VocabularyItem[];
  grammarNote: string | null;
  encouragement: string;
  responseType?: 'conversation' | 'correction' | 'teaching' | 'roleplay';
  emotion?: TutorEmotion;
  followUpQuestion?: string;
  clarityScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  naturalnessScore?: number;
}

export const SPEAKING_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    pinyin: { type: "string" },
    translation: { type: "string" },
    question: { type: ["string", "null"] },
    corrections: { type: "array", items: { type: "object", properties: {
      original: { type: "string" }, corrected: { type: "string" }, explanation: { type: "string" }
    }, required: ["original", "corrected", "explanation"] } },
    vocabulary: { type: "array", items: { type: "object", properties: {
      hanzi: { type: "string" }, pinyin: { type: "string" }, meaning: { type: "string" },
      hskLevel: { type: ["number", "string"] }
    }, required: ["hanzi", "pinyin", "meaning"] } },
    grammarNote: { type: ["string", "null"] },
    encouragement: { type: "string" },
    responseType: { type: "string", enum: ["conversation", "correction", "teaching", "roleplay"] },
    emotion: { type: "string", enum: ["neutral", "happy", "encouraging", "confused", "error"] },
    clarityScore: { type: "number" }, grammarScore: { type: "number" },
    vocabularyScore: { type: "number" }, naturalnessScore: { type: "number" },
  },
  required: ["reply","pinyin","translation","corrections","vocabulary","grammarNote","encouragement"],
};

export function validateSpeakingResponse(data: any): { valid: boolean; data?: SpeakingAnalysis; error?: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Response is not an object' };
  if (typeof data.reply !== 'string' || !data.reply.trim()) return { valid: false, error: 'Missing or empty reply' };
  if (typeof data.pinyin !== 'string') data.pinyin = '';
  if (typeof data.translation !== 'string') data.translation = '';
  if (!Array.isArray(data.corrections)) data.corrections = [];
  else data.corrections = data.corrections.filter((c: any) => c && typeof c.original === 'string' && typeof c.corrected === 'string');
  if (!Array.isArray(data.vocabulary)) data.vocabulary = [];
  else data.vocabulary = data.vocabulary.filter((v: any) => v && typeof v.hanzi === 'string' && typeof v.meaning === 'string');
  if (data.grammarNote !== null && typeof data.grammarNote !== 'string') data.grammarNote = null;
  if (typeof data.encouragement !== 'string') data.encouragement = 'Bạn đang nói rất tự nhiên, cố lên nhé!';
  const singleQuestion = typeof data.question === 'string' && data.question.trim()
    ? data.question.trim()
    : (data.reply.match(/([^。！!]*[？?])/)?.[1]?.trim() || null);
  const clamp = (val: any, def: number) => {
    const num = Number(val);
    return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.round(num) : def;
  };
  const validEmotions = new Set(['neutral','happy','encouraging','confused','error']);
  const emotion = validEmotions.has(data.emotion) ? data.emotion : 'neutral';
  return { valid: true, data: {
    reply: data.reply.trim(), pinyin: data.pinyin.trim(), translation: data.translation.trim(),
    question: singleQuestion, corrections: data.corrections, vocabulary: data.vocabulary,
    grammarNote: data.grammarNote, encouragement: data.encouragement.trim(),
    responseType: ['conversation','correction','teaching','roleplay'].includes(data.responseType) ? data.responseType : undefined,
    emotion: emotion as TutorEmotion,
    followUpQuestion: undefined,
    clarityScore: clamp(data.clarityScore, 5), grammarScore: clamp(data.grammarScore, 4),
    vocabularyScore: clamp(data.vocabularyScore, 5), naturalnessScore: clamp(data.naturalnessScore, 4),
  }};
}

export function createFallbackSpeakingAnalysis(userText: string, topic: string = 'Daily Life', _level: string = 'HSK 1', nativeLang: string = 'vi'): SpeakingAnalysis {
  const isVi = nativeLang === 'vi';
  return {
    reply: `听起来很有意思！关于${topic}，你平时最喜欢做什么呢？`,
    pinyin: `Tīng qǐlái hěn yǒu yìsi! Guānyú ${topic}, nǐ píngshí zuì xǐhuan zuò shénme ne?`,
    translation: isVi ? `Nghe rất thú vị! Về chủ đề ${topic}, bình thường bạn thích làm gì nhất?` : `Sounds very interesting! Regarding ${topic}, what do you usually like to do most?`,
    question: `关于${topic}，你平时最喜欢做什么呢？`, corrections: [], vocabulary: [],
    grammarNote: null, encouragement: isVi ? 'Bạn đã diễn đạt câu rất tốt và tự tin!' : 'You expressed that very clearly and confidently!',
    emotion: 'encouraging', clarityScore: 5, grammarScore: 4, vocabularyScore: 4, naturalnessScore: 4,
  };
}
