export type LearningGoal = 'travel' | 'work' | 'conversation' | 'hsk' | 'school' | 'culture';
export type SkillLevel = 'new' | 'basic' | 'intermediate' | 'advanced';

export interface User { id: string; name: string; email?: string; }
export interface UserProfile { name: string; goal: LearningGoal; level: SkillLevel; dailyMinutes: 5 | 10 | 15 | 20; currentHsk: number; targetHsk: number; streak: number; vocabularyLearned: number; lessonsCompleted: number; pronunciationProgress: number; }
export interface Vocabulary { id: string; hanzi: string; pinyin: string; meaningVi: string; example: string; examplePinyin: string; exampleVi: string; }
export interface Lesson { id: string; level: number; lessonNumber: number; title: string; progress: number; sections: Array<'vocabulary'|'grammar'|'listening'|'speaking'|'roleplay'|'review'>; vocabulary: Vocabulary[]; }
export interface LessonProgress { lessonId: string; progress: number; completedSections: string[]; }
export interface ConversationMessage { id: string; role: 'user'|'assistant'; chinese: string; pinyin: string; vietnamese: string; }
export interface Conversation { id: string; messages: ConversationMessage[]; }
export interface Flashcard { id: string; vocabularyId: string; front: string; back: string; }
export interface Review { flashcardId: string; rating: 'again'|'hard'|'good'|'easy'; reviewedAt: string; }
export interface Mistake { id: string; chinese: string; correction: string; explanation: string; }
export interface UserMemory { recentWords: string[]; weakPoints: string[]; }
