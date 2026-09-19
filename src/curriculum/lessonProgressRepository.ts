import {
  UserLessonProgress,
  UserVocabularyProgress,
  UserGrammarProgress,
  UserSkillProgress,
  QuizAttempt,
  HSKLevelNumber,
  LessonProgressStatus,
} from '../types/curriculum';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

const LOCAL_LESSON_PROGRESS_KEY = 'hanziai_curriculum_lesson_progress';
const LOCAL_VOCAB_PROGRESS_KEY = 'hanziai_curriculum_vocab_progress';
const LOCAL_GRAMMAR_PROGRESS_KEY = 'hanziai_curriculum_grammar_progress';
const LOCAL_QUIZ_ATTEMPTS_KEY = 'hanziai_curriculum_quiz_attempts';
const LOCAL_SKILL_PROGRESS_KEY = 'hanziai_curriculum_skill_progress';

export interface LessonProgressRepository {
  getProgress(userId: string): Promise<UserLessonProgress[]>;
  getLessonProgress(userId: string, lessonId: string): Promise<UserLessonProgress | null>;
  saveProgress(progress: UserLessonProgress): Promise<void>;
  markLessonStarted(userId: string, lessonId: string, levelNumber: HSKLevelNumber): Promise<UserLessonProgress>;
  markLessonCompleted(
    userId: string,
    lessonId: string,
    score: number,
    levelNumber: HSKLevelNumber
  ): Promise<{ progress: UserLessonProgress; isFirstCompletion: boolean }>;
  saveQuizAttempt(attempt: QuizAttempt): Promise<void>;
  getQuizAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]>;
  getVocabularyProgress(userId: string): Promise<UserVocabularyProgress[]>;
  updateVocabularyStatus(
    userId: string,
    vocabularyId: string,
    status: 'new' | 'learning' | 'known' | 'mastered',
    isCorrect?: boolean
  ): Promise<void>;
  getGrammarProgress(userId: string): Promise<UserGrammarProgress[]>;
  updateGrammarScore(userId: string, grammarPointId: string, isCorrect: boolean): Promise<void>;
  getSkillProgress(userId: string): Promise<UserSkillProgress[]>;
  updateSkillScore(
    userId: string,
    skill: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing',
    level: HSKLevelNumber,
    pointsDelta: number
  ): Promise<void>;
}

