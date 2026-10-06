import type { UserProfile } from "../types";
import { HSK1_LESSONS } from "../learning/content";
import { learningEngine } from "../learning/engine";
import { aiMemoryService } from "./aiMemory";
import type { SpeakingSessionSnapshot } from "./speakingSession";

export type LearningLoopDecision =
  | "review_weakness"
  | "review_srs"
  | "practice_conversation"
  | "practice_pronunciation"
  | "learn_new";

export interface LearningLoopPlan {
  decision: LearningLoopDecision;
  focus: "grammar" | "vocabulary" | "pronunciation" | "conversation" | "lesson";
  difficulty: "easy" | "normal" | "challenge";
  lessonId: string;
  vocabularyIds: string[];
  reason: string;
  confidence: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function buildLearningLoopPlan(
  profile: UserProfile,
  session?: SpeakingSessionSnapshot | null,
): LearningLoopPlan {
  const state = learningEngine.getState();
  const memory = aiMemoryService.getState();
  const due = learningEngine.dueReviews(6);
  const unresolved = memory.mistakes
    .filter(item => !item.resolved)
    .sort((a, b) => b.priority - a.priority || b.frequency - a.frequency)
    .slice(0, 5);

  const sessionScore = session?.turns.length ? session.score : null;
  const weakGrammar = unresolved.filter(item => item.type === "grammar" || item.type === "word-order");
  const weakPronunciation = unresolved.filter(item => item.type === "pronunciation" || item.type === "tone");
  const weakVocabulary = unresolved.filter(item => item.type === "vocabulary");

  const vocabularyIds = Array.from(new Set([
    ...due.map(item => item.vocabularyId),
    ...unresolved.flatMap(item => item.relatedVocabulary || []),
  ])).slice(0, 6);

  const nextLesson =
    HSK1_LESSONS.find(item => !state.progress.completedLessons.includes(item.id)) ||
    HSK1_LESSONS[0];

  let decision: LearningLoopDecision = "learn_new";
  let focus: LearningLoopPlan["focus"] = "lesson";
  let reason = "Tiếp tục bài học mới để mở rộng nền tảng.";
  let confidence = 0.62;

  if (weakPronunciation.length > 0 && (sessionScore === null || sessionScore < 75)) {
    decision = "practice_pronunciation";
    focus = "pronunciation";
    reason = "Ưu tiên sửa lỗi phát âm hoặc thanh điệu đang lặp lại trước khi tăng độ khó.";
    confidence = 0.9;
  } else if (weakGrammar.length > 0 && (sessionScore === null || sessionScore < 78)) {
    decision = "review_weakness";
    focus = "grammar";
    reason = "Có lỗi ngữ pháp hoặc trật tự từ lặp lại; ôn ngắn trước rồi quay lại hội thoại.";
    confidence = 0.88;
  } else if (weakVocabulary.length > 0 || due.length >= 3) {
    decision = weakVocabulary.length > 0 ? "review_weakness" : "review_srs";
    focus = "vocabulary";
    reason = due.length
      ? `Có ${due.length} từ đến hạn ôn; ưu tiên SRS để giữ trí nhớ dài hạn.`
      : "Có từ vựng đang yếu; ôn đúng mục tiêu thay vì nhồi từ mới.";
    confidence = 0.84;
  } else if (sessionScore !== null && sessionScore >= 88) {
    decision = "practice_conversation";
    focus = "conversation";
    reason = "Phiên vừa rồi ổn định; tăng thử thách bằng hội thoại tự do hơn.";
    confidence = 0.86;
  }

  const errorLoad = unresolved.reduce((sum, item) => sum + item.frequency, 0);
  const difficulty =
    errorLoad >= 6 || (sessionScore !== null && sessionScore < 65)
      ? "easy"
      : sessionScore !== null && sessionScore >= 90 && errorLoad <= 1
        ? "challenge"
        : "normal";

  return {
    decision,
    focus,
    difficulty,
    lessonId: nextLesson.id,
    vocabularyIds,
    reason,
    confidence: Number(clamp(confidence, 0.4, 0.98).toFixed(2)),
  };
}

export function completeLearningLoop(
  profile: UserProfile,
  session: SpeakingSessionSnapshot,
): LearningLoopPlan {
  return buildLearningLoopPlan(profile, session);
}
