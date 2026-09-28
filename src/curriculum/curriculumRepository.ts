import {
  Curriculum, HSKLevelInfo, CurriculumUnit, Lesson, LessonSection, Vocabulary, GrammarPoint, QuizQuestion, HSKLevelNumber,
} from '../types/curriculum';
import { HSK_CURRICULUM, HSK_LEVELS_INFO, CURRICULUM_UNITS } from './curriculumData';
import { ALL_VOCABULARY, ALL_GRAMMAR_POINTS } from './vocabularyAndGrammarData';
import { ALL_CURRICULUM_LESSONS, LESSON_VOCABULARY_MAP, LESSON_DIALOGUES, LESSON_QUIZZES } from './lessonsData';
import { EXPANDED_CURRICULUM_LESSONS, EXPANDED_LESSON_DIALOGUES, EXPANDED_LESSON_QUIZZES } from './expandedLessonsData';
import { EXPANDED_LESSON_VOCABULARY, EXPANDED_LESSON_VOCABULARY_MAP } from './expandedLessonVocabData';
import { DEEP_EXPANDED_LESSON_DIALOGUES, DEEP_EXPANDED_LESSON_QUIZZES } from './deepExpandedLessonData';
import { DEEP_EXPANDED_GRAMMAR } from './deepGrammarData';

export interface CurriculumRepository {
  getCurriculum(): Promise<Curriculum>; getLevels(): Promise<HSKLevelInfo[]>; getLevel(levelNumber: HSKLevelNumber): Promise<HSKLevelInfo | null>;
  getUnits(levelNumber: HSKLevelNumber): Promise<CurriculumUnit[]>; getUnit(unitId: string): Promise<CurriculumUnit | null>;
  getLessons(unitId: string): Promise<Lesson[]>; getAllLessons(): Promise<Lesson[]>; getLesson(lessonId: string): Promise<Lesson | null>;
  getLessonSections(lessonId: string): Promise<LessonSection[]>; getVocabularyForLesson(lessonId: string): Promise<Vocabulary[]>;
  getGrammarForLesson(lessonId: string): Promise<GrammarPoint[]>; getQuiz(lessonId: string): Promise<QuizQuestion[]>;
  getAllVocabulary(level?: HSKLevelNumber): Promise<Vocabulary[]>; searchVocabulary(query: string): Promise<Vocabulary[]>; searchLessons(query: string): Promise<Lesson[]>;
}

const CURRICULUM_LESSONS = [...ALL_CURRICULUM_LESSONS, ...EXPANDED_CURRICULUM_LESSONS];
const CURRICULUM_VOCABULARY = [...ALL_VOCABULARY, ...EXPANDED_LESSON_VOCABULARY];
const CURRICULUM_VOCABULARY_MAP = [...LESSON_VOCABULARY_MAP, ...EXPANDED_LESSON_VOCABULARY_MAP];
const CURRICULUM_QUIZZES: Record<string, QuizQuestion[]> = { ...LESSON_QUIZZES, ...EXPANDED_LESSON_QUIZZES };
const CURRICULUM_DIALOGUES: Record<string, any[]> = { ...LESSON_DIALOGUES, ...EXPANDED_LESSON_DIALOGUES };

const DEEP_GRAMMAR_BY_LESSON: Record<string, string[]> = {
  'lesson-hsk1-u1-l3-family': ['grammar-hsk1-de-01'],
  'lesson-hsk1-u1-l4-daily-time': ['grammar-hsk1-de-02'],
  'lesson-hsk2-u1-l3-shopping': ['grammar-hsk2-de-01'],
  'lesson-hsk2-u1-l4-health': ['grammar-hsk2-de-02'],
  'lesson-hsk3-u1-l3-work-life': ['grammar-hsk3-de-01'],
  'lesson-hsk3-u1-l4-opinions': ['grammar-hsk3-de-02'],
  'lesson-hsk4-u1-l3-communication': ['grammar-hsk4-de-01'],
  'lesson-hsk4-u1-l4-environment': ['grammar-hsk4-de-02'],
  'lesson-hsk5-u1-l3-media': ['grammar-hsk5-de-01'],
  'lesson-hsk5-u1-l4-business': ['grammar-hsk5-de-02'],
  'lesson-hsk6-u1-l3-academic': ['grammar-hsk6-de-01'],
  'lesson-hsk6-u1-l4-nuance': ['grammar-hsk6-de-02'],
};

