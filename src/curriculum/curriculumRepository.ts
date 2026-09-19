import {
  Curriculum,
  HSKLevelInfo,
  CurriculumUnit,
  Lesson,
  LessonSection,
  Vocabulary,
  GrammarPoint,
  QuizQuestion,
  HSKLevelNumber,
} from '../types/curriculum';
import { HSK_CURRICULUM, HSK_LEVELS_INFO, CURRICULUM_UNITS } from './curriculumData';
import { ALL_VOCABULARY, ALL_GRAMMAR_POINTS } from './vocabularyAndGrammarData';
import {
  ALL_CURRICULUM_LESSONS,
  LESSON_VOCABULARY_MAP,
  LESSON_DIALOGUES,
  LESSON_QUIZZES,
} from './lessonsData';

export interface CurriculumRepository {
  getCurriculum(): Promise<Curriculum>;
  getLevels(): Promise<HSKLevelInfo[]>;
  getLevel(levelNumber: HSKLevelNumber): Promise<HSKLevelInfo | null>;
  getUnits(levelNumber: HSKLevelNumber): Promise<CurriculumUnit[]>;
  getUnit(unitId: string): Promise<CurriculumUnit | null>;
  getLessons(unitId: string): Promise<Lesson[]>;
  getAllLessons(): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  getLessonSections(lessonId: string): Promise<LessonSection[]>;
  getVocabularyForLesson(lessonId: string): Promise<Vocabulary[]>;
  getGrammarForLesson(lessonId: string): Promise<GrammarPoint[]>;
  getQuiz(lessonId: string): Promise<QuizQuestion[]>;
  getAllVocabulary(level?: HSKLevelNumber): Promise<Vocabulary[]>;
  searchVocabulary(query: string): Promise<Vocabulary[]>;
  searchLessons(query: string): Promise<Lesson[]>;
}

export class InMemoryCurriculumRepository implements CurriculumRepository {
  async getCurriculum(): Promise<Curriculum> {
    return HSK_CURRICULUM;
  }

  async getLevels(): Promise<HSKLevelInfo[]> {
    return HSK_LEVELS_INFO;
  }

  async getLevel(levelNumber: HSKLevelNumber): Promise<HSKLevelInfo | null> {
    return HSK_LEVELS_INFO.find((l) => l.level === levelNumber) || null;
  }

  async getUnits(levelNumber: HSKLevelNumber): Promise<CurriculumUnit[]> {
    return CURRICULUM_UNITS.filter((u) => u.levelNumber === levelNumber).sort(
      (a, b) => a.order - b.order
    );
  }

  async getUnit(unitId: string): Promise<CurriculumUnit | null> {
    return CURRICULUM_UNITS.find((u) => u.id === unitId) || null;
  }

  async getLessons(unitId: string): Promise<Lesson[]> {
    return ALL_CURRICULUM_LESSONS.filter(
      (l) => l.unitId === unitId && l.status === 'published'
    ).sort((a, b) => a.order - b.order);
  }

  async getAllLessons(): Promise<Lesson[]> {
    return ALL_CURRICULUM_LESSONS.filter((l) => l.status === 'published');
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    return ALL_CURRICULUM_LESSONS.find((l) => l.id === lessonId) || null;
  }

  async getVocabularyForLesson(lessonId: string): Promise<Vocabulary[]> {
    const mappings = LESSON_VOCABULARY_MAP.filter((m) => m.lessonId === lessonId).sort(
      (a, b) => a.order - b.order
    );
    const vocabIds = mappings.map((m) => m.vocabularyId);
    return ALL_VOCABULARY.filter((v) => vocabIds.includes(v.id));
  }

  async getGrammarForLesson(lessonId: string): Promise<GrammarPoint[]> {
    const lesson = await this.getLesson(lessonId);
    if (!lesson) return [];
    // Return relevant level grammar points
    return ALL_GRAMMAR_POINTS.filter((g) => g.level === lesson.levelNumber);
  }

  async getQuiz(lessonId: string): Promise<QuizQuestion[]> {
    return LESSON_QUIZZES[lessonId] || [];
  }

