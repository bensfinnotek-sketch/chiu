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
  recordVocabularyReview(
    userId: string,
    hanzi: string,
    hskLevel: HSKLevelNumber | undefined,
    isCorrect: boolean
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

  async recordVocabularyReview(
    userId: string,
    hanzi: string,
    hskLevel: HSKLevelNumber | undefined,
    isCorrect: boolean
  ): Promise<void> {
    const normalizedHanzi = hanzi.trim();
    if (!normalizedHanzi) return;

    const list = this.getLocalList<UserVocabularyProgress>(LOCAL_VOCAB_PROGRESS_KEY);
    const vocabularyId = `hanzi:${normalizedHanzi}`;
    const idx = list.findIndex((v) => v.userId === userId && v.vocabularyId === vocabularyId);
    const now = new Date().toISOString();
    const nextStatus: UserVocabularyProgress['status'] = isCorrect ? 'known' : 'learning';

    if (idx >= 0) {
      const item = list[idx];
      item.status = nextStatus;
      item.exposureCount += 1;
      if (isCorrect) item.correctCount += 1;
      else item.incorrectCount += 1;
      item.lastSeenAt = now;
      if (item.status === 'mastered' && !item.masteredAt) item.masteredAt = now;
      item.updatedAt = now;
      list[idx] = item;
    } else {
      list.push({
        userId,
        vocabularyId,
        status: nextStatus,
        exposureCount: 1,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        lastSeenAt: now,
        masteredAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
    this.setLocalList(LOCAL_VOCAB_PROGRESS_KEY, list);

    // Keep the local skill profile in sync with review evidence.
    if (hskLevel) {
      await this.updateSkillScore(userId, 'vocabulary', hskLevel, isCorrect ? 5 : -7);
    }
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

// Supabase is the source of truth for authenticated users.
// LocalStorage is used only when Supabase is not configured.
export class SupabaseLessonProgressRepository implements LessonProgressRepository {
  async getProgress(userId: string): Promise<UserLessonProgress[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) {
      throw new Error(`Không thể tải tiến trình bài học: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
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
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<UserLessonProgress | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      throw new Error(`Không thể tải tiến trình bài học: ${error.message}`);
    }

    if (!data) return null;

    return {
      userId: data.user_id,
      lessonId: data.lesson_id,
      levelNumber: data.level_number || 1,
      status: data.status as LessonProgressStatus,
      progressPercent: data.progress_percent || 0,
      currentSectionId: data.current_section_id,
      score: data.score,
      attempts: data.attempts || 1,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      lastAccessedAt: data.last_accessed_at,
    };
  }

  async saveProgress(progress: UserLessonProgress): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.from('user_lesson_progress').upsert(
      {
        user_id: progress.userId,
        lesson_id: progress.lessonId,
        level_number: progress.levelNumber,
        status: progress.status,
        progress_percent: progress.progressPercent,
        current_section_id: progress.currentSectionId || null,
        score: progress.score ?? null,
        attempts: progress.attempts,
        started_at: progress.startedAt || new Date().toISOString(),
        completed_at: progress.completedAt || null,
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

    if (error) {
      throw new Error(`Không thể lưu tiến trình bài học: ${error.message}`);
    }
  }

  async markLessonStarted(
    userId: string,
    lessonId: string,
    levelNumber: HSKLevelNumber
  ): Promise<UserLessonProgress> {
    const existing = await this.getLessonProgress(userId, lessonId);
    const now = new Date().toISOString();

    const progress: UserLessonProgress = existing
      ? {
          ...existing,
          status:
            existing.status === 'completed' ? 'completed' : 'in_progress',
          attempts: existing.attempts + 1,
          lastAccessedAt: now,
        }
      : {
          userId,
          lessonId,
          levelNumber,
          status: 'in_progress',
          progressPercent: 10,
          attempts: 1,
          startedAt: now,
          completedAt: null,
          lastAccessedAt: now,
        };

    await this.saveProgress(progress);
    return progress;
  }

  async markLessonCompleted(
    userId: string,
    lessonId: string,
    score: number,
    levelNumber: HSKLevelNumber
  ): Promise<{ progress: UserLessonProgress; isFirstCompletion: boolean }> {
    const existing = await this.getLessonProgress(userId, lessonId);
    const isFirstCompletion = !existing || existing.status !== 'completed';
    const now = new Date().toISOString();

    const progress: UserLessonProgress = {
      userId,
      lessonId,
      levelNumber,
      status: 'completed',
      progressPercent: 100,
      score: Math.max(existing?.score || 0, score),
      attempts: (existing?.attempts || 0) + 1,
      startedAt: existing?.startedAt || now,
      completedAt: existing?.completedAt || now,
      lastAccessedAt: now,
    };

    await this.saveProgress(progress);

    if (isFirstCompletion && supabase) {
      const { data: aggregate, error: readError } = await supabase
        .from('learning_progress')
        .select('lessons_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (readError) {
        throw new Error(`Không thể cập nhật tổng số bài đã học: ${readError.message}`);
      }

      const { error: updateError } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: userId,
          lessons_completed: (aggregate?.lessons_completed || 0) + 1,
          updated_at: now,
        });

      if (updateError) {
        throw new Error(`Không thể cập nhật tổng số bài đã hoàn thành: ${updateError.message}`);
      }
    }

    return { progress, isFirstCompletion };
  }

  async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.from('quiz_attempts').insert({
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

    if (error) {
      throw new Error(`Không thể lưu kết quả bài kiểm tra: ${error.message}`);
    }
  }

  async getQuizAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('completed_at', { ascending: false });

    if (error) {
      throw new Error(`Không thể tải lịch sử bài kiểm tra: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      lessonId: d.lesson_id,
      score: d.score,
      totalPoints: d.total_points,
      earnedPoints: d.earned_points,
      correctAnswers: d.correct_answers,
      totalQuestions: d.total_questions,
      passed: d.passed,
      answers: d.answers || [],
      startedAt: d.started_at,
      completedAt: d.completed_at,
    }));
  }

  async getVocabularyProgress(userId: string): Promise<UserVocabularyProgress[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Không thể tải tiến độ từ vựng: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      userId: d.user_id,
      vocabularyId: d.vocabulary_id,
      status: d.status,
      exposureCount: d.exposure_count,
      correctCount: d.correct_count,
      incorrectCount: d.incorrect_count,
      lastSeenAt: d.last_seen_at,
      masteredAt: d.mastered_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  async updateVocabularyStatus(
    userId: string,
    vocabularyId: string,
    status: 'new' | 'learning' | 'known' | 'mastered',
    isCorrect?: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: existing, error: readError } = await supabase
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('vocabulary_id', vocabularyId)
      .maybeSingle();

    if (readError) {
      throw new Error(`Không thể đọc tiến độ từ vựng: ${readError.message}`);
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('user_vocabulary_progress').upsert(
      {
        user_id: userId,
        vocabulary_id: vocabularyId,
        status,
        exposure_count: (existing?.exposure_count || 0) + 1,
        correct_count: (existing?.correct_count || 0) + (isCorrect === true ? 1 : 0),
        incorrect_count: (existing?.incorrect_count || 0) + (isCorrect === false ? 1 : 0),
        last_seen_at: now,
        mastered_at: status === 'mastered' ? existing?.mastered_at || now : existing?.mastered_at || null,
        created_at: existing?.created_at || now,
        updated_at: now,
      },
      { onConflict: 'user_id,vocabulary_id' }
    );

    if (error) {
      throw new Error(`Không thể lưu tiến độ từ vựng: ${error.message}`);
    }
  }

  async recordVocabularyReview(
    userId: string,
    hanzi: string,
    hskLevel: HSKLevelNumber | undefined,
    isCorrect: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const normalizedHanzi = hanzi.trim();
    if (!normalizedHanzi) return;

    const { data: vocabulary, error: vocabularyError } = await supabase
      .from('vocabulary')
      .select('id,hsk_level')
      .eq('hanzi', normalizedHanzi)
      .limit(1)
      .maybeSingle();

    if (vocabularyError) {
      throw new Error(`Không thể tìm từ vựng để đồng bộ mastery: ${vocabularyError.message}`);
    }

    // AI-generated/personal words may not exist in the curriculum vocabulary table.
    // They still keep their SRS schedule, but only curriculum words contribute to
    // the HSK vocabulary mastery profile.
    if (!vocabulary?.id) return;

    await this.updateVocabularyStatus(
      userId,
      vocabulary.id,
      isCorrect ? 'known' : 'learning',
      isCorrect
    );

    const level = (hskLevel || vocabulary.hsk_level || 1) as HSKLevelNumber;
    await this.updateSkillScore(userId, 'vocabulary', level, isCorrect ? 5 : -7);
  }

  async getGrammarProgress(userId: string): Promise<UserGrammarProgress[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('user_grammar_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Không thể tải tiến độ ngữ pháp: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      userId: d.user_id,
      grammarPointId: d.grammar_point_id,
      exposureCount: d.exposure_count,
      correctCount: d.correct_count,
      incorrectCount: d.incorrect_count,
      masteryScore: d.mastery_score,
      lastPracticedAt: d.last_practiced_at,
    }));
  }

  async updateGrammarScore(
    userId: string,
    grammarPointId: string,
    isCorrect: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: existing, error: readError } = await supabase
      .from('user_grammar_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('grammar_point_id', grammarPointId)
      .maybeSingle();

    if (readError) {
      throw new Error(`Không thể đọc tiến độ ngữ pháp: ${readError.message}`);
    }

    const correctCount = (existing?.correct_count || 0) + (isCorrect ? 1 : 0);
    const incorrectCount = (existing?.incorrect_count || 0) + (isCorrect ? 0 : 1);
    const exposureCount = (existing?.exposure_count || 0) + 1;
    const masteryScore = Math.max(
      0,
      Math.min(100, (existing?.mastery_score || 0) + (isCorrect ? 15 : -10))
    );

    const { error } = await supabase.from('user_grammar_progress').upsert(
      {
        user_id: userId,
        grammar_point_id: grammarPointId,
        exposure_count: exposureCount,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        mastery_score: masteryScore,
        last_practiced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,grammar_point_id' }
    );

    if (error) {
      throw new Error(`Không thể lưu tiến độ ngữ pháp: ${error.message}`);
    }
  }

  async getSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Không thể tải tiến độ kỹ năng: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      userId: d.user_id,
      skill: d.skill,
      level: d.level,
      score: d.score,
      completedActivities: d.completed_activities,
      updatedAt: d.updated_at,
    }));
  }

  async updateSkillScore(
    userId: string,
    skill: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing',
    level: HSKLevelNumber,
    pointsDelta: number
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: existing, error: readError } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill', skill)
      .eq('level', level)
      .maybeSingle();

    if (readError) {
      throw new Error(`Không thể đọc tiến độ kỹ năng: ${readError.message}`);
    }

    const { error } = await supabase.from('user_skill_progress').upsert(
      {
        user_id: userId,
        skill,
        level,
        score: Math.max(0, Math.min(100, (existing?.score || 0) + pointsDelta)),
        completed_activities: (existing?.completed_activities || 0) + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,skill,level' }
    );

    if (error) {
      throw new Error(`Không thể lưu tiến độ kỹ năng: ${error.message}`);
    }
  }
}

export function getLessonProgressRepository(userId: string | null): LessonProgressRepository {
  if (userId && isSupabaseConfigured) {
    return new SupabaseLessonProgressRepository();
  }
  return new LocalStorageLessonProgressRepository();
}
