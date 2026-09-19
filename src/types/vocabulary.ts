export interface UserVocabulary {
  id: string;
  userId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel?: number;
  status: 'new' | 'learning' | 'learned';
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
}