  async getLessonSections(lessonId: string): Promise<LessonSection[]> {
    const lesson = await this.getLesson(lessonId);
    if (!lesson) return [];

    const vocab = await this.getVocabularyForLesson(lessonId);
    const grammar = await this.getGrammarForLesson(lessonId);
    const dialogue = LESSON_DIALOGUES[lessonId] || [];
    const quiz = await this.getQuiz(lessonId);

    const sections: LessonSection[] = [];
    let order = 1;

    // 1. Objectives & Warm-up
    sections.push({
      id: `${lessonId}-sec-intro`,
      lessonId,
      order: order++,
      type: 'intro',
      title: 'Mục tiêu bài học',
      content: { objectives: lesson.objectives, description: lesson.description },
      estimatedMinutes: 2,
      isRequired: true,
    });

    // 2. Vocabulary section
    if (vocab.length > 0) {
      sections.push({
        id: `${lessonId}-sec-vocab`,
        lessonId,
        order: order++,
        type: 'vocabulary',
        title: `Từ vựng cốt lõi (${vocab.length} từ)`,
        content: { items: vocab },
        estimatedMinutes: 4,
        isRequired: true,
      });
    }

    // 3. Grammar section
    if (grammar.length > 0) {
      sections.push({
        id: `${lessonId}-sec-grammar`,
        lessonId,
        order: order++,
        type: 'grammar',
        title: `Điểm ngữ pháp (${grammar.length} cấu trúc)`,
        content: { items: grammar },
        estimatedMinutes: 4,
        isRequired: true,
      });
    }

    // 4. Dialogue section
    if (dialogue.length > 0) {
      sections.push({
        id: `${lessonId}-sec-dialogue`,
        lessonId,
        order: order++,
        type: 'dialogue',
        title: 'Hội thoại mẫu với Lina 老师',
        content: { lines: dialogue },
        estimatedMinutes: 3,
        isRequired: true,
      });
    }

    // 5. Speaking practice section
    sections.push({
      id: `${lessonId}-sec-speaking`,
      lessonId,
      order: order++,
      type: 'speaking',
      title: 'Luyện nói thực chiến AI',
      content: {
        topic: lesson.title,
        level: `HSK ${lesson.levelNumber}`,
        recommendedSentences: dialogue.slice(0, 2),
      },
      estimatedMinutes: 4,
      isRequired: false,
    });

    // 6. Quiz section
    if (quiz.length > 0) {
      sections.push({
        id: `${lessonId}-sec-quiz`,
        lessonId,
        order: order++,
        type: 'quiz',
        title: `Kiểm tra vượt ải (${quiz.length} câu)`,
        content: { questions: quiz, passingScore: lesson.passingScore },
        estimatedMinutes: 5,
        isRequired: true,
      });
    }

    // 7. Summary & Completion
    sections.push({
      id: `${lessonId}-sec-summary`,
      lessonId,
      order: order++,
      type: 'summary',
      title: 'Tổng kết bài học & Hoàn thành',
      content: { lessonTitle: lesson.title },
      estimatedMinutes: 1,
      isRequired: true,
    });

    return sections;
  }

  async getAllVocabulary(level?: HSKLevelNumber): Promise<Vocabulary[]> {
    if (level) {
      return ALL_VOCABULARY.filter((v) => v.hskLevel === level);
    }
    return ALL_VOCABULARY;
  }

  async searchVocabulary(query: string): Promise<Vocabulary[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_VOCABULARY.filter(
      (v) =>
        v.hanzi.includes(q) ||
        v.pinyin.toLowerCase().includes(q) ||
        v.meaningVi.toLowerCase().includes(q)
    );
  }

  async searchLessons(query: string): Promise<Lesson[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_CURRICULUM_LESSONS.filter(
      (l) =>
        l.isPublished &&
        (l.title.toLowerCase().includes(q) ||
          l.titleZh.includes(q) ||
          l.description.toLowerCase().includes(q))
    );
  }
}

export const curriculumRepository: CurriculumRepository = new InMemoryCurriculumRepository();
