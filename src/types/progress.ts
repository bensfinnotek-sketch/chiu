export interface LearningProgress {
  userId: string;
  totalStudyMinutes: number;
  lessonsCompleted: number;
  wordsLearned: number;
  speakingMinutes: number;
  conversationsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  updatedAt: string;
}

export interface ProgressSummary {
  progress: LearningProgress;
  recentActivity: Array<{
    type: 'lesson' | 'speaking' | 'review';
    title: string;
    timestamp: string;
    durationMinutes?: number;
  }>;
}