export class LocalStorageLessonProgressRepository implements LessonProgressRepository {
  private getLocalList<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalList<T>(key: string, list: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  async getProgress(userId: string): Promise<UserLessonProgress[]> {
    const list = this.getLocalList<UserLessonProgress>(LOCAL_LESSON_PROGRESS_KEY);
    return list.filter((p) => p.userId === userId);
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<UserLessonProgress | null> {
    const list = await this.getProgress(userId);
    return list.find((p) => p.lessonId === lessonId) || null;
  }

  async saveProgress(progress: UserLessonProgress): Promise<void> {
    const list = this.getLocalList<UserLessonProgress>(LOCAL_LESSON_PROGRESS_KEY);
    const idx = list.findIndex(
      (p) => p.userId === progress.userId && p.lessonId === progress.lessonId
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...progress, lastAccessedAt: new Date().toISOString() };
    } else {
      list.push({ ...progress, lastAccessedAt: new Date().toISOString() });
    }
    this.setLocalList(LOCAL_LESSON_PROGRESS_KEY, list);
  }

  async markLessonStarted(
    userId: string,
    lessonId: string,
    levelNumber: HSKLevelNumber
  ): Promise<UserLessonProgress> {
    const existing = await this.getLessonProgress(userId, lessonId);
    if (existing) {
      if (existing.status === 'available' || existing.status === 'locked') {
        existing.status = 'in_progress';
      }
      existing.attempts += 1;
      existing.lastAccessedAt = new Date().toISOString();
      await this.saveProgress(existing);
      return existing;
    }

    const newProg: UserLessonProgress = {
      userId,
      lessonId,
      levelNumber,
      status: 'in_progress',
      progressPercent: 10,
      attempts: 1,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    await this.saveProgress(newProg);
    return newProg;
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
    score: number,
    levelNumber: HSKLevelNumber
  ): Promise<{ progress: UserLessonProgress; isFirstCompletion: boolean }> {
    const existing = await this.getLessonProgress(userId, lessonId);
    const isFirst = !existing || existing.status !== 'completed';

    const prog: UserLessonProgress = {
      userId,
      lessonId,
      levelNumber,
      status: 'completed',
      progressPercent: 100,
      score: Math.max(existing?.score || 0, score),
      attempts: (existing?.attempts || 0) + 1,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: existing?.completedAt || new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    await this.saveProgress(prog);
    return { progress: prog, isFirstCompletion: isFirst };
  }

  async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    const list = this.getLocalList<QuizAttempt>(LOCAL_QUIZ_ATTEMPTS_KEY);
    list.push(attempt);
    this.setLocalList(LOCAL_QUIZ_ATTEMPTS_KEY, list);
  }

  async getQuizAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]> {
    const list = this.getLocalList<QuizAttempt>(LOCAL_QUIZ_ATTEMPTS_KEY);
    return list.filter((a) => a.userId === userId && a.lessonId === lessonId);
  }

  async getVocabularyProgress(userId: string): Promise<UserVocabularyProgress[]> {
    const list = this.getLocalList<UserVocabularyProgress>(LOCAL_VOCAB_PROGRESS_KEY);
    return list.filter((v) => v.userId === userId);
  }

  async updateVocabularyStatus(
    userId: string,
    vocabularyId: string,
    status: 'new' | 'learning' | 'known' | 'mastered',
    isCorrect?: boolean
  ): Promise<void> {
    const list = this.getLocalList<UserVocabularyProgress>(LOCAL_VOCAB_PROGRESS_KEY);
    const idx = list.findIndex((v) => v.userId === userId && v.vocabularyId === vocabularyId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      const item = list[idx];
      item.status = status;
      item.exposureCount += 1;
      if (isCorrect === true) item.correctCount += 1;
      if (isCorrect === false) item.incorrectCount += 1;
      item.lastSeenAt = now;
      if (status === 'mastered' && !item.masteredAt) item.masteredAt = now;
      item.updatedAt = now;
      list[idx] = item;
    } else {
      list.push({
        userId,
        vocabularyId,
        status,
        exposureCount: 1,
        correctCount: isCorrect === true ? 1 : 0,
        incorrectCount: isCorrect === false ? 1 : 0,
        lastSeenAt: now,
        masteredAt: status === 'mastered' ? now : null,
        createdAt: now,
        updatedAt: now,
      });
    }
    this.setLocalList(LOCAL_VOCAB_PROGRESS_KEY, list);
  }

  async getGrammarProgress(userId: string): Promise<UserGrammarProgress[]> {
    const list = this.getLocalList<UserGrammarProgress>(LOCAL_GRAMMAR_PROGRESS_KEY);
    return list.filter((g) => g.userId === userId);
  }

  async updateGrammarScore(
    userId: string,
    grammarPointId: string,
    isCorrect: boolean
  ): Promise<void> {
    const list = this.getLocalList<UserGrammarProgress>(LOCAL_GRAMMAR_PROGRESS_KEY);
    const idx = list.findIndex(
      (g) => g.userId === userId && g.grammarPointId === grammarPointId
    );
    const now = new Date().toISOString();

    if (idx >= 0) {
      const g = list[idx];
      g.exposureCount += 1;
      if (isCorrect) {
        g.correctCount += 1;
        g.masteryScore = Math.min(100, g.masteryScore + 15);
      } else {
        g.incorrectCount += 1;
        g.masteryScore = Math.max(0, g.masteryScore - 10);
      }
      g.lastPracticedAt = now;
      list[idx] = g;
    } else {
      list.push({
        userId,
        grammarPointId,
        exposureCount: 1,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        masteryScore: isCorrect ? 25 : 10,
        lastPracticedAt: now,
      });
    }
    this.setLocalList(LOCAL_GRAMMAR_PROGRESS_KEY, list);
  }

  async getSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    const list = this.getLocalList<UserSkillProgress>(LOCAL_SKILL_PROGRESS_KEY);
    return list.filter((s) => s.userId === userId);
  }

  async updateSkillScore(
    userId: string,
    skill: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing',
    level: HSKLevelNumber,
    pointsDelta: number
  ): Promise<void> {
    const list = this.getLocalList<UserSkillProgress>(LOCAL_SKILL_PROGRESS_KEY);
    const idx = list.findIndex(
      (s) => s.userId === userId && s.skill === skill && s.level === level
    );
    const now = new Date().toISOString();

    if (idx >= 0) {
      const item = list[idx];
      item.score = Math.max(0, Math.min(100, item.score + pointsDelta));
      item.completedActivities += 1;
      item.updatedAt = now;
      list[idx] = item;
    } else {
      list.push({
        userId,
        skill,
        level,
        score: Math.max(0, Math.min(100, 50 + pointsDelta)),
        completedActivities: 1,
        updatedAt: now,
      });
    }
    this.setLocalList(LOCAL_SKILL_PROGRESS_KEY, list);
  }
}

// Supabase Hybrid with local cache
export class SupabaseLessonProgressRepository implements LessonProgressRepository {
  private localFallback = new LocalStorageLessonProgressRepository();

  async getProgress(userId: string): Promise<UserLessonProgress[]> {
    if (!isSupabaseConfigured || !supabase) return this.localFallback.getProgress(userId);
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) {
        return this.localFallback.getProgress(userId);
      }

