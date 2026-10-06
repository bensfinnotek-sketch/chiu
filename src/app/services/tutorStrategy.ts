import type { UserProfile } from "../types";
import { aiMemoryService } from "./aiMemory";
import { learningEngine } from "../learning/engine";

export interface TutorStrategy {
  focus: "conversation" | "vocabulary" | "grammar" | "pronunciation";
  difficulty: "easy" | "normal" | "challenge";
  reason: string;
  targets: string[];
  avoidRepeating: string[];
}

export function buildTutorStrategy(profile?: UserProfile | null): TutorStrategy {
  const state = aiMemoryService.getState();
  const mistakes = state.mistakes.filter(m => !m.resolved).sort((a, b) => b.priority - a.priority || b.frequency - a.frequency).slice(0, 4);
  const due = learningEngine.dueReviews(4).map(item => item.vocabularyId);
  const targets = Array.from(new Set([...mistakes.map(m => m.relatedVocabulary || []).flat(), ...due])).filter(Boolean).slice(0, 6);
  const grammarCount = mistakes.filter(m => m.type === "grammar" || m.type === "word-order").length;
  const pronunciationCount = mistakes.filter(m => m.type === "pronunciation" || m.type === "tone").length;
  const vocabularyCount = mistakes.filter(m => m.type === "vocabulary").length;
  const focus = pronunciationCount >= Math.max(grammarCount, vocabularyCount) && pronunciationCount > 0 ? "pronunciation" : grammarCount >= vocabularyCount && grammarCount > 0 ? "grammar" : vocabularyCount > 0 ? "vocabulary" : "conversation";
  const errorLoad = mistakes.reduce((sum, m) => sum + m.frequency, 0);
  const difficulty = errorLoad >= 6 ? "easy" : errorLoad <= 1 && (profile?.currentHsk || 1) >= 2 ? "challenge" : "normal";
  return {
    focus,
    difficulty,
    reason: mistakes.length ? `Ưu tiên sửa ${mistakes[0].type} lặp lại trước, rồi quay lại hội thoại tự nhiên.` : "Chưa có lỗi lặp lại rõ ràng; ưu tiên phản xạ hội thoại và từ đang đến hạn.",
    targets,
    avoidRepeating: state.conversationSummaries.slice(0, 3),
  };
}