export class InMemoryCurriculumRepository implements CurriculumRepository {
  async getCurriculum(): Promise<Curriculum> { return HSK_CURRICULUM; }
  async getLevels(): Promise<HSKLevelInfo[]> { return HSK_LEVELS_INFO; }
  async getLevel(levelNumber: HSKLevelNumber): Promise<HSKLevelInfo | null> { return HSK_LEVELS_INFO.find((l) => l.level === levelNumber) || null; }
  async getUnits(levelNumber: HSKLevelNumber): Promise<CurriculumUnit[]> { return CURRICULUM_UNITS.filter((u) => u.levelNumber === levelNumber).sort((a, b) => a.order - b.order); }
  async getUnit(unitId: string): Promise<CurriculumUnit | null> { return CURRICULUM_UNITS.find((u) => u.id === unitId) || null; }
  async getLessons(unitId: string): Promise<Lesson[]> { return CURRICULUM_LESSONS.filter((l) => l.unitId === unitId && l.status === 'published').sort((a, b) => a.order - b.order); }
  async getAllLessons(): Promise<Lesson[]> { return CURRICULUM_LESSONS.filter((l) => l.status === 'published'); }
  async getLesson(lessonId: string): Promise<Lesson | null> { return CURRICULUM_LESSONS.find((l) => l.id === lessonId) || null; }
  async getVocabularyForLesson(lessonId: string): Promise<Vocabulary[]> {
    const mappings = CURRICULUM_VOCABULARY_MAP.filter((m) => m.lessonId === lessonId).sort((a, b) => a.order - b.order);
    const vocabIds = mappings.map((m) => m.vocabularyId);
    return CURRICULUM_VOCABULARY.filter((v) => vocabIds.includes(v.id));
  }
  async getGrammarForLesson(lessonId: string): Promise<GrammarPoint[]> {
    const deepIds = DEEP_GRAMMAR_BY_LESSON[lessonId] || [];
    const deep = DEEP_EXPANDED_GRAMMAR.filter((g) => deepIds.includes(g.id));
    const lesson = await this.getLesson(lessonId); if (!lesson) return deep;
    const core = ALL_GRAMMAR_POINTS.filter((g) => g.level === lesson.levelNumber);
    return [...deep, ...core];
  }
  async getQuiz(lessonId: string): Promise<QuizQuestion[]> {
    const questions = [...(CURRICULUM_QUIZZES[lessonId] || []), ...(DEEP_EXPANDED_LESSON_QUIZZES[lessonId] || [])].sort((a, b) => a.order - b.order);
    const ids = (await this.getVocabularyForLesson(lessonId)).map((v) => v.id);
    const grammarIds = (DEEP_GRAMMAR_BY_LESSON[lessonId] || []);
    return questions.map((question, index) => ({ ...question, vocabularyIds: question.vocabularyIds.length > 0 ? question.vocabularyIds : ids.slice(index % Math.max(ids.length, 1), index % Math.max(ids.length, 1) + 2), grammarPointIds: question.grammarPointIds?.length ? question.grammarPointIds : grammarIds }));
  }
  async getLessonSections(lessonId: string): Promise<LessonSection[]> {
    const lesson = await this.getLesson(lessonId); if (!lesson) return [];
    const vocab = await this.getVocabularyForLesson(lessonId); const grammar = await this.getGrammarForLesson(lessonId);
    const dialogue = [...(CURRICULUM_DIALOGUES[lessonId] || []), ...(DEEP_EXPANDED_LESSON_DIALOGUES[lessonId] || [])]; const quiz = await this.getQuiz(lessonId); const deepGrammar = DEEP_EXPANDED_GRAMMAR.filter((g) => (DEEP_GRAMMAR_BY_LESSON[lessonId] || []).includes(g.id));
    const sections: LessonSection[] = []; let order = 1;
    sections.push({ id: `${lessonId}-sec-intro`, lessonId, order: order++, type: 'intro', title: 'Mục tiêu bài học', content: { objectives: lesson.objectives, description: lesson.description }, estimatedMinutes: 2, isRequired: true });
    if (vocab.length) sections.push({ id: `${lessonId}-sec-vocab`, lessonId, order: order++, type: 'vocabulary', title: `Từ vựng cốt lõi (${vocab.length} từ)`, content: { items: vocab }, estimatedMinutes: Math.min(10, Math.max(5, Math.ceil(vocab.length / 2))), isRequired: true });
    if (grammar.length) sections.push({ id: `${lessonId}-sec-grammar`, lessonId, order: order++, type: 'grammar', title: `Điểm ngữ pháp (${grammar.length} cấu trúc)`, content: { items: grammar, deepPractice: deepGrammar }, estimatedMinutes: Math.min(8, Math.max(4, deepGrammar.length * 3)), isRequired: true });
    if (dialogue.length) sections.push({ id: `${lessonId}-sec-dialogue`, lessonId, order: order++, type: 'dialogue', title: 'Hội thoại mẫu với Lina 老师', content: { lines: dialogue }, estimatedMinutes: Math.min(8, Math.max(3, Math.ceil(dialogue.length / 2))), isRequired: true });
    sections.push({ id: `${lessonId}-sec-speaking`, lessonId, order: order++, type: 'speaking', title: 'Mission · Luyện nói thực chiến AI', content: { topic: lesson.title, level: `HSK ${lesson.levelNumber}`, recommendedSentences: dialogue.slice(-4).map((item) => item.chinese), grammarPointIds: deepGrammar.map((g) => g.id) }, estimatedMinutes: 5, isRequired: false });
    if (quiz.length) sections.push({ id: `${lessonId}-sec-quiz`, lessonId, order: order++, type: 'quiz', title: `Kiểm tra vượt ải (${quiz.length} câu)`, content: { questions: quiz, passingScore: lesson.passingScore }, estimatedMinutes: Math.min(12, Math.max(5, quiz.length)), isRequired: true });
    sections.push({ id: `${lessonId}-sec-summary`, lessonId, order: order++, type: 'summary', title: 'Tổng kết bài học & Hoàn thành', content: { lessonTitle: lesson.title, masteredGrammar: deepGrammar.map((g) => g.title) }, estimatedMinutes: 1, isRequired: true });
    return sections;
  }
  async getAllVocabulary(level?: HSKLevelNumber): Promise<Vocabulary[]> { return level ? CURRICULUM_VOCABULARY.filter((v) => v.hskLevel === level) : CURRICULUM_VOCABULARY; }
  async searchVocabulary(query: string): Promise<Vocabulary[]> { const q = query.trim().toLowerCase(); if (!q) return []; return CURRICULUM_VOCABULARY.filter((v) => v.hanzi.includes(q) || v.pinyin.toLowerCase().includes(q) || v.meaningVi.toLowerCase().includes(q)); }
  async searchLessons(query: string): Promise<Lesson[]> { const q = query.trim().toLowerCase(); if (!q) return []; return CURRICULUM_LESSONS.filter((l) => l.isPublished && (l.title.toLowerCase().includes(q) || l.titleZh.includes(q) || l.description.toLowerCase().includes(q))); }
}
export const curriculumRepository: CurriculumRepository = new InMemoryCurriculumRepository();