      return data.map((d: any) => ({
        userId: d.user_id,
        lessonId: d.lesson_id,
        levelNumber: d.level_number || 1,
        status: d.status as LessonProgressStatus,
        progressPercent: d.progress_percent || 0,
        currentSectionId: d.current_section_id,
        score: d.score,
        attempts: d.attempts || 1,
        startedAt: d.started_at,
        completedAt: d.completed_at,
        lastAccessedAt: d.last_accessed_at,
      }));
    } catch {
      return this.localFallback.getProgress(userId);
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<UserLessonProgress | null> {
    const all = await this.getProgress(userId);
    return all.find((p) => p.lessonId === lessonId) || null;
  }

  async saveProgress(progress: UserLessonProgress): Promise<void> {
    await this.localFallback.saveProgress(progress);
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase.from('user_lesson_progress').upsert({
        user_id: progress.userId,
        lesson_id: progress.lessonId,
        level_number: progress.levelNumber,
        status: progress.status,
        progress_percent: progress.progressPercent,
        current_section_id: progress.currentSectionId || null,
        score: progress.score || null,
        attempts: progress.attempts,
        started_at: progress.startedAt || new Date().toISOString(),
        completed_at: progress.completedAt || null,
        last_accessed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Cloud lesson progress sync failed, local progress preserved:', e);
    }
  }

  async markLessonStarted(
    userId: string,
    lessonId: string,
    levelNumber: HSKLevelNumber
  ): Promise<UserLessonProgress> {
    const res = await this.localFallback.markLessonStarted(userId, lessonId, levelNumber);
    if (isSupabaseConfigured && supabase) {
      try {
        await this.saveProgress(res);
      } catch {}
    }
    return res;
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
    score: number,
    levelNumber: HSKLevelNumber
  ): Promise<{ progress: UserLessonProgress; isFirstCompletion: boolean }> {
    const res = await this.localFallback.markLessonCompleted(
      userId,
      lessonId,
      score,
      levelNumber
    );
    if (isSupabaseConfigured && supabase) {
      try {
        await this.saveProgress(res.progress);
        // Also increment aggregate if first completion
        if (res.isFirstCompletion) {
          const { data: prog } = await supabase
            .from('learning_progress')
            .select('lessons_completed')
            .eq('user_id', userId)
            .single();
          const currentCount = prog?.lessons_completed || 0;
          await supabase
            .from('learning_progress')
            .update({ lessons_completed: currentCount + 1 })
            .eq('user_id', userId);
        }
      } catch (e) {
        console.warn('Cloud sync completion warning:', e);
      }
    }
    return res;
  }

  async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    await this.localFallback.saveQuizAttempt(attempt);
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('quiz_attempts').insert({
        id: attempt.id,
        user_id: attempt.userId,
        lesson_id: attempt.lessonId,
        score: attempt.score,
        total_points: attempt.totalPoints,
        earned_points: attempt.earnedPoints,
        correct_answers: attempt.correctAnswers,
        total_questions: attempt.totalQuestions,
        passed: attempt.passed,
        answers: attempt.answers,
        started_at: attempt.startedAt,
        completed_at: attempt.completedAt,
      });
    } catch (e) {
      console.warn('Cloud quiz attempt sync warning:', e);
    }
  }

  async getQuizAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]> {
    return this.localFallback.getQuizAttempts(userId, lessonId);
  }

  async getVocabularyProgress(userId: string): Promise<UserVocabularyProgress[]> {
    return this.localFallback.getVocabularyProgress(userId);
  }

  async updateVocabularyStatus(
    userId: string,
    vocabularyId: string,
    status: 'new' | 'learning' | 'known' | 'mastered',
    isCorrect?: boolean
  ): Promise<void> {
    await this.localFallback.updateVocabularyStatus(userId, vocabularyId, status, isCorrect);
  }

  async getGrammarProgress(userId: string): Promise<UserGrammarProgress[]> {
    return this.localFallback.getGrammarProgress(userId);
  }

  async updateGrammarScore(
    userId: string,
    grammarPointId: string,
    isCorrect: boolean
  ): Promise<void> {
    await this.localFallback.updateGrammarScore(userId, grammarPointId, isCorrect);
  }

  async getSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    return this.localFallback.getSkillProgress(userId);
  }

  async updateSkillScore(
    userId: string,
    skill: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing',
    level: HSKLevelNumber,
    pointsDelta: number
  ): Promise<void> {
    await this.localFallback.updateSkillScore(userId, skill, level, pointsDelta);
  }
}

export function getLessonProgressRepository(userId: string | null): LessonProgressRepository {
  if (userId && isSupabaseConfigured) {
    return new SupabaseLessonProgressRepository();
  }
  return new LocalStorageLessonProgressRepository();
}
